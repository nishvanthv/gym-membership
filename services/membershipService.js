const Membership = require('../models/Membership');
const MembershipPlan = require('../models/MembershipPlan');
const { addMonths, daysFromNow } = require('../utils/dates');
const { badRequest, conflict, notFound, forbidden } = require('../utils/errors');
const { createNotification } = require('./notificationService');

async function expireOverdue() {
  const now = new Date();
  const expired = await Membership.find({ status: 'ACTIVE', endDate: { $lt: now } });
  if (!expired.length) {
    return { expiredCount: 0 };
  }

  await Membership.updateMany(
    { _id: { $in: expired.map((m) => m._id) } },
    { $set: { status: 'EXPIRED' } }
  );

  await Promise.all(
    expired.map((membership) =>
      createNotification({
        userId: membership.memberId,
        type: 'MEMBERSHIP_EXPIRED',
        title: 'Membership expired',
        message: 'Your gym membership has expired. Renew to continue booking classes.'
      })
    )
  );

  return { expiredCount: expired.length };
}

async function notifyExpiringSoon(days = 7) {
  const now = new Date();
  const until = daysFromNow(days);
  const soon = await Membership.find({
    status: 'ACTIVE',
    endDate: { $gte: now, $lte: until }
  });

  await Promise.all(
    soon.map((membership) =>
      createNotification({
        userId: membership.memberId,
        type: 'MEMBERSHIP_EXPIRING',
        title: 'Membership expiring soon',
        message: `Your membership expires on ${membership.endDate.toISOString().slice(0, 10)}.`
      })
    )
  );

  return { notifiedCount: soon.length };
}

async function refreshMembership(membership) {
  if (!membership) return membership;
  if (membership.status === 'ACTIVE' && membership.endDate < new Date()) {
    membership.status = 'EXPIRED';
    await membership.save();
    await createNotification({
      userId: membership.memberId,
      type: 'MEMBERSHIP_EXPIRED',
      title: 'Membership expired',
      message: 'Your gym membership has expired. Renew to continue booking classes.'
    });
  }
  return membership;
}

async function getActiveMembership(memberId) {
  await expireOverdue();
  const membership = await Membership.findOne({ memberId, status: 'ACTIVE' }).populate('planId');
  return refreshMembership(membership);
}

async function purchasePlan(memberId, planId, branchId) {
  const plan = await MembershipPlan.findById(planId);
  if (!plan) {
    throw notFound('Membership plan not found.');
  }
  if (!plan.isActive) {
    throw conflict('This membership plan is inactive and cannot be purchased.', 'INACTIVE_PLAN');
  }
  if (plan.branchId.toString() !== branchId) {
    throw forbidden('This plan does not belong to your branch.');
  }

  const existing = await getActiveMembership(memberId);
  if (existing) {
    throw conflict(
      'You already have an active membership. Use the renew endpoint instead of purchasing a new overlapping membership.',
      'ACTIVE_MEMBERSHIP_EXISTS'
    );
  }

  const startDate = new Date();
  const endDate = addMonths(startDate, plan.durationMonths);
  const membership = await Membership.create({
    memberId,
    planId: plan._id,
    startDate,
    endDate,
    status: 'ACTIVE'
  });

  return membership.populate('planId');
}

async function renewMembership(memberId, membershipId, planIdFromClient) {
  const membership = await Membership.findById(membershipId);
  if (!membership || membership.memberId.toString() !== memberId) {
    throw notFound('Membership not found.');
  }

  await refreshMembership(membership);

  const planId = planIdFromClient || membership.planId;
  const plan = await MembershipPlan.findById(planId);
  if (!plan) {
    throw notFound('Membership plan not found.');
  }
  if (!plan.isActive) {
    throw conflict('This membership plan is inactive and cannot be used for renewal.', 'INACTIVE_PLAN');
  }

  if (membership.status === 'CANCELLED') {
    throw conflict('A cancelled membership cannot be renewed.', 'MEMBERSHIP_CANCELLED');
  }

  const now = new Date();
  const base = membership.status === 'ACTIVE' && membership.endDate > now ? membership.endDate : now;
  membership.startDate = membership.status === 'ACTIVE' ? membership.startDate : now;
  membership.endDate = addMonths(base, plan.durationMonths);
  membership.planId = plan._id;
  membership.status = 'ACTIVE';
  await membership.save();

  await createNotification({
    userId: memberId,
    type: 'MEMBERSHIP_RENEWED',
    title: 'Membership renewed',
    message: `Your membership is now active until ${membership.endDate.toISOString().slice(0, 10)}.`
  });

  return membership.populate('planId');
}

async function requireActiveMembership(memberId) {
  const membership = await getActiveMembership(memberId);
  if (!membership) {
    throw badRequest(
      'Cannot book this class because you do not have an active membership.',
      'NO_ACTIVE_MEMBERSHIP'
    );
  }
  return membership;
}

module.exports = {
  expireOverdue,
  notifyExpiringSoon,
  getActiveMembership,
  purchasePlan,
  renewMembership,
  requireActiveMembership,
  refreshMembership
};
