const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const ctrl = require('./product.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { upload, convertToWebp } = require('../../middleware/upload');
const Product = require('./product.model');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authenticate, authorize('admin', 'manager'), ctrl.create);
router.put('/:id', authenticate, authorize('admin', 'manager'), ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

// ── Upload image for a product ────────────────────────────────────────────────
router.post(
  '/:id/images',
  authenticate,
  authorize('admin', 'manager'),
  upload.single('image'),
  convertToWebp,
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No se recibió ninguna imagen.' });
      }

      const imageUrl = `/uploads/products/${req.file.filename}`;

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { $push: { images: imageUrl } },
        { new: true }
      ).populate('category_id brand_id');

      if (!product) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
      }

      res.json({ success: true, data: product, imageUrl });
    } catch (err) {
      next(err);
    }
  }
);

// ── Delete a specific image from a product ────────────────────────────────────
router.delete(
  '/:id/images',
  authenticate,
  authorize('admin', 'manager'),
  async (req, res, next) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) {
        return res.status(400).json({ success: false, error: 'imageUrl es requerido.' });
      }

      const filename = path.basename(imageUrl);
      const filePath = path.join(__dirname, '../../public/uploads/products', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { $pull: { images: imageUrl } },
        { new: true }
      ).populate('category_id brand_id');

      if (!product) {
        return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
      }

      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
