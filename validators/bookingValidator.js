const { body, param } = require('express-validator');
const validate = require('../middleware/validate');

const checkin = [
  body('type').optional().isIn(['CLASS', 'GENERAL']).withMessage('type must be CLASS or GENERAL.'),
  body('classId')
    .optional()
    .isMongoId()
    .withMessage('classId must be a valid MongoDB ObjectId.'),
  validate
];

const classIdParam = [
  param('classId').isMongoId().withMessage('classId must be a valid MongoDB ObjectId.'),
  validate
];

const noteCreate = [
  param('memberId').isMongoId().withMessage('memberId must be a valid MongoDB ObjectId.'),
  body('type').isIn(['DIET', 'WORKOUT', 'GENERAL']).withMessage('type must be DIET, WORKOUT, or GENERAL.'),
  body('title').trim().notEmpty().withMessage('title is required.'),
  body('content').trim().notEmpty().withMessage('content is required.'),
  validate
];

module.exports = { checkin, classIdParam, noteCreate };
