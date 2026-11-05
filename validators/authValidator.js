const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const register = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.'),
  body('branchId').optional().isMongoId().withMessage('branchId must be a valid id.'),
  validate
];

const login = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  validate
];

const mongoId = (name = 'id') => [
  param(name).isMongoId().withMessage(`${name} must be a valid MongoDB ObjectId.`),
  validate
];

module.exports = { register, login, mongoId };
