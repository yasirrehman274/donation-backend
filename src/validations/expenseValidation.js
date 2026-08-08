const { body, query } = require('express-validator');
const { CATEGORIES, DATE_STRING_REGEX } = require('../utils/constants');

const storeExpenseValidation = [
  body('purpose')
    .trim()
    .notEmpty()
    .withMessage('Purpose is required')
    .isLength({ max: 200 })
    .withMessage('Purpose is too long'),
  body('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('date')
    .optional({ values: 'falsy' })
    .matches(DATE_STRING_REGEX)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('notes').optional({ values: 'falsy' }).isString().withMessage('Invalid notes'),
];

const updateExpenseValidation = [
  body('purpose')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Purpose cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Purpose is too long'),
  body('category').optional().isIn(CATEGORIES).withMessage('Invalid category'),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('date')
    .optional({ values: 'falsy' })
    .matches(DATE_STRING_REGEX)
    .withMessage('Date must be in YYYY-MM-DD format'),
];

const listExpensesValidation = [
  query('category').optional().isIn(CATEGORIES).withMessage('Invalid category filter'),
  query('from').optional().matches(DATE_STRING_REGEX).withMessage('Invalid from date'),
  query('to').optional().matches(DATE_STRING_REGEX).withMessage('Invalid to date'),
];

module.exports = { storeExpenseValidation, updateExpenseValidation, listExpensesValidation };
