const Product = require('./product.model');

function productPayload(body = {}) {
  const relationId = (value) => value?._id || value?.id || value || null;
  const numeric = (value, fallback, field) => {
    const parsed = value === '' || value == null ? fallback : Number(value);
    if (!Number.isFinite(parsed)) {
      const error = new Error(`El campo ${field} debe contener un número válido.`);
      error.statusCode = 400;
      throw error;
    }
    return parsed;
  };
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'sku')) payload.sku = body.sku?.trim() || null;
  if (Object.prototype.hasOwnProperty.call(body, 'name')) payload.name = String(body.name || '').trim();
  if (Object.prototype.hasOwnProperty.call(body, 'description')) payload.description = String(body.description || '');
  if (Object.prototype.hasOwnProperty.call(body, 'category_id')) payload.category_id = relationId(body.category_id);
  if (Object.prototype.hasOwnProperty.call(body, 'brand_id')) payload.brand_id = relationId(body.brand_id);
  if (Object.prototype.hasOwnProperty.call(body, 'unit_price')) payload.unit_price = numeric(body.unit_price, 0, 'precio unitario');
  if (Object.prototype.hasOwnProperty.call(body, 'cost_price')) payload.cost_price = numeric(body.cost_price, 0, 'costo');
  if (Object.prototype.hasOwnProperty.call(body, 'minimum_stock')) {
    payload.minimum_stock = Math.max(0, Math.trunc(numeric(body.minimum_stock, 5, 'stock mínimo')));
  }
  if (Object.prototype.hasOwnProperty.call(body, 'technical_specs')) payload.technical_specs = body.technical_specs || {};
  if (Object.prototype.hasOwnProperty.call(body, 'status')) payload.status = body.status;
  if (body.current_stock !== undefined) {
    payload.current_stock = Math.max(0, Math.trunc(numeric(body.current_stock, 0, 'existencias disponibles')));
  }
  return payload;
}

async function getAll(req, res, next) {
  try {
    const {
      page = 1, limit = 20, category, brand, status = 'active', search, sort = '-created_at',
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category_id = category;
    if (brand) filter.brand_id = brand;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category_id', 'name')
        .populate('brand_id', 'name')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category_id', 'name')
      .populate('brand_id', 'name');
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ data: product });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const product = await Product.create(productPayload(req.body));
    res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, productPayload(req.body), {
      new: true, runValidators: true,
    });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ data: product });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto desactivado', data: product });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, update, remove, _test: { productPayload } };
