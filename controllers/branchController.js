const Branch = require('../models/Branch');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { notFound } = require('../utils/errors');

exports.listBranches = asyncHandler(async (req, res) => {
  const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
  res.json({ success: true, message: 'Branches', data: branches });
});

exports.createBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.create({
    name: req.body.name,
    address: req.body.address || '',
    phone: req.body.phone || '',
    isActive: true
  });
  res.status(201).json({ success: true, message: 'Branch created successfully', data: branch });
});

exports.listMembers = asyncHandler(async (req, res) => {
  const members = await User.find({ role: 'MEMBER', branchId: req.user.branchId })
    .select('-passwordHash')
    .sort({ createdAt: -1 });
  res.json({ success: true, message: 'Branch members', data: members });
});

exports.getBranch = asyncHandler(async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) throw notFound('Branch not found.');
  res.json({ success: true, message: 'Branch', data: branch });
});
