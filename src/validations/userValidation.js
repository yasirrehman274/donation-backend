const { body, query, param } = require('express-validator');
const { PHONE_REGEX, PHONE_REGEX_MESSAGE } = require('../utils/constants');

const createUserValidation = [
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

const updateUserValidation = [
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
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Invalid role'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
];

const listUsersValidation = [
  query('search').optional().isString().withMessage('Invalid search value'),
  query('role').optional().isIn(['admin', 'member']).withMessage('Invalid role filter'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status filter'),
];

const idParamValidation = (name = 'id') => [
  param(name).notEmpty().withMessage(`${name} is required`),
];

module.exports = { createUserValidation, updateUserValidation, listUsersValidation, idParamValidation };
