const Quote = require('./quote.model');
const Product = require('../products/product.model');
const Customer = require('../customers/customer.model');
const { generateQuotePDF } = require('../../utils/pdfGenerator');
const { TAX_RATE } = require('@integra/shared');

async function generateQuoteNumber() {
  const year = new Date().getFullYear();
  const count = await Quote.countDocuments({
    created_at: {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${year + 1}-01-01`),
    },
  });
  return `COT-${year}-${String(count + 1).padStart(5, '0')}`;
}

async function getAll(req, res, next) {
  try {
    const { page = 1, limit = 20, status, customer } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customer) filter.customer_id = customer;

    const skip = (Number(page) - 1) * Number(limit);
    const [quotes, total] = await Promise.all([
      Quote.find(filter)
        .populate('customer_id', 'name nit')
        .populate('created_by', 'name')
        .sort('-created_at')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Quote.countDocuments(filter),
    ]);
    res.json({ data: quotes, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
}

async function getById(req, res, next) {
  try {
    const q = await Quote.findById(req.params.id)
      .populate('customer_id')
      .populate('created_by', 'name')
      .populate('items.product_id', 'name sku');
    if (!q) return res.status(404).json({ error: 'Cotización no encontrada' });
    res.json({ data: q });
  } catch (error) { next(error); }
}

async function create(req, res, next) {
  try {
    const { customer_id, items: rawItems, notes, valid_until } = req.body;

    const customer = await Customer.findById(customer_id);
    if (!customer) return res.status(404).json({ error: 'Cliente no encontrado' });

    const items = [];
    let subtotal = 0;
    for (const item of rawItems) {
      const product = await Product.findById(item.product_id);
      if (!product) return res.status(404).json({ error: `Producto ${item.product_id} no encontrado` });

      const lineSubtotal = product.unit_price * item.quantity;
      items.push({
        product_id: product._id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.unit_price,
        subtotal: lineSubtotal,
      });
      subtotal += lineSubtotal;
    }

    const taxAmount = subtotal * TAX_RATE;
    const total = subtotal + taxAmount;

    const quote = await Quote.create({
      quote_number: await generateQuoteNumber(),
      customer_id,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      notes,
      valid_until: valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      created_by: req.user._id,
    });

    res.status(201).json({ data: quote });
  } catch (error) { next(error); }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const q = await Quote.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    if (!q) return res.status(404).json({ error: 'Cotización no encontrada' });
    res.json({ data: q });
  } catch (error) { next(error); }
}

async function getPDF(req, res, next) {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('customer_id')
      .populate('created_by', 'name');
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });

    const pdfBuffer = await generateQuotePDF(quote);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=cotizacion-${quote.quote_number}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (error) { next(error); }
}

module.exports = { getAll, getById, create, updateStatus, getPDF };
