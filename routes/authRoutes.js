const express = require('express');
const authController = require('../controllers/authController');
const authenticateToken = require('../middleware/auth');
const authValidator = require('../validators/authValidator');

const router = express.Router();

router.post('/register', authValidator.register, authController.register);
router.post('/login', authValidator.login, authController.login);
router.get('/me', authenticateToken, authController.me);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
