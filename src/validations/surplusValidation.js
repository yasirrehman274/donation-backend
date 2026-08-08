const { body } = require('express-validator');
const { DATE_STRING_REGEX, MONTH_STRING_REGEX } = require('../utils/constants');

const storeSurplusValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('date')
    .optional({ values: 'falsy' })
    .matches(DATE_STRING_REGEX)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('month')
    .optional({ values: 'falsy' })
    .matches(MONTH_STRING_REGEX)
    .withMessage('Month must be in YYYY-MM format'),
  body('notes').optional({ values: 'falsy' }).isString().withMessage('Invalid notes'),
];

const updateSurplusValidation = [
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('date')
    .optional({ values: 'falsy' })
    .matches(DATE_STRING_REGEX)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('month')
    .optional({ values: 'falsy' })
    .matches(MONTH_STRING_REGEX)
    .withMessage('Month must be in YYYY-MM format'),
];

module.exports = { storeSurplusValidation, updateSurplusValidation };
