const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit_price: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoice_number: { type: String, unique: true, required: true },
  quote_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  order_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },  // web orders
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: [invoiceItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  tax_amount: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'partial'],
    default: 'pending',
  },
  payment_method: {
    type: String,
    enum: ['cash', 'transfer', 'card', 'credit'],
    default: 'transfer',
  },
  notes: { type: String, default: '' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  collection: 'invoices',
});

invoiceSchema.index({ customer_id: 1 });
invoiceSchema.index({ payment_status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
