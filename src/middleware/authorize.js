const env = require('../config/env');
const { ApiError } = require('../utils');

/**
 * Restricts a route to one or more roles, e.g. authorize('admin').
 * In compat mode every admin-only route is treated as allowed because the
 * current panel is the admin console.
 */
const authorize = (...roles) => (req, _res, next) => {
  if (!env.authEnabled) return next();
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to access this resource'));
  }
  next();
};

module.exports = authorize;
