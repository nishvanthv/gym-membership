const Attendance = require('../models/Attendance');
const Membership = require('../models/Membership');
const GymClass = require('../models/Class');
const User = require('../models/User');

async function attendanceReport({ branchId, from, to }) {
  const [classIds, memberIds] = await Promise.all([
    GymClass.find({ branchId }).distinct('_id'),
    User.find({ branchId, role: 'MEMBER' }).distinct('_id')
  ]);
  const match = {
    $or: [
      { type: 'CLASS', classId: { $in: classIds } },
      { type: 'GENERAL', memberId: { $in: memberIds } }
    ]
  };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }

  const byDate = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const byClass = await Attendance.aggregate([
    { $match: { ...match, type: 'CLASS' } },
    { $group: { _id: '$classId', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const byMember = await Attendance.aggregate([
    { $match: match },
    { $group: { _id: '$memberId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 50 }
  ]);

  const branchCount = await Attendance.countDocuments(match);
  const byBranch = [{ branchId, count: branchCount }];

  const totalAttendance = await Attendance.countDocuments(match);

  return {
    totalAttendance,
    byDate: byDate.map((row) => ({ date: row._id, count: row.count })),
    byClass: byClass.map((row) => ({ classId: row._id, count: row.count })),
    byMember: byMember.map((row) => ({ memberId: row._id, count: row.count })),
    byBranch
  };
}

async function membershipReport({ branchId }) {
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const memberIds = await User.find({ branchId, role: 'MEMBER' }).distinct('_id');
  const branchMatch = { memberId: { $in: memberIds } };
  const [active, expired, cancelled, upcomingExpirations, byPlan, renewals] = await Promise.all([
    Membership.countDocuments({ ...branchMatch, status: 'ACTIVE' }),
    Membership.countDocuments({ ...branchMatch, status: 'EXPIRED' }),
    Membership.countDocuments({ ...branchMatch, status: 'CANCELLED' }),
    Membership.countDocuments({ ...branchMatch, status: 'ACTIVE', endDate: { $gte: now, $lte: inSevenDays } }),
    Membership.aggregate([
      { $match: branchMatch },
      { $group: { _id: '$planId', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Membership.aggregate([
      { $match: branchMatch },
      { $group: { _id: '$memberId', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
      { $count: 'renewals' }
    ])
  ]);

  return {
    branchId: branchId || null,
    activeMemberships: active,
    expiredMemberships: expired,
    cancelledMemberships: cancelled,
    upcomingExpirations,
    membershipsByPlan: byPlan.map((row) => ({ planId: row._id, count: row.count })),
    renewalCounts: Array.isArray(renewals) && renewals[0] ? renewals[0].renewals : 0
  };
}

module.exports = { attendanceReport, membershipReport };
