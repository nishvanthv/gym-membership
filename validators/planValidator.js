const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const createPlan = [
  body('name').trim().notEmpty().withMessage('Plan name is required.'),
  body('durationMonths')
    .isInt({ min: 1 })
    .withMessage('durationMonths must be a positive integer.'),
  body('price').isFloat({ min: 0 }).withMessage('price cannot be negative.'),
  body('description').optional().isString(),
  validate
];

const updatePlan = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId.'),
  body('name').optional().trim().notEmpty().withMessage('Plan name cannot be empty.'),
  body('durationMonths')
    .optional()
    .isInt({ min: 1 })
    .withMessage('durationMonths must be a positive integer.'),
  body('price').optional().isFloat({ min: 0 }).withMessage('price cannot be negative.'),
  body('description').optional().isString(),
  validate
];

const planStatus = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId.'),
  body('isActive').isBoolean().withMessage('isActive must be true or false.'),
  validate
];

module.exports = { createPlan, updatePlan, planStatus };
