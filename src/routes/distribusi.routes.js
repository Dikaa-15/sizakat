const express = require('express');

const distribusiController = require('../controllers/distribusi.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', distribusiController.list);
router.post('/', distribusiController.create);
router.put('/:id/batal', requireAdmin, distribusiController.cancel);

module.exports = router;
