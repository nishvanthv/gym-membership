const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const createClass = [
  body('trainerId').isMongoId().withMessage('trainerId must be a valid id.'),
  body('title').trim().notEmpty().withMessage('Class title is required.'),
  body('description').optional().isString(),
  body('startTime').isISO8601().withMessage('startTime must be a valid date.'),
  body('endTime').isISO8601().withMessage('endTime must be a valid date.'),
  body('capacity').isInt({ min: 1 }).withMessage('capacity must be greater than 0.'),
  validate
];

const updateClass = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId.'),
  body('title').optional().trim().notEmpty(),
  body('description').optional().isString(),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
  body('capacity').optional().isInt({ min: 1 }).withMessage('capacity must be greater than 0.'),
  body('trainerId').optional().isMongoId(),
  validate
];

const classStatus = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId.'),
  body('status')
    .isIn(['SCHEDULED', 'COMPLETED', 'CANCELLED'])
    .withMessage('status must be SCHEDULED, COMPLETED, or CANCELLED.'),
  validate
];

module.exports = { createClass, updateClass, classStatus };
