const express = require('express');

const masterRtRwController = require('../controllers/masterRtRw.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', masterRtRwController.list);
router.get('/:id', masterRtRwController.detail);
router.post('/', requireAdmin, masterRtRwController.create);
router.put('/:id', requireAdmin, masterRtRwController.update);
router.delete('/:id', requireAdmin, masterRtRwController.remove);

module.exports = router;
