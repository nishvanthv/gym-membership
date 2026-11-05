const mongoose = require('mongoose');

const STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];

const classSchema = new mongoose.Schema(
  {
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    bookedCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: STATUSES, default: 'SCHEDULED' }
  },
  { timestamps: true }
);

classSchema.index({ trainerId: 1 });
classSchema.index({ startTime: 1 });
classSchema.index({ branchId: 1, startTime: 1 });
classSchema.index({ trainerId: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('GymClass', classSchema);
module.exports.STATUSES = STATUSES;
