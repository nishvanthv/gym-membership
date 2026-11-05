const express = require('express');
const planController = require('../controllers/planController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const planValidator = require('../validators/planValidator');
const { mongoId } = require('../validators/authValidator');

const router = express.Router();

router.use(authenticateToken);

router.get('/', planController.listPlans);
router.get('/:id', mongoId('id'), planController.getPlan);
router.post('/', authorizeRoles('BRANCH_ADMIN'), planValidator.createPlan, planController.createPlan);
router.put('/:id', authorizeRoles('BRANCH_ADMIN'), planValidator.updatePlan, planController.updatePlan);
router.patch('/:id/status', authorizeRoles('BRANCH_ADMIN'), planValidator.planStatus, planController.updatePlanStatus);
router.delete('/:id', authorizeRoles('BRANCH_ADMIN'), mongoId('id'), planController.deletePlan);

module.exports = router;
