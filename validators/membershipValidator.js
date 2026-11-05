const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const purchase = [
  body('planId').isMongoId().withMessage('planId is required and must be a valid id.'),
  validate
];

const membershipId = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId.'),
  validate
];

module.exports = { purchase, membershipId };
