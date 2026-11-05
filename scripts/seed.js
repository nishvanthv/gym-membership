require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Branch = require('../models/Branch');
const User = require('../models/User');
const TrainerProfile = require('../models/TrainerProfile');
const MembershipPlan = require('../models/MembershipPlan');

async function seed() {
  await connectDB();

  let branch = await Branch.findOne({ name: 'Downtown Fitness' });
  if (!branch) {
    branch = await Branch.create({
      name: 'Downtown Fitness',
      address: '12 Main Street',
      phone: '555-0100',
      isActive: true
    });
  }

  async function upsertUser({ name, email, password, role }) {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role,
        branchId: branch._id,
        isActive: true
      });
    }
    return user;
  }

  const admin = await upsertUser({
    name: 'Branch Admin',
    email: 'admin@gym.local',
    password: 'Admin@123',
    role: 'BRANCH_ADMIN'
  });

  const trainerUser = await upsertUser({
    name: 'Alex Trainer',
    email: 'trainer@gym.local',
    password: 'Trainer@123',
    role: 'TRAINER'
  });

  const trainerProfile = await TrainerProfile.findOne({ userId: trainerUser._id });
  if (!trainerProfile) {
    await TrainerProfile.create({
      userId: trainerUser._id,
      specialization: 'Yoga',
      phone: '555-0200',
      experienceYears: 5,
      bio: 'Demo trainer for academic walkthroughs.',
      branchId: branch._id,
      isActive: true
    });
  }

  await upsertUser({
    name: 'Demo Member',
    email: 'member@gym.local',
    password: 'Member@123',
    role: 'MEMBER'
  });

  const plan = await MembershipPlan.findOne({ name: 'Premium', branchId: branch._id });
  if (!plan) {
    await MembershipPlan.create({
      name: 'Premium',
      durationMonths: 1,
      price: 1499,
      description: 'One-month premium access',
      branchId: branch._id,
      isActive: true
    });
  }

  console.log('Seed complete. Demo credentials (development only):');
  console.log('  Admin:   admin@gym.local / Admin@123');
  console.log('  Trainer: trainer@gym.local / Trainer@123');
  console.log('  Member:  member@gym.local / Member@123');
  console.log('  Branch: ', branch._id.toString());
  console.log('  Admin:  ', admin._id.toString());

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
