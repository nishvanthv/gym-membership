const { query } = require('express-validator');
const validate = require('../middleware/validate');

const dateRange = [
  query('from').optional().isISO8601().withMessage('from must be a valid date.'),
  query('to').optional().isISO8601().withMessage('to must be a valid date.'),
  validate
];

module.exports = { dateRange };
