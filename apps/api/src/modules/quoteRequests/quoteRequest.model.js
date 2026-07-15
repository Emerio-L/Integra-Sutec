const mongoose = require('mongoose');

const quoteRequestSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    nit: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    position: { type: String, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    details: { type: String, required: true, trim: true },
    deadline: { type: Date },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['new', 'reviewed', 'converted', 'dismissed'],
      default: 'new',
    },
    // Linked to a formal quote once converted
    converted_quote_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('QuoteRequest', quoteRequestSchema);
