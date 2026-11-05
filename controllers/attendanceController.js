const Attendance = require('../models/Attendance');
const Booking = require('../models/Booking');
const GymClass = require('../models/Class');
const { badRequest, conflict, notFound, forbidden } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');
const { requireActiveMembership } = require('../services/membershipService');

exports.checkin = asyncHandler(async (req, res) => {
  const type = req.body.type || (req.body.classId ? 'CLASS' : 'GENERAL');

  if (type === 'GENERAL') {
    await requireActiveMembership(req.user.id);
    const attendance = await Attendance.create({
      memberId: req.user.id,
      classId: null,
      date: new Date(),
      type: 'GENERAL'
    });
    return res.status(201).json({ success: true, message: 'General check-in recorded', data: attendance });
  }

  if (!req.body.classId) {
    throw badRequest('classId is required for class check-in.');
  }

  const gymClass = await GymClass.findById(req.body.classId);
  if (!gymClass) throw notFound('Class not found.');
  if (gymClass.status === 'CANCELLED') {
    throw conflict('Cannot check in to a cancelled class.', 'CLASS_CANCELLED');
  }

  const booking = await Booking.findOne({
    classId: gymClass._id,
    memberId: req.user.id
  });
  if (!booking || !['CONFIRMED', 'ATTENDED'].includes(booking.status)) {
    throw badRequest('You must have a confirmed booking for this class before checking in.');
  }
  if (booking.status === 'CANCELLED' || booking.status === 'WAITLISTED') {
    throw conflict('Cancelled or waitlisted bookings cannot check in.', 'INVALID_BOOKING_STATUS');
  }

  const duplicate = await Attendance.findOne({
    memberId: req.user.id,
    classId: gymClass._id,
    type: 'CLASS'
  });
  if (duplicate) {
    throw conflict('You have already checked in for this class.', 'DUPLICATE_CHECKIN');
  }

  const attendance = await Attendance.create({
    memberId: req.user.id,
    classId: gymClass._id,
    date: new Date(),
    type: 'CLASS'
  });

  booking.status = 'ATTENDED';
  await booking.save();

  res.status(201).json({ success: true, message: 'Class check-in recorded', data: { attendance, booking } });
});

exports.myAttendance = asyncHandler(async (req, res) => {
  const records = await Attendance.find({ memberId: req.user.id }).populate('classId', 'title startTime').sort({ date: -1 });
  res.json({ success: true, message: 'Your attendance', data: records });
});

exports.classAttendance = asyncHandler(async (req, res) => {
  const gymClass = await GymClass.findById(req.params.classId);
  if (!gymClass) throw notFound('Class not found.');

  const isTrainer = req.user.role === 'TRAINER' && gymClass.trainerId.toString() === req.user.id;
  const isAdmin = req.user.role === 'BRANCH_ADMIN' && gymClass.branchId.toString() === req.user.branchId;
  if (!isTrainer && !isAdmin) {
    throw forbidden('You can only view attendance for classes you manage.');
  }

  const records = await Attendance.find({ classId: gymClass._id, type: 'CLASS' })
    .populate('memberId', 'name email')
    .sort({ date: -1 });
  res.json({ success: true, message: 'Class attendance', data: records });
});
