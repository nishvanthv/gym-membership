const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');

const router = express.Router();

router.use(authenticateToken);
router.get('/member/dashboard', authorizeRoles('MEMBER'), dashboardController.memberDashboard);
router.get('/trainer/dashboard', authorizeRoles('TRAINER'), dashboardController.trainerDashboard);

module.exports = router;
