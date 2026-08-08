const { body } = require('express-validator');
const { PHONE_REGEX, PHONE_REGEX_MESSAGE } = require('../utils/constants');

const storeDonorValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Donor name is required')
    .isLength({ max: 100 })
    .withMessage('Donor name is too long'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(PHONE_REGEX)
    .withMessage(PHONE_REGEX_MESSAGE),
];

const updateDonorValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Donor name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Donor name is too long'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(PHONE_REGEX)
    .withMessage(PHONE_REGEX_MESSAGE),
];

module.exports = { storeDonorValidation, updateDonorValidation };
