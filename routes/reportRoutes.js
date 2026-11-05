const express = require('express');
const reportController = require('../controllers/reportController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const reportValidator = require('../validators/reportValidator');

const router = express.Router();

router.use(authenticateToken, authorizeRoles('BRANCH_ADMIN'));
router.get('/attendance', reportValidator.dateRange, reportController.attendance);
router.get('/memberships', reportController.memberships);

module.exports = router;
