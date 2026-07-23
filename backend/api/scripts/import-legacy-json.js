require('dotenv').config({ path: '../../.env' });
const fs = require('node:fs');
const path = require('node:path');
const prisma = require('../src/config/prisma');

const source = process.argv[2];
if (!source) throw new Error('Uso: node scripts/import-legacy-json.js <carpeta-exportada>');

const value = item => {
  if (Array.isArray(item)) return item.map(value);
  if (item && typeof item === 'object') {
    if ('$oid' in item) return item.$oid;
    if ('$date' in item) return new Date(item.$date);
    if ('$numberDecimal' in item) return Number(item.$numberDecimal);
    return Object.fromEntries(Object.entries(item).map(([key,val]) => [key,value(val)]));
  }
  return item;
};
const read = name => {
  const file = path.resolve(source, `${name}.json`);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file,'utf8').trim();
  if (!raw) return [];
  try { const parsed = JSON.parse(raw); return value(Array.isArray(parsed) ? parsed : [parsed]); }
  catch { return raw.split(/\r?\n/).filter(Boolean).map(line => value(JSON.parse(line))); }
};
const clean = (row, extras = {}) => {
  const { _id, __v, ...rest } = row;
  for (const key of ['created_at','updated_at','valid_until','deadline']) if (rest[key]) rest[key] = new Date(rest[key]);
  return { id: _id, ...rest, ...extras };
};
async function many(model, rows) {
  if (!rows.length) return;
  await prisma[model].createMany({ data: rows, skipDuplicates:true });
  console.log(`${model}: ${rows.length}`);
}
async function run() {
  await many('user', read('users').map(clean));
  await many('category', read('categories').map(clean));
  await many('brand', read('brands').map(clean));
  await many('customer', read('customers').map(clean));
  await many('product', read('products').map(row => clean(row,{ images:row.images||[], image_public_ids:row.image_public_ids||[] })));
  for (const row of read('suppliers')) {
    const brands = (row.brands||[]).map(id=>({id}));
    await prisma.supplier.upsert({ where:{id:row._id}, update:{}, create:{...clean(row),brands:brands.length?{connect:brands}:undefined} });
  }
  await many('inventoryMovement', read('inventory_movements').map(row=>clean(row,{created_by_id:row.created_by})).map(({created_by,...row})=>row));
  await many('quote', read('quotes').map(row=>clean(row,{created_by_id:row.created_by})).map(({created_by,...row})=>row));
  await many('order', read('orders').map(clean));
  await many('invoice', read('invoices').map(row=>clean(row,{created_by_id:row.created_by})).map(({created_by,...row})=>row));
  await many('quoteRequest', read('quoterequests').map(clean));
  await many('contact', read('contacts').map(clean));
}
run().then(()=>console.log('Importación PostgreSQL completada.')).catch(error=>{console.error(error);process.exitCode=1}).finally(()=>prisma.$disconnect());
