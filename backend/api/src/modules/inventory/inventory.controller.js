const InventoryMovement = require('./inventory.model');
const Product = require('../products/product.model');

async function getMovements(req, res, next) {
  try {
    const { page = 1, limit = 30, product, type, from, to } = req.query;
    const filter = {};
    if (product) filter.product_id = product;
    if (type) filter.movement_type = type;
    if (from || to) {
      filter.created_at = {};
      if (from) filter.created_at.$gte = new Date(from);
      if (to) filter.created_at.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [movements, total] = await Promise.all([
      InventoryMovement.find(filter)
        .populate('product_id', 'name sku')
        .populate('created_by', 'name')
        .sort('-created_at')
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      InventoryMovement.countDocuments(filter),
    ]);

    res.json({
      data: movements,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
}

async function registerEntry(req, res, next) {
  try {
    const { product_id, quantity, notes } = req.body;
    const product = await Product.findById(product_id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const previousStock = product.current_stock;
    product.current_stock += quantity;
    await product.save();

    const movement = await InventoryMovement.create({
      product_id,
      movement_type: 'entry',
      quantity,
      previous_stock: previousStock,
      new_stock: product.current_stock,
      reference_type: 'purchase',
      notes,
      created_by: req.user._id,
    });

    res.status(201).json({ data: movement });
  } catch (error) {
    next(error);
  }
}

async function registerExit(req, res, next) {
  try {
    const { product_id, quantity, notes } = req.body;
    const product = await Product.findById(product_id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    if (product.current_stock < quantity) {
      return res.status(400).json({ error: `Stock insuficiente. Disponible: ${product.current_stock}` });
    }

    const previousStock = product.current_stock;
    product.current_stock -= quantity;
    await product.save();

    const movement = await InventoryMovement.create({
      product_id,
      movement_type: 'exit',
      quantity,
      previous_stock: previousStock,
      new_stock: product.current_stock,
      reference_type: 'sale',
      notes,
      created_by: req.user._id,
    });

    res.status(201).json({ data: movement });
  } catch (error) {
    next(error);
  }
}

async function registerTransfer(req, res, next) {
  try {
    const { product_id, quantity, warehouse_from, warehouse_to, notes } = req.body;
    const product = await Product.findById(product_id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const movement = await InventoryMovement.create({
      product_id,
      movement_type: 'transfer',
      quantity,
      previous_stock: product.current_stock,
      new_stock: product.current_stock,
      reference_type: 'transfer',
      warehouse_from,
      warehouse_to,
      notes,
      created_by: req.user._id,
    });

    res.status(201).json({ data: movement });
  } catch (error) {
    next(error);
  }
}

async function getAlerts(req, res, next) {
  try {
    const activeProducts = await Product.find({ status: 'active' })
      .select('name sku current_stock minimum_stock category_id')
      .populate('category_id', 'name')
      .sort('current_stock')
      .lean();
    const alerts = activeProducts.filter(product => product.current_stock <= product.minimum_stock);

    res.json({ data: alerts, total: alerts.length });
  } catch (error) {
    next(error);
  }
}

module.exports = { getMovements, registerEntry, registerExit, registerTransfer, getAlerts };
