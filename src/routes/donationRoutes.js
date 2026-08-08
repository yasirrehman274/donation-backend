const router = require('express').Router();
const uploadConfig = require('../config/upload');
const donationController = require('../controllers/donationController');
const donationValidation = require('../validations/donationValidation');
const { authenticate, authorize, validate } = require('../middleware');
const { ROLES } = require('../utils');

router.post(
  '/upload',
  authenticate,
  uploadConfig.single('screenshot'),
  donationController.upload
);

router.get('/my', authenticate, donationController.my);
router.get(
  '/',
  authenticate,
  donationValidation.listDonationsValidation,
  validate,
  donationController.index
);
router.get('/:id', authenticate, donationController.show);

router.post(
  '/',
  authenticate,
  donationValidation.storeDonationValidation,
  validate,
  donationController.store
);
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  donationValidation.updateDonationValidation,
  validate,
  donationController.update
);
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), donationController.destroy);
router.put('/:id/approve', authenticate, authorize(ROLES.ADMIN), donationController.approve);
router.put('/:id/reject', authenticate, authorize(ROLES.ADMIN), donationController.reject);

module.exports = router;
