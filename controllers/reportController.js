const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/reportService');

exports.attendance = asyncHandler(async (req, res) => {
  const data = await reportService.attendanceReport({
    branchId: req.user.branchId,
    from: req.query.from,
    to: req.query.to
  });
  res.json({ success: true, message: 'Attendance report', data });
});

exports.memberships = asyncHandler(async (req, res) => {
  const data = await reportService.membershipReport({ branchId: req.user.branchId });
  res.json({ success: true, message: 'Membership report', data });
});
