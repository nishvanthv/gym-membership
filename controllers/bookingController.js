const Booking = require('../models/Booking');
const GymClass = require('../models/Class');
const { notFound, forbidden } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');
const bookingService = require('../services/bookingService');

exports.book = asyncHandler(async (req, res) => {
  const booking = await bookingService.bookClass(req.params.id, req.user.id);
  res.status(201).json({
    success: true,
    message: booking.status === 'WAITLISTED' ? 'Class is full. You have been waitlisted.' : 'Class booked successfully',
    data: booking
  });
});

exports.cancel = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(req.params.id, req.user);
  res.json({ success: true, message: 'Booking cancelled', data: booking });
});

exports.myBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ memberId: req.user.id })
    .populate({ path: 'classId', populate: { path: 'trainerId', select: 'name email' } })
    .sort({ createdAt: -1 });
  res.json({ success: true, message: 'Your bookings', data: bookings });
});

exports.getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('classId memberId', 'title name email startTime branchId trainerId');
  if (!booking) throw notFound('Booking not found.');
  const ownerId = booking.memberId._id ? booking.memberId._id.toString() : booking.memberId.toString();
  if (req.user.role === 'MEMBER' && ownerId !== req.user.id) {
    throw forbidden('You can only view your own bookings.');
  }
  if (req.user.role !== 'MEMBER') {
    const gymClass = booking.classId && booking.classId._id
      ? booking.classId
      : await GymClass.findById(booking.classId);
    if (!gymClass || gymClass.branchId.toString() !== req.user.branchId) {
      throw forbidden('This booking belongs to another branch.');
    }
    if (req.user.role === 'TRAINER' && gymClass.trainerId.toString() !== req.user.id) {
      throw forbidden('You can only view bookings for your assigned classes.');
    }
  }
  res.json({ success: true, message: 'Booking', data: booking });
});
