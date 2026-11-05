const WorkoutNote = require('../models/WorkoutNote');
const User = require('../models/User');
const { notFound, forbidden } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');

async function assertCanAccessMember(req, memberId) {
  if (req.user.role === 'MEMBER') {
    if (req.user.id !== memberId) {
      throw forbidden('You can only view your own notes.');
    }
    return;
  }
  const member = await User.findById(memberId);
  if (!member || member.role !== 'MEMBER') {
    throw notFound('Member not found.');
  }
  if (member.branchId.toString() !== req.user.branchId) {
    throw forbidden('This member belongs to another branch.');
  }
}

exports.createNote = asyncHandler(async (req, res) => {
  await assertCanAccessMember(req, req.params.memberId);
  const note = await WorkoutNote.create({
    memberId: req.params.memberId,
    trainerId: req.user.id,
    type: req.body.type,
    title: req.body.title,
    content: req.body.content
  });
  res.status(201).json({ success: true, message: 'Note created successfully', data: note });
});

exports.listNotes = asyncHandler(async (req, res) => {
  await assertCanAccessMember(req, req.params.memberId);
  const notes = await WorkoutNote.find({ memberId: req.params.memberId })
    .populate('trainerId', 'name email')
    .sort({ createdAt: -1 });
  res.json({ success: true, message: 'Member notes', data: notes });
});

exports.updateNote = asyncHandler(async (req, res) => {
  const note = await WorkoutNote.findById(req.params.id);
  if (!note) throw notFound('Note not found.');
  if (req.user.role === 'MEMBER') {
    throw forbidden('Members cannot edit trainer-created notes.');
  }
  if (req.user.role === 'TRAINER' && note.trainerId.toString() !== req.user.id) {
    throw forbidden('You can only edit notes you created.');
  }
  if (req.body.title !== undefined) note.title = req.body.title;
  if (req.body.content !== undefined) note.content = req.body.content;
  if (req.body.type !== undefined) note.type = req.body.type;
  await note.save();
  res.json({ success: true, message: 'Note updated successfully', data: note });
});

exports.deleteNote = asyncHandler(async (req, res) => {
  const note = await WorkoutNote.findById(req.params.id);
  if (!note) throw notFound('Note not found.');
  if (req.user.role === 'MEMBER') {
    throw forbidden('Members cannot delete trainer-created notes.');
  }
  if (req.user.role === 'TRAINER' && note.trainerId.toString() !== req.user.id) {
    throw forbidden('You can only delete notes you created.');
  }
  await note.deleteOne();
  res.json({ success: true, message: 'Note deleted', data: note });
});
