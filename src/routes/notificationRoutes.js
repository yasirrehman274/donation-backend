const router = require('express').Router();
const { authenticate, authorize } = require('../middleware');
const { ROLES } = require('../utils');
const notificationController = require('../controllers/notificationController');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', notificationController.index);
router.get('/unread-count', notificationController.count);
router.put('/read-all', notificationController.markAllRead);
router.put('/:id/read', notificationController.markRead);

module.exports = router;
