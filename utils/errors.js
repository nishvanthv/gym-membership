class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

function notFound(message = 'Record not found') {
  return new AppError(message, 404, 'NOT_FOUND');
}

function unauthorized(message = 'Authentication required') {
  return new AppError(message, 401, 'UNAUTHORIZED');
}

function forbidden(message = 'You do not have permission to perform this action') {
  return new AppError(message, 403, 'FORBIDDEN');
}

function conflict(message, errorCode = 'CONFLICT') {
  return new AppError(message, 409, errorCode);
}

function badRequest(message, errorCode = 'VALIDATION_ERROR') {
  return new AppError(message, 400, errorCode);
}

module.exports = {
  AppError,
  notFound,
  unauthorized,
  forbidden,
  conflict,
  badRequest
};
