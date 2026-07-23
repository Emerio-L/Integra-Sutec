const express = require('express');
const multer = require('multer');
const ctrl = require('./product.controller');
const prisma = require('../../config/prisma');
const media = require('../../services/cloudinaryMedia');
const { authenticate, authorize } = require('../../middleware/auth');

const router = express.Router();
const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authenticate, authorize('admin', 'manager'), ctrl.create);
router.put('/:id', authenticate, authorize('admin', 'manager'), ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

router.post('/:id/images', authenticate, authorize('admin', 'manager'), imageUpload.single('image'), async (req, res, next) => {
  let uploaded;
  try {
    if (!req.file || !allowed.has(req.file.mimetype)) return res.status(415).json({ error: 'Imagen no válida.' });
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado.' });
    uploaded = await media.uploadProductImage(req.file.buffer);
    const images = [...(Array.isArray(product.images) ? product.images : []), uploaded.secure_url];
    const ids = [...(Array.isArray(product.image_public_ids) ? product.image_public_ids : []), uploaded.public_id];
    const updated = await prisma.product.update({ where: { id: product.id }, data: { images, image_public_ids: ids } });
    res.json({ success: true, data: { ...updated, _id: updated.id }, imageUrl: uploaded.secure_url });
  } catch (error) {
    if (uploaded?.public_id) await media.deleteProductImage(uploaded.public_id).catch(() => {});
    next(error);
  }
});

router.delete('/:id/images', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado.' });
    const images = Array.isArray(product.images) ? product.images : [];
    const ids = Array.isArray(product.image_public_ids) ? product.image_public_ids : [];
    const index = images.indexOf(req.body.imageUrl);
    if (index < 0) return res.status(404).json({ error: 'Imagen no encontrada.' });
    const [publicId] = ids.splice(index, 1);
    images.splice(index, 1);
    const updated = await prisma.product.update({ where: { id: product.id }, data: { images, image_public_ids: ids } });
    if (publicId) await media.deleteProductImage(publicId).catch(error => console.error('No se pudo limpiar imagen Cloudinary', error.message));
    res.json({ success: true, data: { ...updated, _id: updated.id } });
  } catch (error) { next(error); }
});

module.exports = router;
