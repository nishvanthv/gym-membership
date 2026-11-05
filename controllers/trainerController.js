const bcrypt = require('bcryptjs');
const User = require('../models/User');
const TrainerProfile = require('../models/TrainerProfile');
const { notFound, conflict } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');

exports.createTrainer = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const exists = await User.findOne({ email });
  if (exists) {
    throw conflict('An account with this email already exists.', 'DUPLICATE_EMAIL');
  }

  const passwordHash = await bcrypt.hash(req.body.password, 10);
  const user = await User.create({
    name: req.body.name,
    email,
    passwordHash,
    role: 'TRAINER',
    branchId: req.user.branchId
  });

  const profile = await TrainerProfile.create({
    userId: user._id,
    specialization: req.body.specialization,
    phone: req.body.phone || '',
    experienceYears: req.body.experienceYears || 0,
    bio: req.body.bio || '',
    branchId: req.user.branchId,
    isActive: true
  });

  res.status(201).json({
    success: true,
    message: 'Trainer created successfully',
    data: { profile, user: user.toSafeObject() }
  });
});

exports.listTrainers = asyncHandler(async (req, res) => {
  const filter = { branchId: req.user.branchId };
  const trainers = await TrainerProfile.find(filter).populate('userId', 'name email role isActive').sort({ createdAt: -1 });
  res.json({ success: true, message: 'Trainers', data: trainers });
});

exports.getTrainer = asyncHandler(async (req, res) => {
  const trainer = await TrainerProfile.findOne({
    _id: req.params.id,
    branchId: req.user.branchId
  }).populate('userId', 'name email role isActive');
  if (!trainer) throw notFound('Trainer not found.');
  res.json({ success: true, message: 'Trainer', data: trainer });
});

exports.updateTrainer = asyncHandler(async (req, res) => {
  const trainer = await TrainerProfile.findOne({ _id: req.params.id, branchId: req.user.branchId });
  if (!trainer) throw notFound('Trainer not found.');

  if (req.body.specialization !== undefined) trainer.specialization = req.body.specialization;
  if (req.body.phone !== undefined) trainer.phone = req.body.phone;
  if (req.body.experienceYears !== undefined) trainer.experienceYears = req.body.experienceYears;
  if (req.body.bio !== undefined) trainer.bio = req.body.bio;
  await trainer.save();

  if (req.body.name) {
    await User.findByIdAndUpdate(trainer.userId, { name: req.body.name });
  }

  const populated = await trainer.populate('userId', 'name email role isActive');
  res.json({ success: true, message: 'Trainer updated successfully', data: populated });
});

exports.updateTrainerStatus = asyncHandler(async (req, res) => {
  const trainer = await TrainerProfile.findOneAndUpdate(
    { _id: req.params.id, branchId: req.user.branchId },
    { $set: { isActive: req.body.isActive } },
    { new: true }
  );
  if (!trainer) throw notFound('Trainer not found.');
  await User.findByIdAndUpdate(trainer.userId, { isActive: req.body.isActive });
  res.json({ success: true, message: 'Trainer status updated', data: trainer });
});
