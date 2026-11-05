const express = require('express');
const branchController = require('../controllers/branchController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { mongoId } = require('../validators/authValidator');

const router = express.Router();

router.get('/', branchController.listBranches);
router.get(
  '/members',
  authenticateToken,
  authorizeRoles('BRANCH_ADMIN', 'TRAINER'),
  branchController.listMembers
);
router.post(
  '/',
  authenticateToken,
  authorizeRoles('BRANCH_ADMIN'),
  body('name').trim().notEmpty().withMessage('Branch name is required.'),
  validate,
  branchController.createBranch
);
router.get('/:id', mongoId('id'), branchController.getBranch);

module.exports = router;
