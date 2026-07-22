const mongoose = require('mongoose');

const quoteItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit_price: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const quoteSchema = new mongoose.Schema({
  quote_number: { type: String, unique: true, required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [quoteItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  tax_amount: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['draft', 'sent', 'approved', 'rejected', 'expired'],
    default: 'draft',
  },
  valid_until: { type: Date },
  notes: { type: String, default: '' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'quotes',
});

quoteSchema.index({ customer_id: 1 });
quoteSchema.index({ status: 1 });

module.exports = mongoose.model('Quote', quoteSchema);
