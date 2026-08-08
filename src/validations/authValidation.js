const { body } = require('express-validator');
const { PHONE_REGEX, PHONE_REGEX_MESSAGE } = require('../utils/constants');

const loginValidation = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(PHONE_REGEX)
    .withMessage(PHONE_REGEX_MESSAGE),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(PHONE_REGEX)
    .withMessage(PHONE_REGEX_MESSAGE),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Invalid role'),
];

const changePasswordValidation = [
  body('oldPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

const profileUpdateValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage(PHONE_REGEX_MESSAGE),
];

module.exports = { loginValidation, registerValidation, changePasswordValidation, profileUpdateValidation };
