const { body, query } = require('express-validator');
const { DATE_STRING_REGEX } = require('../utils/constants');

const storeRepaymentValidation = [
  body('loanId').trim().notEmpty().withMessage('Loan is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Repayment amount must be a positive number'),
  body('date')
    .optional({ values: 'falsy' })
    .matches(DATE_STRING_REGEX)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('notes').optional({ values: 'falsy' }).isString().withMessage('Invalid notes'),
];

const listRepaymentsValidation = [
  query('loanId').optional().isString().withMessage('Invalid loan id filter'),
];

module.exports = { storeRepaymentValidation, listRepaymentsValidation };
