const Customer = require('./customer.model');

async function getAll(req, res, next) {
  try {
    const { page = 1, limit = 20, search, type } = req.query;
    const filter = { status: 'active' };
    if (type) filter.type = type;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [customers, total] = await Promise.all([
      Customer.find(filter).sort('name').skip(skip).limit(Number(limit)).lean(),
      Customer.countDocuments(filter),
    ]);
    res.json({ data: customers, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
}

async function getById(req, res, next) {
  try {
    const c = await Customer.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ data: c });
  } catch (error) { next(error); }
}

async function create(req, res, next) {
  try {
    const c = await Customer.create(req.body);
    res.status(201).json({ data: c });
  } catch (error) { next(error); }
}

async function update(req, res, next) {
  try {
    const c = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ data: c });
  } catch (error) { next(error); }
}

async function remove(req, res, next) {
  try {
    const c = await Customer.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!c) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ message: 'Cliente desactivado', data: c });
  } catch (error) { next(error); }
}

module.exports = { getAll, getById, create, update, remove };
