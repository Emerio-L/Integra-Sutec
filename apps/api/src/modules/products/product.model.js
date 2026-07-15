const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: [true, 'El SKU es requerido'], unique: true, trim: true },
  name: { type: String, required: [true, 'El nombre es requerido'], trim: true },
  description: { type: String, default: '' },
  technical_specs: { type: mongoose.Schema.Types.Mixed, default: {} },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
  unit_price: { type: Number, required: [true, 'El precio es requerido'], min: 0 },
  cost_price: { type: Number, default: 0, min: 0 },
  images: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  minimum_stock: { type: Number, default: 5, min: 0 },
  current_stock: { type: Number, default: 0, min: 0 },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'products',
});

productSchema.index({ name: 'text', description: 'text', sku: 'text' });
productSchema.index({ category_id: 1 });
productSchema.index({ brand_id: 1 });
productSchema.index({ status: 1 });

module.exports = mongoose.model('Product', productSchema);
