const Category = require('./category.model');

async function getAll(req, res, next) {
  try {
    const filter = { status: 'active' };
    const categories = await Category.find(filter).sort('name').lean();
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ data: cat });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ data: cat });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ data: cat });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ message: 'Categoría desactivada', data: cat });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAll, getById, create, update, remove };
