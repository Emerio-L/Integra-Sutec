const express = require('express');
const router = express.Router();
const ctrl = require('./inventory.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

router.get('/movements', ctrl.getMovements);
router.get('/alerts', ctrl.getAlerts);
router.post('/entry', authorize('admin', 'manager', 'seller'), ctrl.registerEntry);
router.post('/exit', authorize('admin', 'manager', 'seller'), ctrl.registerExit);
router.post('/transfer', authorize('admin', 'manager'), ctrl.registerTransfer);

module.exports = router;
