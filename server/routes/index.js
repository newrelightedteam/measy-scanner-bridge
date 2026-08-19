const express = require('express');

const auth = require('../middleware/auth');

const scannerRoutes = require('./scanner');
const systemRoutes = require('./system');

const router = express.Router();

router.use(systemRoutes);

router.use(auth);

router.use(scannerRoutes);

module.exports = router;