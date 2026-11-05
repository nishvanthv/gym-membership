const MembershipPlan = require('../models/MembershipPlan');
const Membership = require('../models/Membership');
const { notFound, conflict } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');

exports.createPlan = asyncHandler(async (req, res) => {
  const plan = await MembershipPlan.create({
    name: req.body.name,
    durationMonths: req.body.durationMonths,
    price: req.body.price,
    description: req.body.description || '',
    branchId: req.user.branchId,
    isActive: true
  });
  res.status(201).json({ success: true, message: 'Membership plan created successfully', data: plan });
});

exports.listPlans = asyncHandler(async (req, res) => {
  const filter = { branchId: req.user.branchId };
  if (req.user.role === 'MEMBER') {
    filter.isActive = true;
  }
  const plans = await MembershipPlan.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, message: 'Membership plans', data: plans });
});

exports.getPlan = asyncHandler(async (req, res) => {
  const plan = await MembershipPlan.findOne({ _id: req.params.id, branchId: req.user.branchId });
  if (!plan) throw notFound('Membership plan not found.');
  if (req.user.role === 'MEMBER' && !plan.isActive) {
    throw notFound('Membership plan not found.');
  }
  res.json({ success: true, message: 'Membership plan', data: plan });
});

exports.updatePlan = asyncHandler(async (req, res) => {
  const plan = await MembershipPlan.findOneAndUpdate(
    { _id: req.params.id, branchId: req.user.branchId },
    {
      $set: {
        ...(req.body.name !== undefined ? { name: req.body.name } : {}),
        ...(req.body.durationMonths !== undefined ? { durationMonths: req.body.durationMonths } : {}),
        ...(req.body.price !== undefined ? { price: req.body.price } : {}),
        ...(req.body.description !== undefined ? { description: req.body.description } : {})
      }
    },
    { new: true, runValidators: true }
  );
  if (!plan) throw notFound('Membership plan not found.');
  res.json({ success: true, message: 'Membership plan updated successfully', data: plan });
});

exports.updatePlanStatus = asyncHandler(async (req, res) => {
  const plan = await MembershipPlan.findOneAndUpdate(
    { _id: req.params.id, branchId: req.user.branchId },
    { $set: { isActive: req.body.isActive } },
    { new: true }
  );
  if (!plan) throw notFound('Membership plan not found.');
  res.json({ success: true, message: 'Plan status updated', data: plan });
});

exports.deletePlan = asyncHandler(async (req, res) => {
  const referenced = await Membership.exists({ planId: req.params.id });
  if (referenced) {
    throw conflict(
      'This plan is referenced by existing memberships. Deactivate it instead of deleting.',
      'PLAN_IN_USE'
    );
  }
  const plan = await MembershipPlan.findOneAndDelete({ _id: req.params.id, branchId: req.user.branchId });
  if (!plan) throw notFound('Membership plan not found.');
  res.json({ success: true, message: 'Membership plan deleted', data: plan });
});
