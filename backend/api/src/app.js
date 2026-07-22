require('dotenv').config({ path: '../../.env' });

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./modules/auth/auth.routes');
const productRoutes = require('./modules/products/product.routes');
const categoryRoutes = require('./modules/categories/category.routes');
const brandRoutes = require('./modules/brands/brand.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const customerRoutes = require('./modules/customers/customer.routes');
const supplierRoutes = require('./modules/suppliers/supplier.routes');
const quoteRoutes = require('./modules/quotes/quote.routes');
const invoiceRoutes = require('./modules/invoices/invoice.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const quoteRequestRoutes = require('./modules/quoteRequests/quoteRequests.routes');
const orderRoutes        = require('./modules/orders/orders.routes');
const contactRoutes      = require('./modules/contacts/contact.routes');
const bannerRoutes       = require('./modules/banners/banner.routes');

const app = express();
const PORT = process.env.API_PORT || 4000;

// ── Security ──
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
});
app.use(limiter);

// ── Parsing & Logging ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Static Files (product images) ──
// Must set CORS & disable helmet's crossOriginResourcePolicy so browsers
// from localhost:3000 and localhost:5173 can load images served from :4000
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, '../public/uploads')));

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quote-requests', quoteRequestRoutes);
app.use('/api/orders',         orderRoutes);
app.use('/api/contacts',       contactRoutes);
app.use('/api/v1/admin/banners', bannerRoutes.admin);
app.get('/api/v1/public/banners', bannerRoutes.publicList);

// ── Health Check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error Handler ──
app.use(errorHandler);

// ── Start ──
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Integra Sutec API corriendo en http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('❌ Error al iniciar el servidor:', err);
  process.exit(1);
});

module.exports = app;
