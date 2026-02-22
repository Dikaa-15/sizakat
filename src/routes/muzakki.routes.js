const express = require('express');

const muzakkiController = require('../controllers/muzakki.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', muzakkiController.list);
router.get('/:id', muzakkiController.detail);
router.post('/', muzakkiController.create);
router.put('/:id', muzakkiController.update);
router.delete('/:id', requireAdmin, muzakkiController.remove);

module.exports = router;
