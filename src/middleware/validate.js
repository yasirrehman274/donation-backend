const { validationResult } = require('express-validator');
const { ApiError } = require('../utils');

/**
 * Runs the express-validator chains defined on the route and returns the
 * first validation error (meaningful message) if any.
 */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const first = errors.array({ onlyFirstError: true })[0];
  next(new ApiError(400, first ? first.msg : 'Invalid request data'));
};

module.exports = validate;
