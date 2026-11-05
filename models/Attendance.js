const mongoose = require('mongoose');

const TYPES = ['CLASS', 'GENERAL'];

const attendanceSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'GymClass', default: null },
    date: { type: Date, default: Date.now },
    type: { type: String, enum: TYPES, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

attendanceSchema.index({ memberId: 1 });
attendanceSchema.index({ classId: 1 });
attendanceSchema.index(
  { memberId: 1, classId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'CLASS', classId: { $type: 'objectId' } } }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
module.exports.TYPES = TYPES;
