const mongoose = require('mongoose');

const ROLES = ['MEMBER', 'TRAINER', 'BRANCH_ADMIN'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: 'MEMBER' },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ branchId: 1, role: 1 });

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    branchId: this.branchId,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
