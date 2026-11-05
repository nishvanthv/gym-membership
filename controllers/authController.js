const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Branch = require('../models/Branch');
const { signToken } = require('../utils/jwt');
const { conflict, unauthorized, badRequest } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');

async function resolveBranchId(requestedBranchId) {
  if (requestedBranchId) {
    const branch = await Branch.findById(requestedBranchId);
    if (!branch || !branch.isActive) {
      throw badRequest('Selected branch is invalid or inactive.');
    }
    return branch._id;
  }
  const fallback = await Branch.findOne({ isActive: true }).sort({ createdAt: 1 });
  if (!fallback) {
    throw badRequest('No active gym branch is available. Ask an administrator to create one first.');
  }
  return fallback._id;
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, branchId } = req.body;
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    throw conflict('An account with this email already exists.', 'DUPLICATE_EMAIL');
  }

  const assignedBranch = await resolveBranchId(branchId);
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'MEMBER',
    branchId: assignedBranch
  });

  const token = signToken({ userId: user._id.toString(), role: user.role, branchId: user.branchId.toString() });
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { token, user: user.toSafeObject() }
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw unauthorized('Incorrect email or password.');
  }
  if (!user.isActive) {
    throw unauthorized('This account has been deactivated.');
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    throw unauthorized('Incorrect email or password.');
  }

  const token = signToken({ userId: user._id.toString(), role: user.role, branchId: user.branchId.toString() });
  res.json({
    success: true,
    message: 'Login successful',
    data: { token, user: user.toSafeObject() }
  });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('branchId', 'name address');
  res.json({
    success: true,
    message: 'Current user',
    data: user.toSafeObject()
  });
});

exports.logout = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful. Discard the JWT on the client; the API is stateless.'
  });
});
