const mongoose = require('mongoose');

const STATUSES = ['CONFIRMED', 'WAITLISTED', 'CANCELLED', 'ATTENDED', 'NO_SHOW'];

const bookingSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'GymClass', required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: STATUSES, default: 'CONFIRMED' },
    bookedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

bookingSchema.index({ classId: 1 });
bookingSchema.index({ memberId: 1 });
bookingSchema.index(
  { classId: 1, memberId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['CONFIRMED', 'WAITLISTED', 'ATTENDED', 'NO_SHOW'] } }
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.STATUSES = STATUSES;
