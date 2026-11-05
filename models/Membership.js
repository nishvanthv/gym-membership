const mongoose = require('mongoose');

const STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED'];

const membershipSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: STATUSES, default: 'ACTIVE' }
  },
  { timestamps: true }
);

membershipSchema.index({ memberId: 1 });
membershipSchema.index({ status: 1 });
membershipSchema.index({ endDate: 1 });
membershipSchema.index({ memberId: 1, status: 1 });

module.exports = mongoose.model('Membership', membershipSchema);
module.exports.STATUSES = STATUSES;
