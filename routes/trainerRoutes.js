const express = require('express');
const trainerController = require('../controllers/trainerController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const trainerValidator = require('../validators/trainerValidator');
const { mongoId } = require('../validators/authValidator');

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('BRANCH_ADMIN', 'TRAINER', 'MEMBER'), trainerController.listTrainers);
router.get('/:id', mongoId('id'), trainerController.getTrainer);
router.post('/', authorizeRoles('BRANCH_ADMIN'), trainerValidator.createTrainer, trainerController.createTrainer);
router.put('/:id', authorizeRoles('BRANCH_ADMIN'), trainerValidator.updateTrainer, trainerController.updateTrainer);
router.patch(
  '/:id/status',
  authorizeRoles('BRANCH_ADMIN'),
  trainerValidator.trainerStatus,
  trainerController.updateTrainerStatus
);

module.exports = router;
