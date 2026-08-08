const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { User } = require('../models');
const { ApiError, asyncHandler } = require('../utils');

/**
 * Verifies the JWT (Bearer token) and attaches the current user to req.user.
 *
 * In "compat mode" (AUTH_ENABLED=false) authentication is skipped so the
 * existing React admin panel, which has no login screen yet, keeps working.
 */
const authenticate = asyncHandler(async (req, _res, next) => {
  if (!env.authEnabled) {
    req.user = null;
    return next();
  }

  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Authentication required');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const user = await User.findById(payload.id);
  if (!user) throw new ApiError(401, 'User no longer exists');
  if (user.status !== 'active') {
    throw new ApiError(403, 'Your account is inactive. Contact the administrator.');
  }

  req.user = user;
  next();
});

module.exports = authenticate;
