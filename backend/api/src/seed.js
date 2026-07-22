/**
 * Seed script — Populate database with initial data for development
 * Run: pnpm --filter @integra/api seed
 */
require('dotenv').config({ path: '../../.env' });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/database');
const User = require('./modules/auth/user.model');
const Category = require('./modules/categories/category.model');
const Brand = require('./modules/brands/brand.model');
const Product = require('./modules/products/product.model');
const Customer = require('./modules/customers/customer.model');
const Supplier = require('./modules/suppliers/supplier.model');

async function seed() {
  await connectDB();
  console.log('🌱 Iniciando seed de datos...\n');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Product.deleteMany({}),
    Customer.deleteMany({}),
    Supplier.deleteMany({}),
  ]);

  // Users
  const users = await User.create([
    { name: 'Admin Principal', email: 'admin@integrasutec.com', password_hash: 'Admin123!', role: 'admin' },
    { name: 'Carlos Méndez', email: 'carlos@integrasutec.com', password_hash: 'Seller123!', role: 'seller' },
    { name: 'María López', email: 'maria@integrasutec.com', password_hash: 'Manager123!', role: 'manager' },
  ]);
  console.log(`✅ ${users.length} usuarios creados`);

  // Categories
  const categories = await Category.create([
    { name: 'Computadoras y Laptops', description: 'Equipos de cómputo portátiles y de escritorio', icon: '💻' },
    { name: 'Redes y Conectividad', description: 'Routers, switches, access points y cableado', icon: '🌐' },
    { name: 'Impresoras y Escáneres', description: 'Equipos de impresión y digitalización', icon: '🖨️' },
    { name: 'Almacenamiento', description: 'Discos duros, SSD, memorias USB y NAS', icon: '💾' },
    { name: 'Accesorios', description: 'Teclados, mouses, monitores y periféricos', icon: '🖱️' },
    { name: 'Software y Licencias', description: 'Licencias de software empresarial', icon: '📀' },
    { name: 'Servidores', description: 'Servidores rack, torre y componentes', icon: '🖥️' },
    { name: 'Seguridad', description: 'Cámaras, UPS, reguladores y antivirus', icon: '🔒' },
  ]);
  console.log(`✅ ${categories.length} categorías creadas`);

  // Brands
  const brands = await Brand.create([
    { name: 'HP', website: 'https://www.hp.com' },
    { name: 'Dell', website: 'https://www.dell.com' },
    { name: 'Lenovo', website: 'https://www.lenovo.com' },
    { name: 'Cisco', website: 'https://www.cisco.com' },
    { name: 'Epson', website: 'https://www.epson.com' },
    { name: 'TP-Link', website: 'https://www.tp-link.com' },
    { name: 'Western Digital', website: 'https://www.westerndigital.com' },
    { name: 'Logitech', website: 'https://www.logitech.com' },
    { name: 'Microsoft', website: 'https://www.microsoft.com' },
    { name: 'APC', website: 'https://www.apc.com' },
  ]);
  console.log(`✅ ${brands.length} marcas creadas`);

  const catMap = {};
  categories.forEach((c) => { catMap[c.name] = c._id; });
  const brMap = {};
  brands.forEach((b) => { brMap[b.name] = b._id; });

  // Products
  const products = await Product.create([
    {
      sku: 'HP-LAP-450G10', name: 'HP ProBook 450 G10', description: 'Laptop empresarial de alto rendimiento',
      technical_specs: { processor: 'Intel Core i7-1355U', ram: '16GB DDR4', storage: '512GB SSD', display: '15.6" FHD' },
      category_id: catMap['Computadoras y Laptops'], brand_id: brMap['HP'],
      unit_price: 8500, cost_price: 6800, minimum_stock: 3, current_stock: 12,
    },
    {
      sku: 'DELL-LAT-5540', name: 'Dell Latitude 5540', description: 'Laptop profesional ultradelgada',
      technical_specs: { processor: 'Intel Core i5-1345U', ram: '16GB DDR5', storage: '256GB SSD', display: '15.6" FHD' },
      category_id: catMap['Computadoras y Laptops'], brand_id: brMap['Dell'],
      unit_price: 7200, cost_price: 5760, minimum_stock: 3, current_stock: 8,
    },
    {
      sku: 'LEN-TP-L14', name: 'Lenovo ThinkPad L14 Gen 4', description: 'Laptop empresarial robusta',
      technical_specs: { processor: 'AMD Ryzen 5 7530U', ram: '8GB DDR4', storage: '256GB SSD', display: '14" FHD' },
      category_id: catMap['Computadoras y Laptops'], brand_id: brMap['Lenovo'],
      unit_price: 6500, cost_price: 5200, minimum_stock: 5, current_stock: 15,
    },
    {
      sku: 'CISCO-SG350-28', name: 'Cisco SG350-28 Switch', description: 'Switch gestionable 28 puertos',
      technical_specs: { ports: '28 Gigabit', poe: 'No', managed: 'Sí', rack: '1U' },
      category_id: catMap['Redes y Conectividad'], brand_id: brMap['Cisco'],
      unit_price: 3200, cost_price: 2560, minimum_stock: 2, current_stock: 6,
    },
    {
      sku: 'TPL-EAP670', name: 'TP-Link EAP670 Access Point', description: 'Access Point Wi-Fi 6 empresarial',
      technical_specs: { standard: 'Wi-Fi 6 AX5400', poe: 'PoE+', coverage: '150m²' },
      category_id: catMap['Redes y Conectividad'], brand_id: brMap['TP-Link'],
      unit_price: 1800, cost_price: 1350, minimum_stock: 5, current_stock: 20,
    },
    {
      sku: 'EPS-L6270', name: 'Epson EcoTank L6270', description: 'Impresora multifuncional con tanque de tinta',
      technical_specs: { type: 'Inyección de tinta', functions: 'Impresión, copia, escáner', wifi: 'Sí', duplex: 'Sí' },
      category_id: catMap['Impresoras y Escáneres'], brand_id: brMap['Epson'],
      unit_price: 2800, cost_price: 2100, minimum_stock: 4, current_stock: 10,
    },
    {
      sku: 'WD-SSD-1TB', name: 'WD Blue SN580 1TB NVMe SSD', description: 'Disco de estado sólido NVMe M.2',
      technical_specs: { capacity: '1TB', interface: 'PCIe Gen4 NVMe', read_speed: '4150 MB/s', write_speed: '4150 MB/s' },
      category_id: catMap['Almacenamiento'], brand_id: brMap['Western Digital'],
      unit_price: 750, cost_price: 550, minimum_stock: 10, current_stock: 35,
    },
    {
      sku: 'LOG-MK270', name: 'Logitech MK270 Combo Inalámbrico', description: 'Teclado y mouse inalámbricos',
      technical_specs: { connectivity: '2.4 GHz', battery: '24 meses teclado / 12 meses mouse', type: 'Membrana' },
      category_id: catMap['Accesorios'], brand_id: brMap['Logitech'],
      unit_price: 280, cost_price: 190, minimum_stock: 15, current_stock: 50,
    },
    {
      sku: 'MS-O365-BIZ', name: 'Microsoft 365 Business Standard', description: 'Licencia anual Microsoft 365 para empresas',
      technical_specs: { license_type: 'Anual', users: '1 usuario', includes: 'Word, Excel, PowerPoint, Outlook, Teams, OneDrive 1TB' },
      category_id: catMap['Software y Licencias'], brand_id: brMap['Microsoft'],
      unit_price: 1100, cost_price: 880, minimum_stock: 0, current_stock: 100,
    },
    {
      sku: 'APC-BR1500', name: 'APC Back-UPS Pro BR1500G', description: 'UPS de 1500VA / 865W con regulador',
      technical_specs: { capacity: '1500VA / 865W', outlets: '10', runtime: '10 min half load', lcd: 'Sí' },
      category_id: catMap['Seguridad'], brand_id: brMap['APC'],
      unit_price: 2200, cost_price: 1650, minimum_stock: 3, current_stock: 2,
    },
  ]);
  console.log(`✅ ${products.length} productos creados`);

  // Customers
  const customers = await Customer.create([
    { name: 'Banco Industrial, S.A.', nit: '334215-0', email: 'compras@bi.com.gt', phone: '2420-3000', address: '7a Av. 5-10 Zona 4, Centro Financiero', city: 'Guatemala', type: 'corporate', contact_person: 'Roberto Castillo' },
    { name: 'Universidad del Valle de Guatemala', nit: '387456-2', email: 'adquisiciones@uvg.edu.gt', phone: '2364-0336', address: '18 Av. 11-95 Zona 15, Vista Hermosa III', city: 'Guatemala', type: 'corporate', contact_person: 'Ana Morales' },
    { name: 'Cementos Progreso, S.A.', nit: '219834-7', email: 'tecnologia@cempro.com', phone: '2338-6060', address: '15 Av. 18-01 Zona 13', city: 'Guatemala', type: 'corporate', contact_person: 'Diego Ramírez' },
    { name: 'Juan Carlos Pérez', nit: 'CF', email: 'jcperez@gmail.com', phone: '5012-3456', address: 'Zona 10, Guatemala', city: 'Guatemala', type: 'individual' },
    { name: 'Claro Guatemala', nit: '501278-3', email: 'infraestructura@claro.com.gt', phone: '2427-1000', address: 'Diagonal 6, 10-01 Zona 10', city: 'Guatemala', type: 'corporate', contact_person: 'Fernando Solís' },
  ]);
  console.log(`✅ ${customers.length} clientes creados`);

  // Suppliers
  const suppliers = await Supplier.create([
    { name: 'Intcomex Guatemala', nit: '612345-8', email: 'ventas@intcomex.com.gt', phone: '2328-5000', contact_person: 'Laura Hernández', brands: [brMap['HP'], brMap['Dell'], brMap['Lenovo'], brMap['Logitech']] },
    { name: 'MPS Mayorista', nit: '543289-1', email: 'pedidos@mps.com.gt', phone: '2332-1100', contact_person: 'Marcos Villagrán', brands: [brMap['Cisco'], brMap['TP-Link'], brMap['APC']] },
    { name: 'PCM Guatemala', nit: '389012-6', email: 'corporativo@pcm.com.gt', phone: '2380-5555', contact_person: 'Sofía Barrios', brands: [brMap['Epson'], brMap['Western Digital'], brMap['Microsoft']] },
  ]);
  console.log(`✅ ${suppliers.length} proveedores creados`);

  console.log('\n✅ Seed completado exitosamente!');
  console.log('📧 Login: admin@integrasutec.com / Admin123!\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
