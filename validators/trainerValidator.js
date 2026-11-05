const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const createTrainer = [
  body('name').trim().notEmpty().withMessage('Trainer name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required.'),
  body('phone').optional().isString(),
  body('experienceYears')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('experienceYears cannot be negative.'),
  body('bio').optional().isString(),
  validate
];

const updateTrainer = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId.'),
  body('specialization').optional().trim().notEmpty(),
  body('phone').optional().isString(),
  body('experienceYears').optional().isFloat({ min: 0 }),
  body('bio').optional().isString(),
  body('name').optional().trim().notEmpty(),
  validate
];

const trainerStatus = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId.'),
  body('isActive').isBoolean().withMessage('isActive must be true or false.'),
  validate
];

module.exports = { createTrainer, updateTrainer, trainerStatus };
