const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

const relations = {
  product: { category_id: 'category', brand_id: 'brand' },
  inventoryMovement: { product_id: 'product', created_by: 'created_by' },
  quote: { customer_id: 'customer', created_by: 'created_by' },
  invoice: { customer_id: 'customer', created_by: 'created_by' },
  supplier: { brands: 'brands' },
};

const searchFields = {
  product: ['name', 'description', 'sku'],
  customer: ['name', 'nit'],
};

function scalar(value) {
  if (value && typeof value.toNumber === 'function') return value.toNumber();
  if (Array.isArray(value)) return value.map(scalar);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scalar(v)]));
  }
  return value;
}

function output(model, row, selected = '') {
  if (!row) return null;
  const result = scalar(row);
  result._id = result.id;
  const map = relations[model] || {};
  for (const [legacy, relation] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(result, relation)) {
      result[legacy] = result[relation];
      if (legacy !== relation) delete result[relation];
    }
  }
  if (selected.includes('-password_hash')) delete result.password_hash;
  return result;
}

function where(model, filter = {}) {
  const result = {};
  for (const [key, value] of Object.entries(filter || {})) {
    if (key === '$text') {
      const term = value?.$search || '';
      result.OR = (searchFields[model] || ['name']).map(field => ({ [field]: { contains: term, mode: 'insensitive' } }));
      continue;
    }
    if (key === '$expr') {
      result.current_stock = { lte: prisma.product.fields.minimum_stock };
      continue;
    }
    const field = key === '_id' ? 'id' : key === 'created_by' ? 'created_by_id' : key;
    if (value instanceof RegExp) {
      result[field] = { startsWith: value.source.replace(/^\^/, '').replace(/\\-/g, '-') };
    } else if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
      const op = {};
      if ('$gte' in value) op.gte = value.$gte;
      if ('$lte' in value) op.lte = value.$lte;
      if ('$lt' in value) op.lt = value.$lt;
      if ('$gt' in value) op.gt = value.$gt;
      if ('$in' in value) op.in = value.$in;
      if ('$ne' in value) op.not = value.$ne;
      result[field] = Object.keys(op).length ? op : value;
    } else result[field] = value;
  }
  return result;
}

function dataFor(model, input = {}) {
  const data = { ...input };
  delete data._id; delete data.id; delete data.created_at; delete data.updated_at;
  if ('created_by' in data) { data.created_by_id = data.created_by?._id || data.created_by; delete data.created_by; }
  if (model === 'category' && data.name && !data.slug) data.slug = data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return data;
}

class Query {
  constructor(model, action, args = {}) { this.model = model; this.action = action; this.args = args; this.selected = ''; }
  populate(path) {
    const relation = relations[this.model]?.[path] || (path === 'items.product_id' ? null : path);
    if (relation) {
      this.args.include ||= {};
      this.args.include[relation] = true;
    }
    return this;
  }
  sort(spec) {
    const value = typeof spec === 'string' ? spec : Object.keys(spec || {})[0];
    if (value) {
      const desc = value.startsWith('-') || spec?.[value] === -1;
      this.args.orderBy = { [value.replace(/^-/, '')]: desc ? 'desc' : 'asc' };
    }
    return this;
  }
  skip(value) { this.args.skip = Number(value); return this; }
  limit(value) { this.args.take = Number(value); return this; }
  select(value) { this.selected = String(value || ''); return this; }
  lean() { return this; }
  async exec() {
    const row = await prisma[this.model][this.action](this.args);
    return Array.isArray(row) ? row.map(item => output(this.model, item, this.selected)) : (row ? document(this.model, row, this.selected) : null);
  }
  then(resolve, reject) { return this.exec().then(resolve, reject); }
}

function model(name) {
  const db = prisma[name];
  return {
    find(filter = {}) { return new Query(name, 'findMany', { where: where(name, filter) }); },
    findOne(filter = {}) { return new Query(name, 'findFirst', { where: where(name, filter) }); },
    findById(id) { return new Query(name, 'findUnique', { where: { id: String(id) } }); },
    countDocuments(filter = {}) { return db.count({ where: where(name, filter) }); },
    async create(input) {
      if (Array.isArray(input)) return Promise.all(input.map(item => this.create(item)));
      const data = dataFor(name, input);
      if (name === 'user') data.password_hash = await bcrypt.hash(data.password_hash, 12);
      if (name === 'order' && !data.order_number) {
        const year = new Date().getFullYear();
        const count = await prisma.order.count({ where: { created_at: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } } });
        data.order_number = `PED-${year}-${String(count + 1).padStart(5, '0')}`;
      }
      if (name === 'supplier' && Array.isArray(data.brands)) {
        data.brands = { connect: data.brands.map(id => ({ id: id?._id || id })) };
      }
      const row = await db.create({ data });
      return document(name, row);
    },
    findByIdAndUpdate(id, changes) {
      const data = dataFor(name, changes);
      if (name === 'supplier' && Array.isArray(data.brands)) data.brands = { set: data.brands.map(value => ({ id: value?._id || value })) };
      return new Query(name, 'update', { where: { id: String(id) }, data });
    },
    async findByIdAndDelete(id) { return output(name, await db.delete({ where: { id: String(id) } })); },
    async deleteMany(filter = {}) { return db.deleteMany({ where: where(name, filter) }); },
  };
}

function document(name, row, selected = '') {
  const doc = output(name, row, selected);
  Object.defineProperty(doc, 'toObject', { enumerable: false, value: () => ({ ...doc }) });
  Object.defineProperty(doc, 'comparePassword', { enumerable: false, value: candidate => bcrypt.compare(candidate, doc.password_hash) });
  Object.defineProperty(doc, 'save', { enumerable: false, value: async () => {
    const data = dataFor(name, doc);
    if (name === 'user' && data.password_hash !== row.password_hash) data.password_hash = await bcrypt.hash(data.password_hash, 12);
    const saved = await prisma[name].update({ where: { id: row.id }, data });
    Object.assign(doc, output(name, saved));
    return doc;
  }});
  return doc;
}

module.exports = model;
