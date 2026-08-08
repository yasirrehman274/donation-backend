const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware');
const { ROLES } = require('../utils');

router.get('/mine', authenticate, dashboardController.mine);
router.get('/', authenticate, authorize(ROLES.ADMIN), dashboardController.index);

module.exports = router;
