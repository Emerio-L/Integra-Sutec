const Supplier = require('./supplier.model');

async function getAll(req, res, next) {
  try {
    const suppliers = await Supplier.find({ status: 'active' }).populate('brands', 'name').sort('name').lean();
    res.json({ data: suppliers });
  } catch (error) { next(error); }
}

async function getById(req, res, next) {
  try {
    const s = await Supplier.findById(req.params.id).populate('brands', 'name');
    if (!s) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json({ data: s });
  } catch (error) { next(error); }
}

async function create(req, res, next) {
  try {
    const s = await Supplier.create(req.body);
    res.status(201).json({ data: s });
  } catch (error) { next(error); }
}

async function update(req, res, next) {
  try {
    const s = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!s) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json({ data: s });
  } catch (error) { next(error); }
}

async function remove(req, res, next) {
  try {
    const s = await Supplier.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!s) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json({ message: 'Proveedor desactivado', data: s });
  } catch (error) { next(error); }
}

module.exports = { getAll, getById, create, update, remove };
