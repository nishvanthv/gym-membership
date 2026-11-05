const express = require('express');
const noteController = require('../controllers/noteController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const { noteCreate } = require('../validators/bookingValidator');
const { mongoId } = require('../validators/authValidator');

const router = express.Router();

router.use(authenticateToken);

router.post(
  '/members/:memberId/notes',
  authorizeRoles('TRAINER', 'BRANCH_ADMIN'),
  noteCreate,
  noteController.createNote
);
router.get('/members/:memberId/notes', mongoId('memberId'), noteController.listNotes);
router.put('/notes/:id', authorizeRoles('TRAINER', 'BRANCH_ADMIN'), mongoId('id'), noteController.updateNote);
router.delete('/notes/:id', authorizeRoles('TRAINER', 'BRANCH_ADMIN'), mongoId('id'), noteController.deleteNote);

module.exports = router;
