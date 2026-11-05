const mongoose = require('mongoose');

const TYPES = [
  'MEMBERSHIP_EXPIRING',
  'MEMBERSHIP_EXPIRED',
  'MEMBERSHIP_RENEWED',
  'WAITLIST_PROMOTION',
  'CLASS_CANCELLED',
  'GENERAL'
];

const STATUSES = ['UNREAD', 'READ'];

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TYPES, required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: STATUSES, default: 'UNREAD' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.TYPES = TYPES;
module.exports.STATUSES = STATUSES;
