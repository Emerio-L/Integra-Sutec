const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:       { type: String, required: true },
  sku:        { type: String },
  unit_price: { type: Number, required: true },
  quantity:   { type: Number, required: true, min: 1 },
  subtotal:   { type: Number, required: true },
  image_url:  { type: String },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  order_number: { type: String, unique: true },
  customer: {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, trim: true, lowercase: true },
    phone:   { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    nit:     { type: String, trim: true, default: 'C/F' },
    notes:   { type: String, trim: true },
  },
  items:           [orderItemSchema],
  subtotal:        { type: Number, required: true },
  tax:             { type: Number, default: 0 },
  total:           { type: Number, required: true },
  payment_method:  { type: String, enum: ['credit_card', 'debit_card', 'cash'], required: true },
  delivery_method: { type: String, default: 'contra_entrega' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'delivered', 'cancelled'],
    default: 'pending',
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Auto-generate unique order number before save
orderSchema.pre('save', async function (next) {
  if (!this.order_number) {
    const year = new Date().getFullYear();
    // Find the last order of this year and increment its sequence
    const last = await mongoose.model('Order')
      .findOne({ order_number: new RegExp(`^PED-${year}-`) })
      .sort({ order_number: -1 })
      .select('order_number');

    let seq = 1;
    if (last && last.order_number) {
      const parts = last.order_number.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    this.order_number = `PED-${year}-${String(seq).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
