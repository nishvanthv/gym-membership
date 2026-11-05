const { validationResult } = require('express-validator');
const { badRequest } = require('../utils/errors');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return next(badRequest(first.msg || 'Validation failed'));
  }
  next();
}

module.exports = validate;
