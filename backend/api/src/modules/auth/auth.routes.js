const express = require('express');
const router = express.Router();
const { login, refresh, getProfile } = require('./auth.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const User = require('./user.model');

router.post('/login', login);
router.post('/refresh', refresh);
router.get('/profile', authenticate, getProfile);

// ── ADMIN: List all users ─────────────────────────────────────────────────────
router.get('/users', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find().sort({ created_at: -1 }).select('-password_hash');
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

// ── ADMIN: Create user ────────────────────────────────────────────────────────
router.post('/users', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Nombre, email y contraseña son requeridos.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, error: 'Ya existe un usuario con ese email.' });

    const user = await User.create({ name, email, password_hash: password, role: role || 'seller' });
    const userObj = user.toObject();
    delete userObj.password_hash;
    res.status(201).json({ success: true, data: userObj });
  } catch (err) { next(err); }
});

// ── ADMIN: Update user (name, role, status) ───────────────────────────────────
router.patch('/users/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, role, status, email } = req.body;
    const update = {};
    if (name)   update.name   = name;
    if (role)   update.role   = role;
    if (status) update.status = status;
    if (email) {
      // Make sure email isn't already taken by a different user
      const taken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.params.id } });
      if (taken) return res.status(409).json({ success: false, error: 'Ese email ya está en uso por otro usuario.' });
      update.email = email.toLowerCase();
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('-password_hash');
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// ── ADMIN: Change user password ───────────────────────────────────────────────
router.patch('/users/:id/password', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    user.password_hash = password; // pre-save hook will hash it
    await user.save();
    res.json({ success: true, message: 'Contraseña actualizada.' });
  } catch (err) { next(err); }
});

// ── ADMIN: Delete user ────────────────────────────────────────────────────────
router.delete('/users/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'No puedes eliminar tu propia cuenta.' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Usuario eliminado.' });
  } catch (err) { next(err); }
});

module.exports = router;
