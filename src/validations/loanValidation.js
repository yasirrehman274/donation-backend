const { body } = require('express-validator');
const { DATE_STRING_REGEX, PHONE_REGEX, PHONE_REGEX_MESSAGE } = require('../utils/constants');

const storeLoanValidation = [
  body('borrowerName')
    .trim()
    .notEmpty()
    .withMessage('Borrower name is required')
    .isLength({ max: 100 })
    .withMessage('Borrower name is too long'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(PHONE_REGEX)
    .withMessage(PHONE_REGEX_MESSAGE),
  body('cnic').optional({ values: 'falsy' }).isString().withMessage('Invalid CNIC'),
  body('amount').isFloat({ gt: 0 }).withMessage('Loan amount must be a positive number'),
  body('date')
    .optional({ values: 'falsy' })
    .matches(DATE_STRING_REGEX)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('returnDate')
    .optional({ values: 'falsy' })
    .matches(DATE_STRING_REGEX)
    .withMessage('Return date must be in YYYY-MM-DD format'),
  body('notes').optional({ values: 'falsy' }).isString().withMessage('Invalid notes'),
];

const updateLoanValidation = [
  body('borrowerName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Borrower name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Borrower name is too long'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(PHONE_REGEX)
    .withMessage(PHONE_REGEX_MESSAGE),
  body('cnic').optional({ values: 'falsy' }).isString().withMessage('Invalid CNIC'),
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Loan amount must be a positive number'),
  body('date')
    .optional({ values: 'falsy' })
    .matches(DATE_STRING_REGEX)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('returnDate')
    .optional({ values: 'falsy' })
    .matches(DATE_STRING_REGEX)
    .withMessage('Return date must be in YYYY-MM-DD format'),
];

module.exports = { storeLoanValidation, updateLoanValidation };
