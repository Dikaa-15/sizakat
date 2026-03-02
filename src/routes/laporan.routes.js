const express = require('express');

const laporanController = require('../controllers/laporan.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/penerimaan', laporanController.penerimaan);
router.get('/distribusi', laporanController.distribusi);
router.get('/cetak', laporanController.cetak);
router.get('/export-excel', laporanController.exportExcel);

module.exports = router;
