const mongoose = require('mongoose');

const trainerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    experienceYears: { type: Number, default: 0, min: 0 },
    bio: { type: String, trim: true, default: '' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

trainerProfileSchema.index({ branchId: 1, isActive: 1 });

module.exports = mongoose.model('TrainerProfile', trainerProfileSchema);
