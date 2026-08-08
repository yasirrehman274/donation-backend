const authenticate = require('./authenticate');
const authorize = require('./authorize');
const validate = require('./validate');
const { notFound, errorHandler } = require('./errorHandler');

module.exports = { authenticate, authorize, validate, notFound, errorHandler };
