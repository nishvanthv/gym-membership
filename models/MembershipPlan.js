const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    durationMonths: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, default: '' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

membershipPlanSchema.index({ name: 1, branchId: 1 });
membershipPlanSchema.index({ branchId: 1, isActive: 1 });

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
