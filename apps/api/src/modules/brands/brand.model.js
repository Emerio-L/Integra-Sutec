const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'El nombre es requerido'], unique: true, trim: true },
  logo_url: { type: String, default: '' },
  website: { type: String, default: '' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'brands',
});

module.exports = mongoose.model('Brand', brandSchema);
