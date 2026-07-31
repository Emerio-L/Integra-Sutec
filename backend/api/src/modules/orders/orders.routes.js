const { Router } = require('express');
const Order    = require('./order.model');
const Invoice  = require('../invoices/invoice.model');
const Customer = require('../customers/customer.model');
const prisma   = require('../../config/prisma');
const { generateInvoicePDF } = require('../../utils/pdfGenerator');
const { authenticate, authorize } = require('../../middleware/auth');

const router = Router();

// ── PUBLIC: Submit order from website (no auth) ───────────────────────────────
router.post('/public', async (req, res, next) => {
  try {
    const { customer, items, payment_method } = req.body;

    if (!customer?.name || !customer?.email || !customer?.phone || !customer?.address) {
      return res.status(400).json({ success: false, error: 'Datos del cliente incompletos.' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'El pedido no tiene productos.' });
    }
    if (!['credit_card', 'debit_card', 'cash'].includes(payment_method)) {
      return res.status(400).json({ success: false, error: 'Método de pago inválido.' });
    }

    const requested = new Map();
    for (const item of items) {
      const productId = String(item.product_id || '');
      const quantity = Math.trunc(Number(item.quantity));
      if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ success: false, error: 'El pedido contiene una cantidad inválida.' });
      }
      requested.set(productId, (requested.get(productId) || 0) + quantity);
    }

    const order = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: [...requested.keys()] }, status: 'active' },
      });
      if (products.length !== requested.size) {
        const error = new Error('Uno de los productos ya no está disponible.');
        error.statusCode = 409;
        throw error;
      }

      const processedItems = products.map((product) => {
        const quantity = requested.get(product.id);
        if (product.current_stock < quantity) {
          const error = new Error(`${product.name} no tiene suficientes unidades disponibles.`);
          error.statusCode = 409;
          throw error;
        }
        const unitPrice = Number(product.unit_price);
        return {
          product_id: product.id,
          name: product.name,
          sku: product.sku,
          unit_price: unitPrice,
          quantity,
          subtotal: unitPrice * quantity,
          image_url: Array.isArray(product.images) ? product.images[0] || null : null,
        };
      });

      const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const year = new Date().getFullYear();
      const orderCount = await tx.order.count({
        where: { created_at: { gte: new Date(`${year}-01-01`), lt: new Date(`${year + 1}-01-01`) } },
      });
      const createdOrder = await tx.order.create({
        data: {
          order_number: `PED-${year}-${String(orderCount + 1).padStart(5, '0')}`,
          customer,
          items: processedItems,
          subtotal,
          total: subtotal,
          payment_method,
        },
      });

      for (const item of processedItems) {
        const product = products.find((candidate) => candidate.id === item.product_id);
        const updated = await tx.product.updateMany({
          where: { id: item.product_id, current_stock: { gte: item.quantity } },
          data: { current_stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          const error = new Error(`${item.name} ya no tiene suficientes unidades disponibles.`);
          error.statusCode = 409;
          throw error;
        }
        await tx.inventoryMovement.create({
          data: {
            product_id: item.product_id,
            movement_type: 'exit',
            quantity: item.quantity,
            previous_stock: product.current_stock,
            new_stock: product.current_stock - item.quantity,
            reference_type: 'sale',
            reference_id: createdOrder.id,
            notes: `Salida automática por pedido ${createdOrder.order_number}`,
          },
        });
      }
      return createdOrder;
    });

    res.status(201).json({
      success: true,
      message: '¡Pedido recibido! Te contactaremos para confirmar la entrega.',
      data: { id: order._id, order_number: order.order_number },
    });
  } catch (err) {
    next(err);
  }
});

// ── ADMIN: List all orders ────────────────────────────────────────────────────
router.get('/', authenticate, authorize('admin', 'manager', 'seller'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Order.find(filter).sort({ created_at: -1 }).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, data: items, total });
  } catch (err) { next(err); }
});

// ── ADMIN: Get single order ───────────────────────────────────────────────────
router.get('/:id', authenticate, authorize('admin', 'manager', 'seller'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Pedido no encontrado.' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// ── ADMIN: Update order status ────────────────────────────────────────────────
router.patch('/:id/status', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado inválido.' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, error: 'Pedido no encontrado.' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// ── ADMIN: Generate & save invoice from delivered order ───────────────────────
router.post('/:id/invoice', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Pedido no encontrado.' });
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, error: 'Solo se pueden facturar pedidos entregados.' });
    }

    // Return existing invoice if already generated
    const existing = await Invoice.findOne({ order_id: order._id });
    if (existing) return res.json({ success: true, data: existing, already_existed: true });

    // Find or create Customer record by email
    let customer = await Customer.findOne({ email: order.customer.email });
    if (!customer) {
      customer = await Customer.create({
        name:    order.customer.name,
        email:   order.customer.email || '',
        phone:   order.customer.phone || '',
        address: order.customer.address || '',
        nit:     order.customer.nit   || 'C/F',   // nit is required in schema
      });
    }

    const pmMap = { credit_card: 'card', debit_card: 'card', cash: 'cash' };

    const invoiceItems = order.items.map(item => ({
      product_id:   item.product_id || item._id,
      product_name: item.name,
      quantity:     item.quantity,
      unit_price:   item.unit_price,
      subtotal:     item.subtotal,
    }));

    // Generate invoice number
    const year  = new Date().getFullYear();
    const count = await Invoice.countDocuments({
      created_at: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) },
    });
    const invoice_number = `FAC-${year}-${String(count + 1).padStart(5, '0')}`;

    const invoice = await Invoice.create({
      invoice_number,
      order_id:       order._id,
      customer_id:    customer._id,
      items:          invoiceItems,
      subtotal:       order.subtotal,
      tax_amount:     0,
      total:          order.total,
      payment_method: pmMap[order.payment_method] || 'cash',
      payment_status: 'pending',
      notes:          `Pedido web: ${order.order_number}`,
      created_by:     req.user._id,
    });

    res.status(201).json({ success: true, data: invoice });
  } catch (err) { next(err); }
});

// ── ADMIN: PDF directly from order ──────────────────────────────────────────
// Always builds PDF from order data (works before or after invoice is saved)
router.get('/:id/invoice/pdf', authenticate, authorize('admin', 'manager', 'seller'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Pedido no encontrado.' });

    // Try to get a stored invoice number (FAC-...) if one exists
    const stored = await Invoice.findOne({ order_id: order._id }).lean();

    // Always build invoice data directly from order — no Customer lookup needed
    const invoiceData = {
      invoice_number: stored ? stored.invoice_number : order.order_number.replace('PED-', 'FAC-'),
      created_at:     stored ? stored.created_at : order.created_at,
      payment_method: ({ credit_card: 'card', debit_card: 'card', cash: 'cash' })[order.payment_method] || 'cash',
      payment_status: stored ? stored.payment_status : 'pending',
      customer_id: {
        name:    order.customer.name    || '—',
        nit:     order.customer.nit     || 'C/F',
        address: order.customer.address || '—',
        email:   order.customer.email   || '',
        phone:   order.customer.phone   || '',
      },
      items: order.items.map(i => ({
        product_name: i.name,
        quantity:     i.quantity,
        unit_price:   i.unit_price,
        subtotal:     i.subtotal,
      })),
      subtotal:   order.subtotal   || order.total || 0,
      tax_amount: 0,
      total:      order.total      || 0,
      notes:      `Pedido web N° ${order.order_number}`,
    };

    const pdfBuffer = await generateInvoicePDF(invoiceData);
    const filename  = `factura-${invoiceData.invoice_number}.pdf`;

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    });
    res.send(pdfBuffer);
  } catch (err) { next(err); }
});

// ── ADMIN: Delete order ───────────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Pedido eliminado.' });
  } catch (err) { next(err); }
});

module.exports = router;
