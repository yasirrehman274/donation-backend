const router = require('express').Router();
const expenseController = require('../controllers/expenseController');
const expenseValidation = require('../validations/expenseValidation');
const { authenticate, authorize, validate } = require('../middleware');
const { ROLES } = require('../utils');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get(
  '/',
  expenseValidation.listExpensesValidation,
  validate,
  expenseController.index
);
router.get('/:id', expenseController.show);
router.post(
  '/',
  expenseValidation.storeExpenseValidation,
  validate,
  expenseController.store
);
router.put(
  '/:id',
  expenseValidation.updateExpenseValidation,
  validate,
  expenseController.update
);
router.delete('/:id', expenseController.destroy);

module.exports = router;
