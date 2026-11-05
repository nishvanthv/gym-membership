const express = require('express');
const classController = require('../controllers/classController');
const bookingController = require('../controllers/bookingController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const classValidator = require('../validators/classValidator');
const { mongoId } = require('../validators/authValidator');

const router = express.Router();

router.use(authenticateToken);

router.get('/', classController.listClasses);
router.get('/:id', mongoId('id'), classController.getClass);
router.post('/', authorizeRoles('BRANCH_ADMIN', 'TRAINER'), classValidator.createClass, classController.createClass);
router.put('/:id', authorizeRoles('BRANCH_ADMIN', 'TRAINER'), classValidator.updateClass, classController.updateClass);
router.patch(
  '/:id/status',
  authorizeRoles('BRANCH_ADMIN', 'TRAINER'),
  classValidator.classStatus,
  classController.updateClassStatus
);
router.post('/:id/book', authorizeRoles('MEMBER'), mongoId('id'), bookingController.book);
router.get(
  '/:id/bookings',
  authorizeRoles('BRANCH_ADMIN', 'TRAINER'),
  mongoId('id'),
  classController.listClassBookings
);

module.exports = router;
