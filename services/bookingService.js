const GymClass = require('../models/Class');
const Booking = require('../models/Booking');
const { conflict, notFound, badRequest, forbidden } = require('../utils/errors');
const { requireActiveMembership } = require('./membershipService');
const { createNotification } = require('./notificationService');

async function bookClass(classId, memberId) {
  await requireActiveMembership(memberId);

  const gymClass = await GymClass.findById(classId);
  if (!gymClass) {
    throw notFound('Class not found.');
  }
  if (gymClass.status === 'CANCELLED') {
    throw conflict('Cannot book a cancelled class.', 'CLASS_CANCELLED');
  }
  if (gymClass.status === 'COMPLETED') {
    throw conflict('Cannot book a completed class.', 'CLASS_COMPLETED');
  }
  if (gymClass.startTime <= new Date()) {
    throw conflict('Cannot book a class that has already started.', 'CLASS_ALREADY_STARTED');
  }

  const existing = await Booking.findOne({
    classId,
    memberId,
    status: { $in: ['CONFIRMED', 'WAITLISTED', 'ATTENDED', 'NO_SHOW'] }
  });
  if (existing) {
    throw conflict('You already have a booking for this class.', 'DUPLICATE_BOOKING');
  }

  const confirmed = await GymClass.findOneAndUpdate(
    {
      _id: classId,
      status: 'SCHEDULED',
      startTime: { $gt: new Date() },
      $expr: { $lt: ['$bookedCount', '$capacity'] }
    },
    { $inc: { bookedCount: 1 } },
    { new: true }
  );

  try {
    if (confirmed) {
      return Booking.create({
        classId,
        memberId,
        status: 'CONFIRMED',
        bookedAt: new Date()
      });
    }

    const latest = await GymClass.findById(classId);
    if (!latest || latest.status !== 'SCHEDULED' || latest.startTime <= new Date()) {
      throw conflict('This class is no longer available for booking.', 'CLASS_UNAVAILABLE');
    }

    return Booking.create({
      classId,
      memberId,
      status: 'WAITLISTED',
      bookedAt: new Date()
    });
  } catch (err) {
    if (confirmed) {
      await GymClass.findByIdAndUpdate(classId, { $inc: { bookedCount: -1 } });
    }
    if (err.code === 11000) {
      throw conflict('You already have a booking for this class.', 'DUPLICATE_BOOKING');
    }
    throw err;
  }
}

async function promoteWaitlist(classId) {
  const gymClass = await GymClass.findOneAndUpdate(
    {
      _id: classId,
      status: 'SCHEDULED',
      $expr: { $lt: ['$bookedCount', '$capacity'] }
    },
    { $inc: { bookedCount: 1 } },
    { new: true }
  );
  if (!gymClass) return null;

  const promoted = await Booking.findOneAndUpdate(
    { classId, status: 'WAITLISTED' },
    { $set: { status: 'CONFIRMED' } },
    { sort: { bookedAt: 1, createdAt: 1 }, new: true }
  );

  if (!promoted) {
    await GymClass.findOneAndUpdate(
      { _id: classId, bookedCount: { $gt: 0 } },
      { $inc: { bookedCount: -1 } }
    );
    return null;
  }

  await createNotification({
    userId: promoted.memberId,
    type: 'WAITLIST_PROMOTION',
    title: 'Waitlist promotion',
    message: `A spot opened in "${gymClass.title}". Your booking is now CONFIRMED.`
  });

  return promoted;
}

async function cancelBooking(bookingId, actor) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw notFound('Booking not found.');
  }

  const isOwner = booking.memberId.toString() === actor.id;
  const gymClass = await GymClass.findById(booking.classId);
  const isAdmin = actor.role === 'BRANCH_ADMIN'
    && gymClass
    && gymClass.branchId.toString() === actor.branchId;
  const isTrainer = actor.role === 'TRAINER'
    && gymClass
    && gymClass.branchId.toString() === actor.branchId
    && gymClass.trainerId.toString() === actor.id;
  const isStaff = isAdmin || isTrainer;
  if (!isOwner && !isStaff) {
    throw forbidden('You can only cancel your own bookings.');
  }

  if (booking.status === 'CANCELLED') {
    throw conflict('This booking is already cancelled.', 'BOOKING_ALREADY_CANCELLED');
  }
  if (booking.status === 'ATTENDED') {
    throw conflict('An attended booking cannot be cancelled.', 'BOOKING_ATTENDED');
  }

  const wasConfirmed = booking.status === 'CONFIRMED';
  booking.status = 'CANCELLED';
  await booking.save();

  if (wasConfirmed) {
    await GymClass.findOneAndUpdate(
      { _id: booking.classId, bookedCount: { $gt: 0 } },
      { $inc: { bookedCount: -1 } }
    );
    await promoteWaitlist(booking.classId);
  }

  return booking;
}

async function handleClassCancellation(gymClass) {
  const bookings = await Booking.find({
    classId: gymClass._id,
    status: { $in: ['CONFIRMED', 'WAITLISTED'] }
  });

  await Booking.updateMany(
    { classId: gymClass._id, status: { $in: ['CONFIRMED', 'WAITLISTED'] } },
    { $set: { status: 'CANCELLED' } }
  );

  gymClass.bookedCount = 0;
  await gymClass.save();

  await Promise.all(
    bookings.map((booking) =>
      createNotification({
        userId: booking.memberId,
        type: 'CLASS_CANCELLED',
        title: 'Class cancelled',
        message: `The class "${gymClass.title}" was cancelled. Your booking is no longer active.`
      })
    )
  );
}

async function assertTrainerAvailable(trainerId, startTime, endTime, excludeClassId) {
  const query = {
    trainerId,
    status: 'SCHEDULED',
    startTime: { $lt: endTime },
    endTime: { $gt: startTime }
  };
  if (excludeClassId) {
    query._id = { $ne: excludeClassId };
  }
  const overlap = await GymClass.findOne(query);
  if (overlap) {
    throw conflict('This trainer already has a class overlapping that time.', 'TRAINER_OVERLAP');
  }
}

function assertClassTimes(startTime, endTime) {
  if (!(endTime > startTime)) {
    throw badRequest('endTime must be after startTime.');
  }
}

module.exports = {
  bookClass,
  cancelBooking,
  promoteWaitlist,
  handleClassCancellation,
  assertTrainerAvailable,
  assertClassTimes
};
