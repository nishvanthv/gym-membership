const express = require('express');
const membershipController = require('../controllers/membershipController');
const authenticateToken = require('../middleware/auth');
const authorizeRoles = require('../middleware/roles');
const membershipValidator = require('../validators/membershipValidator');

const router = express.Router();

router.use(authenticateToken);

router.post('/', authorizeRoles('MEMBER'), membershipValidator.purchase, membershipController.purchase);
router.get('/my', authorizeRoles('MEMBER', 'BRANCH_ADMIN'), membershipController.myMemberships);
router.get('/:id', membershipValidator.membershipId, membershipController.getMembership);
router.post('/:id/renew', authorizeRoles('MEMBER'), membershipValidator.membershipId, membershipController.renew);

module.exports = router;
