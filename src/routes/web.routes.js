const express = require('express');

const webController = require('../controllers/web.controller');
const { authenticateWeb } = require('../middleware/auth');

const router = express.Router();

router.get('/', (_req, res) => res.redirect('/master/rt-rw'));
router.get('/login', webController.loginPage);
router.get('/dashboard', authenticateWeb, webController.dashboardPage);
router.get('/master/rt-rw', authenticateWeb, webController.masterRtRwPage);
router.get('/muzakki', authenticateWeb, webController.muzakkiPage);
router.get('/mustahik', authenticateWeb, webController.mustahikPage);
router.get('/distribusi', authenticateWeb, webController.distribusiPage);
router.get('/laporan', authenticateWeb, webController.laporanPage);

module.exports = router;
