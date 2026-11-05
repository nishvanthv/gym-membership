const Membership = require('../models/Membership');
const User = require('../models/User');
const { notFound, forbidden } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');
const membershipService = require('../services/membershipService');

exports.purchase = asyncHandler(async (req, res) => {
  const membership = await membershipService.purchasePlan(
    req.user.id,
    req.body.planId,
    req.user.branchId
  );
  res.status(201).json({ success: true, message: 'Membership purchased successfully', data: membership });
});

exports.myMemberships = asyncHandler(async (req, res) => {
  await membershipService.expireOverdue();
  const memberships = await Membership.find({ memberId: req.user.id }).populate('planId').sort({ createdAt: -1 });
  res.json({ success: true, message: 'Your memberships', data: memberships });
});

exports.getMembership = asyncHandler(async (req, res) => {
  const membership = await Membership.findById(req.params.id).populate('planId');
  if (!membership) throw notFound('Membership not found.');
  if (req.user.role === 'MEMBER' && membership.memberId.toString() !== req.user.id) {
    throw forbidden('You can only view your own membership.');
  }
  if (req.user.role !== 'MEMBER') {
    const member = await User.findById(membership.memberId).select('branchId');
    if (!member || member.branchId.toString() !== req.user.branchId) {
      throw forbidden('This membership belongs to another branch.');
    }
  }
  await membershipService.refreshMembership(membership);
  res.json({ success: true, message: 'Membership', data: membership });
});

exports.renew = asyncHandler(async (req, res) => {
  const membership = await membershipService.renewMembership(
    req.user.id,
    req.params.id,
    req.body.planId
  );
  res.json({ success: true, message: 'Membership renewed successfully', data: membership });
});
