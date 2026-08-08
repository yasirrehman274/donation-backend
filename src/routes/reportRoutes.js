const router = require('express').Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware');
const { ROLES } = require('../utils');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/monthly', reportController.monthly);
router.get('/yearly', reportController.yearly);
router.get('/member-wise', reportController.memberWise);
router.get('/expense', reportController.expense);
router.get('/loan', reportController.loan);
router.get('/donation', reportController.donation);

module.exports = router;
