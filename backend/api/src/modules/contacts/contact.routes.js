const { Router } = require('express');
const mongoose = require('mongoose');
const { authenticate, authorize } = require('../../middleware/auth');

const router = Router();

// ── Contact Message Schema (inline, no separate file needed) ─────────────────
const contactSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, trim: true, lowercase: true },
  phone:   { type: String, default: '' },
  company: { type: String, default: '' },
  subject: { type: String, default: 'general' },
  message: { type: String, required: true },
  status:  { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, collection: 'contacts' });

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

// ── PUBLIC: Receive message from web ─────────────────────────────────────────
router.post('/public', async (req, res, next) => {
  try {
    const { name, email, phone, company, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Nombre, email y mensaje son requeridos.' });
    }
    const contact = await Contact.create({ name, email, phone, company, subject, message });
    res.status(201).json({ success: true, message: '¡Mensaje recibido! Te contactaremos pronto.', data: { id: contact._id } });
  } catch (err) { next(err); }
});

// ── ADMIN: List all messages ──────────────────────────────────────────────────
router.get('/', authenticate, authorize('admin', 'manager', 'seller'), async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const items = await Contact.find(filter).sort({ created_at: -1 }).limit(100);
    const total = await Contact.countDocuments(filter);
    res.json({ success: true, data: items, total });
  } catch (err) { next(err); }
});

// ── ADMIN: Update status (mark as read / replied) ─────────────────────────────
router.patch('/:id/status', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado inválido.' });
    }
    const contact = await Contact.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!contact) return res.status(404).json({ success: false, error: 'Mensaje no encontrado.' });
    res.json({ success: true, data: contact });
  } catch (err) { next(err); }
});

// ── ADMIN: Delete message ─────────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Mensaje eliminado.' });
  } catch (err) { next(err); }
});

module.exports = router;
