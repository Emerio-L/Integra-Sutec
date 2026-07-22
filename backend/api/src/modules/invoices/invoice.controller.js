const Invoice = require('./invoice.model');
const Quote = require('../quotes/quote.model');
const Customer = require('../customers/customer.model');
const { generateInvoicePDF } = require('../../utils/pdfGenerator');

async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await Invoice.countDocuments({
    created_at: {
      $gte: new Date(`${year}-01-01`),
      $lt: new Date(`${year + 1}-01-01`),
    },
  });
  return `FAC-${year}-${String(count + 1).padStart(5, '0')}`;
}

async function getAll(req, res, next) {
  try {
    const { page = 1, limit = 20, status, customer } = req.query;
    const filter = {};
    if (status) filter.payment_status = status;
    if (customer) filter.customer_id = customer;

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customer_id', 'name nit')
        .populate('created_by', 'name')
        .sort('-created_at')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Invoice.countDocuments(filter),
    ]);
    res.json({ data: invoices, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
}

async function getById(req, res, next) {
  try {
    const inv = await Invoice.findById(req.params.id)
      .populate('customer_id')
      .populate('created_by', 'name');
    if (!inv) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json({ data: inv });
  } catch (error) { next(error); }
}

async function createFromQuote(req, res, next) {
  try {
    const { quote_id, payment_method, notes } = req.body;

    const quote = await Quote.findById(quote_id).populate('customer_id');
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' });
    if (quote.status !== 'approved') {
      return res.status(400).json({ error: 'La cotización debe estar aprobada para facturar' });
    }

    const invoice = await Invoice.create({
      invoice_number: await generateInvoiceNumber(),
      quote_id: quote._id,
      customer_id: quote.customer_id._id,
      items: quote.items,
      subtotal: quote.subtotal,
      tax_amount: quote.tax_amount,
      total: quote.total,
      payment_method: payment_method || 'transfer',
      notes,
      created_by: req.user._id,
    });

    res.status(201).json({ data: invoice });
  } catch (error) { next(error); }
}

async function create(req, res, next) {
  try {
    const { customer_id, items, subtotal, tax_amount, total, payment_method, notes } = req.body;

    const customer = await Customer.findById(customer_id);
    if (!customer) return res.status(404).json({ error: 'Cliente no encontrado' });

    const invoice = await Invoice.create({
      invoice_number: await generateInvoiceNumber(),
      customer_id,
      items,
      subtotal,
      tax_amount,
      total,
      payment_method: payment_method || 'transfer',
      notes,
      created_by: req.user._id,
    });

    res.status(201).json({ data: invoice });
  } catch (error) { next(error); }
}

async function updatePaymentStatus(req, res, next) {
  try {
    const { payment_status } = req.body;
    const inv = await Invoice.findByIdAndUpdate(req.params.id, { payment_status }, { new: true, runValidators: true });
    if (!inv) return res.status(404).json({ error: 'Factura no encontrada' });
    res.json({ data: inv });
  } catch (error) { next(error); }
}

async function getPDF(req, res, next) {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer_id')
      .populate('created_by', 'name');
    if (!invoice) return res.status(404).json({ error: 'Factura no encontrada' });

    const pdfBuffer = await generateInvoicePDF(invoice);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename=factura-${invoice.invoice_number}.pdf`,
    });
    res.send(pdfBuffer);
  } catch (error) { next(error); }
}

module.exports = { getAll, getById, create, createFromQuote, updatePaymentStatus, getPDF };
