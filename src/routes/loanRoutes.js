const router = require('express').Router();
const loanController = require('../controllers/loanController');
const loanValidation = require('../validations/loanValidation');
const { authenticate, authorize, validate } = require('../middleware');
const { ROLES } = require('../utils');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', loanController.index);
router.get('/:id', loanController.show);
router.post('/', loanValidation.storeLoanValidation, validate, loanController.store);
router.put('/:id', loanValidation.updateLoanValidation, validate, loanController.update);
router.patch('/:id', loanValidation.updateLoanValidation, validate, loanController.update);
router.delete('/:id', loanController.destroy);

module.exports = router;
