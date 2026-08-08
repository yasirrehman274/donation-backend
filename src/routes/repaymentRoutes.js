const router = require('express').Router();
const repaymentController = require('../controllers/repaymentController');
const repaymentValidation = require('../validations/repaymentValidation');
const { authenticate, authorize, validate } = require('../middleware');
const { ROLES } = require('../utils');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get(
  '/',
  repaymentValidation.listRepaymentsValidation,
  validate,
  repaymentController.index
);
router.get('/:id', repaymentController.show);
router.post(
  '/',
  repaymentValidation.storeRepaymentValidation,
  validate,
  repaymentController.store
);
router.delete('/:id', repaymentController.destroy);

module.exports = router;
