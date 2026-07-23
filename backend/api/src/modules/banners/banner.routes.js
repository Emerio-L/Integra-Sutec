const express = require('express');
const rateLimit = require('express-rate-limit');
const ctrl = require('./banner.controller');
const { authenticate, authorize } = require('../../middleware/auth');
const { bannerUpload, validateBannerFiles } = require('../../middleware/bannerUpload');

const admin = express.Router();
const uploadLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: { error: 'Demasiadas cargas; intenta más tarde' } });
admin.use(authenticate, authorize('admin', 'manager'));
admin.get('/', ctrl.list);
admin.get('/:id', ctrl.get);
admin.post('/', uploadLimit, bannerUpload, validateBannerFiles, ctrl.create);
admin.put('/:id', uploadLimit, bannerUpload, validateBannerFiles, ctrl.update);
admin.patch('/reorder', ctrl.reorder);
admin.patch('/:id/status', ctrl.status);
admin.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = { admin, publicList: ctrl.publicList };
