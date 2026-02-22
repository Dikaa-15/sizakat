const express = require('express');

const mustahikController = require('../controllers/mustahik.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', mustahikController.list);
router.get('/:id', mustahikController.detail);
router.post('/', mustahikController.create);
router.put('/:id', mustahikController.update);
router.delete('/:id', requireAdmin, mustahikController.remove);

module.exports = router;
