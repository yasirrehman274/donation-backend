const env = require('../config/env');
const { MulterError } = require('multer');
const { ApiError } = require('../utils');

const notFound = (req, _res, next) =>
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

const errorHandler = (err, _req, res, _next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err instanceof MulterError) {
    status = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File too large. Maximum allowed size is ${env.uploadLimitMb}MB.`
        : err.message;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ');
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with the same unique value already exists';
  }

  if (status >= 500) console.error('[error]', err);

  res.status(status).json({
    message,
    ...(env.nodeEnv === 'development' && status >= 500 ? { stack: err.stack } : {}),
  });
};

module.exports = { notFound, errorHandler };
