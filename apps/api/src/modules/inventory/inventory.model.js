const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  movement_type: {
    type: String,
    enum: ['entry', 'exit', 'transfer', 'adjustment'],
    required: true,
  },
  quantity: { type: Number, required: [true, 'La cantidad es requerida'], min: 1 },
  previous_stock: { type: Number, required: true },
  new_stock: { type: Number, required: true },
  reference_type: {
    type: String,
    enum: ['purchase', 'sale', 'transfer', 'adjustment'],
    default: 'adjustment',
  },
  reference_id: { type: mongoose.Schema.Types.ObjectId },
  warehouse_from: { type: String, default: 'principal' },
  warehouse_to: { type: String, default: '' },
  notes: { type: String, default: '' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'inventory_movements',
});

inventoryMovementSchema.index({ product_id: 1, created_at: -1 });
inventoryMovementSchema.index({ movement_type: 1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
