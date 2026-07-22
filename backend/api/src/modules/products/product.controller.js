const Product = require('./product.model');

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
    const product = await Product.create(req.body);
    res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
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

module.exports = { getAll, getById, create, update, remove };
