const GymClass = require('../models/Class');
const TrainerProfile = require('../models/TrainerProfile');
const Booking = require('../models/Booking');
const { notFound, badRequest, forbidden } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');
const bookingService = require('../services/bookingService');

async function resolveActiveTrainerUserId(trainerId, branchId) {
  const profile = await TrainerProfile.findOne({
    $or: [{ _id: trainerId }, { userId: trainerId }],
    branchId,
    isActive: true
  });
  if (!profile) {
    throw badRequest('Trainer must exist, belong to this branch, and be active.');
  }
  return profile.userId;
}

function canManageClass(req, gymClass) {
  if (req.user.role === 'BRANCH_ADMIN' && gymClass.branchId.toString() === req.user.branchId) {
    return true;
  }
  if (req.user.role === 'TRAINER' && gymClass.trainerId.toString() === req.user.id) {
    return true;
  }
  return false;
}

exports.createClass = asyncHandler(async (req, res) => {
  const startTime = new Date(req.body.startTime);
  const endTime = new Date(req.body.endTime);
  bookingService.assertClassTimes(startTime, endTime);

  const trainerUserId = await resolveActiveTrainerUserId(req.body.trainerId, req.user.branchId);
  if (req.user.role === 'TRAINER' && trainerUserId.toString() !== req.user.id) {
    throw forbidden('Trainers can only create classes assigned to themselves.');
  }

  await bookingService.assertTrainerAvailable(trainerUserId, startTime, endTime);

  const gymClass = await GymClass.create({
    trainerId: trainerUserId,
    branchId: req.user.branchId,
    title: req.body.title,
    description: req.body.description || '',
    startTime,
    endTime,
    capacity: req.body.capacity,
    bookedCount: 0,
    status: 'SCHEDULED'
  });

  res.status(201).json({ success: true, message: 'Class created successfully', data: gymClass });
});

exports.listClasses = asyncHandler(async (req, res) => {
  const filter = { branchId: req.user.branchId };
  if (req.user.role === 'TRAINER') {
    filter.trainerId = req.user.id;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  const classes = await GymClass.find(filter).populate('trainerId', 'name email').sort({ startTime: 1 });
  res.json({ success: true, message: 'Classes', data: classes });
});

exports.getClass = asyncHandler(async (req, res) => {
  const gymClass = await GymClass.findById(req.params.id).populate('trainerId', 'name email');
  if (!gymClass) throw notFound('Class not found.');
  if (gymClass.branchId.toString() !== req.user.branchId) {
    throw forbidden('This class belongs to another branch.');
  }
  if (req.user.role === 'TRAINER' && gymClass.trainerId._id.toString() !== req.user.id) {
    throw forbidden('You can only view classes assigned to you.');
  }
  res.json({ success: true, message: 'Class', data: gymClass });
});

exports.updateClass = asyncHandler(async (req, res) => {
  const gymClass = await GymClass.findById(req.params.id);
  if (!gymClass) throw notFound('Class not found.');
  if (!canManageClass(req, gymClass)) {
    throw forbidden('You cannot update this class.');
  }

  const startTime = req.body.startTime ? new Date(req.body.startTime) : gymClass.startTime;
  const endTime = req.body.endTime ? new Date(req.body.endTime) : gymClass.endTime;
  bookingService.assertClassTimes(startTime, endTime);

  let trainerId = gymClass.trainerId;
  if (req.body.trainerId) {
    trainerId = await resolveActiveTrainerUserId(req.body.trainerId, req.user.branchId);
  }

  if (req.body.capacity !== undefined && req.body.capacity < gymClass.bookedCount) {
    throw badRequest('capacity cannot be lower than the current confirmed booking count.');
  }

  await bookingService.assertTrainerAvailable(trainerId, startTime, endTime, gymClass._id);

  gymClass.trainerId = trainerId;
  gymClass.title = req.body.title !== undefined ? req.body.title : gymClass.title;
  gymClass.description = req.body.description !== undefined ? req.body.description : gymClass.description;
  gymClass.startTime = startTime;
  gymClass.endTime = endTime;
  if (req.body.capacity !== undefined) gymClass.capacity = req.body.capacity;
  await gymClass.save();

  res.json({ success: true, message: 'Class updated successfully', data: gymClass });
});

exports.updateClassStatus = asyncHandler(async (req, res) => {
  const gymClass = await GymClass.findById(req.params.id);
  if (!gymClass) throw notFound('Class not found.');
  if (!canManageClass(req, gymClass)) {
    throw forbidden('You cannot change this class status.');
  }

  const previous = gymClass.status;
  gymClass.status = req.body.status;
  await gymClass.save();

  if (req.body.status === 'CANCELLED' && previous !== 'CANCELLED') {
    await bookingService.handleClassCancellation(gymClass);
  }

  res.json({ success: true, message: 'Class status updated', data: gymClass });
});

exports.listClassBookings = asyncHandler(async (req, res) => {
  const gymClass = await GymClass.findById(req.params.id);
  if (!gymClass) throw notFound('Class not found.');
  if (!canManageClass(req, gymClass)) {
    throw forbidden('You cannot view bookings for this class.');
  }
  const bookings = await Booking.find({ classId: gymClass._id }).populate('memberId', 'name email').sort({ bookedAt: 1 });
  res.json({ success: true, message: 'Class bookings', data: bookings });
});
