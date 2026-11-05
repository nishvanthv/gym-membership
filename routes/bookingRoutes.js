const express = require('express');
const bookingController = require('../controllers/bookingController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const { mongoId } = require('../validators/authValidator');

const router = express.Router();

router.use(authenticateToken);

router.get('/my', authorizeRoles('MEMBER'), bookingController.myBookings);
router.get('/:id', mongoId('id'), bookingController.getBooking);
router.post('/:id/cancel', mongoId('id'), bookingController.cancel);

module.exports = router;
