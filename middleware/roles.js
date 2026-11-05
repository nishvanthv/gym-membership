const { forbidden } = require('../utils/errors');

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(forbidden('Your role is not allowed to access this resource.'));
    }
    next();
  };
}

module.exports = authorizeRoles;
