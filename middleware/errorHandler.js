const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid identifier format.',
      errorCode: 'INVALID_ID'
    });
  }

  if (err.code === 11000) {
    const fields = Object.keys(err.keyPattern || {});
    return res.status(409).json({
      success: false,
      message: fields.includes('email')
        ? 'An account with this email already exists.'
        : 'A conflicting record already exists.',
      errorCode: 'DUPLICATE_RECORD'
    });
  }

  if (err.name === 'ValidationError') {
    const first = Object.values(err.errors || {})[0];
    return res.status(400).json({
      success: false,
      message: first ? first.message : 'Validation failed.',
      errorCode: 'VALIDATION_ERROR'
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode
    });
  }

  console.error(err);
  const isDev = process.env.NODE_ENV !== 'production';
  return res.status(500).json({
    success: false,
    message: isDev ? err.message : 'An unexpected server error occurred.',
    errorCode: 'INTERNAL_ERROR'
  });
}

module.exports = errorHandler;
