const { body, query } = require('express-validator');
const {
  DONATION_STATUS,
  DATE_STRING_REGEX,
  MONTH_STRING_REGEX,
  PHONE_REGEX,
  PHONE_REGEX_MESSAGE,
} = require('../utils/constants');

const validDate = (value) => value === undefined || value === '' || DATE_STRING_REGEX.test(value);

const storeDonationValidation = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('donorName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Donor name is too long'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(PHONE_REGEX)
    .withMessage(PHONE_REGEX_MESSAGE),
  body('date')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('month')
    .optional({ values: 'falsy' })
    .matches(MONTH_STRING_REGEX)
    .withMessage('Month must be in YYYY-MM format'),
  body('status')
    .optional()
    .isIn(Object.values(DONATION_STATUS))
    .withMessage('Invalid donation status'),
  body('paymentMethod').optional({ values: 'falsy' }).isString().withMessage('Invalid payment method'),
  body('screenshot').optional({ values: 'falsy' }).isString().withMessage('Invalid screenshot url'),
  body('id').optional().isString().withMessage('Invalid id'),
];

const updateDonationValidation = [
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('donorName')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 100 })
    .withMessage('Donor name is too long'),
  body('date')
    .optional({ values: 'falsy' })
    .custom(validDate)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(PHONE_REGEX)
    .withMessage(PHONE_REGEX_MESSAGE),
  body('status')
    .optional()
    .isIn(Object.values(DONATION_STATUS))
    .withMessage('Invalid donation status'),
];

const listDonationsValidation = [
  query('status')
    .optional()
    .isIn(Object.values(DONATION_STATUS))
    .withMessage('Invalid status filter'),
  query('month')
    .optional()
    .matches(MONTH_STRING_REGEX)
    .withMessage('Invalid month filter'),
  query('donorName').optional().isString().withMessage('Invalid donor name filter'),
  query('from').optional().matches(DATE_STRING_REGEX).withMessage('Invalid from date'),
  query('to').optional().matches(DATE_STRING_REGEX).withMessage('Invalid to date'),
];

module.exports = {
  storeDonationValidation,
  updateDonationValidation,
  listDonationsValidation,
};
