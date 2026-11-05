const User = require('../models/User');
const GymClass = require('../models/Class');
const Booking = require('../models/Booking');
const Attendance = require('../models/Attendance');
const WorkoutNote = require('../models/WorkoutNote');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { getActiveMembership } = require('../services/membershipService');

exports.memberDashboard = asyncHandler(async (req, res) => {
  const memberId = req.user.id;
  const [profile, membership, availableClasses, bookings, attendance, notes, notifications] = await Promise.all([
    User.findById(memberId).populate('branchId', 'name address'),
    getActiveMembership(memberId),
    GymClass.find({
      branchId: req.user.branchId,
      status: 'SCHEDULED',
      startTime: { $gt: new Date() }
    })
      .populate('trainerId', 'name')
      .sort({ startTime: 1 })
      .limit(20),
    Booking.find({ memberId, status: { $in: ['CONFIRMED', 'WAITLISTED'] } })
      .populate('classId')
      .sort({ createdAt: -1 }),
    Attendance.find({ memberId }).populate('classId', 'title startTime').sort({ date: -1 }).limit(20),
    WorkoutNote.find({ memberId }).populate('trainerId', 'name').sort({ createdAt: -1 }).limit(20),
    Notification.find({ userId: memberId }).sort({ createdAt: -1 }).limit(20)
  ]);

  res.json({
    success: true,
    message: 'Member dashboard',
    data: {
      profile: profile.toSafeObject(),
      currentMembership: membership,
      membershipExpiry: membership ? membership.endDate : null,
      availableClasses,
      upcomingBookings: bookings.filter((b) => b.status === 'CONFIRMED'),
      waitlistedClasses: bookings.filter((b) => b.status === 'WAITLISTED'),
      attendanceHistory: attendance,
      notes,
      notifications
    }
  });
});

exports.trainerDashboard = asyncHandler(async (req, res) => {
  const classes = await GymClass.find({ trainerId: req.user.id }).sort({ startTime: 1 });
  res.json({
    success: true,
    message: 'Trainer dashboard',
    data: {
      assignedClasses: classes,
      upcomingCount: classes.filter((c) => c.status === 'SCHEDULED' && c.startTime > new Date()).length
    }
  });
});
