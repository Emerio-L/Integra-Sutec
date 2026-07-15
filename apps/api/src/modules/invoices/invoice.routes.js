const express = require('express');
const router = express.Router();
const ctrl = require('./invoice.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.get('/:id/pdf', ctrl.getPDF);
router.post('/', authorize('admin', 'manager', 'seller'), ctrl.create);
router.post('/from-quote', authorize('admin', 'manager', 'seller'), ctrl.createFromQuote);
router.patch('/:id/payment', authorize('admin', 'manager'), ctrl.updatePaymentStatus);

module.exports = router;
