const express = require('express');
const router = express.Router();
const { getMetrics } = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth');

router.get('/metrics', authenticate, getMetrics);

module.exports = router;
