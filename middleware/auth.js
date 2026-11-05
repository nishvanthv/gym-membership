const { verifyToken } = require('../utils/jwt');
const { unauthorized } = require('../utils/errors');
const User = require('../models/User');

async function authenticateToken(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw unauthorized('Missing or invalid Authorization header. Use Bearer <token>.');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      throw unauthorized('Invalid or expired token.');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw unauthorized('User account is inactive or does not exist.');
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId.toString()
    };
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticateToken;
