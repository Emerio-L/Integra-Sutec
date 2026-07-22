const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'El nombre es requerido'], trim: true },
  nit: { type: String, required: [true, 'El NIT es requerido'], trim: true },
  email: { type: String, default: '', lowercase: true, trim: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: 'Guatemala' },
  contact_person: { type: String, default: '' },
  type: { type: String, enum: ['individual', 'corporate'], default: 'corporate' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'customers',
});

customerSchema.index({ name: 'text', nit: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
