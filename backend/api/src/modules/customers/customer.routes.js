const express = require('express');
const router = express.Router();
const ctrl = require('./customer.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('admin', 'manager', 'seller'), ctrl.create);
router.put('/:id', authorize('admin', 'manager', 'seller'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
