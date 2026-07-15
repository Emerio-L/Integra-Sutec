const { Router } = require('express');
const QuoteRequest = require('./quoteRequest.model');
const { authenticate, authorize } = require('../../middleware/auth');

const router = Router();

// ── PUBLIC: Recibir solicitud desde el sitio web (sin autenticación) ──────────
router.post('/public', async (req, res, next) => {
  try {
    const { company, nit, name, position, email, phone, category, details, deadline, notes } =
      req.body;

    if (!company || !nit || !name || !email || !phone || !details) {
      return res.status(400).json({
        success: false,
        error: 'Campos obligatorios: empresa, NIT, nombre, email, teléfono y detalle.',
      });
    }

    const request = await QuoteRequest.create({
      company, nit, name, position, email, phone, category, details,
      deadline: deadline ? new Date(deadline) : undefined,
      notes,
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud recibida. Te contactaremos en menos de 24 horas.',
      data: { id: request._id },
    });
  } catch (err) {
    next(err);
  }
});

// ── ADMIN: Listar solicitudes ─────────────────────────────────────────────────
router.get('/', authenticate, authorize('admin', 'manager', 'seller'), async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      QuoteRequest.find(filter).sort({ created_at: -1 }).skip(skip).limit(Number(limit)),
      QuoteRequest.countDocuments(filter),
    ]);

    res.json({ success: true, data: items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
});

// ── ADMIN: Actualizar estado de una solicitud ─────────────────────────────────
router.patch('/:id/status', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ['new', 'reviewed', 'converted', 'dismissed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado inválido.' });
    }

    const request = await QuoteRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!request) return res.status(404).json({ success: false, error: 'Solicitud no encontrada.' });
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
});

// ── ADMIN: Eliminar solicitud ─────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    await QuoteRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Solicitud eliminada.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
