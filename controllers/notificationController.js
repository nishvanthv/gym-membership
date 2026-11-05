const { notFound } = require('../utils/errors');
const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');

exports.list = asyncHandler(async (req, res) => {
  const notifications = await notificationService.listForUser(req.user.id);
  res.json({ success: true, message: 'Notifications', data: notifications });
});

exports.markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user.id);
  if (!notification) throw notFound('Notification not found.');
  res.json({ success: true, message: 'Notification marked as read', data: notification });
});
