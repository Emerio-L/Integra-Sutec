const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'El nombre es requerido'], trim: true },
  nit: { type: String, default: '', trim: true },
  email: { type: String, default: '', lowercase: true, trim: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  contact_person: { type: String, default: '' },
  brands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
  notes: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'suppliers',
});

module.exports = mongoose.model('Supplier', supplierSchema);
