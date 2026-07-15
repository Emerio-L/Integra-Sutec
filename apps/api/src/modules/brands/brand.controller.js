const Brand = require('./brand.model');

async function getAll(req, res, next) {
  try {
    const brands = await Brand.find({ status: 'active' }).sort('name').lean();
    res.json({ data: brands });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Marca no encontrada' });
    res.json({ data: brand });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json({ data: brand });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!brand) return res.status(404).json({ error: 'Marca no encontrada' });
    res.json({ data: brand });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const brand = await Brand.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!brand) return res.status(404).json({ error: 'Marca no encontrada' });
    res.json({ message: 'Marca desactivada', data: brand });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, update, remove };
