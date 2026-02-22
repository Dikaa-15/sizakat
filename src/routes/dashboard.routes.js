const express = require('express');

const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/summary', dashboardController.summary);

module.exports = router;
