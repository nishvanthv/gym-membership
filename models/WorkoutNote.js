const mongoose = require('mongoose');

const TYPES = ['DIET', 'WORKOUT', 'GENERAL'];

const workoutNoteSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TYPES, required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

workoutNoteSchema.index({ memberId: 1, createdAt: -1 });
workoutNoteSchema.index({ trainerId: 1 });

module.exports = mongoose.model('WorkoutNote', workoutNoteSchema);
module.exports.TYPES = TYPES;
