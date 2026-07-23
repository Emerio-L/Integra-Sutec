const express = require('express');
const router = express.Router();
const ctrl = require('./quote.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/pdf', ctrl.getPDF);
router.post('/', authorize('admin', 'manager', 'seller'), ctrl.create);
router.patch('/:id/status', authorize('admin', 'manager', 'seller'), ctrl.updateStatus);

module.exports = router;
