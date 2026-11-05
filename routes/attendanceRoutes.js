const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const { checkin, classIdParam } = require('../validators/bookingValidator');

const router = express.Router();

router.use(authenticateToken);

router.post('/checkin', authorizeRoles('MEMBER'), checkin, attendanceController.checkin);
router.get('/my', authorizeRoles('MEMBER'), attendanceController.myAttendance);
router.get(
  '/class/:classId',
  authorizeRoles('TRAINER', 'BRANCH_ADMIN'),
  classIdParam,
  attendanceController.classAttendance
);

module.exports = router;
