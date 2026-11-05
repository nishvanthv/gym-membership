const express = require('express');
const notificationController = require('../controllers/notificationController');
const authenticateToken = require('../middleware/auth');
const { mongoId } = require('../validators/authValidator');

const router = express.Router();

router.use(authenticateToken);
router.get('/', notificationController.list);
router.patch('/:id/read', mongoId('id'), notificationController.markRead);

module.exports = router;
