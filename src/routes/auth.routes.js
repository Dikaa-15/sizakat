const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.profile);

module.exports = router;
