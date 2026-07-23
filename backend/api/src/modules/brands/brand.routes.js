const express = require('express');
const router = express.Router();
const ctrl = require('./brand.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authenticate, authorize('admin', 'manager'), ctrl.create);
router.put('/:id', authenticate, authorize('admin', 'manager'), ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

module.exports = router;
