const Notification = require('../models/Notification');

async function createNotification({ userId, type, title, message }) {
  return Notification.create({ userId, type, title, message, status: 'UNREAD' });
}

async function listForUser(userId) {
  return Notification.find({ userId }).sort({ createdAt: -1 }).limit(100);
}

async function markRead(notificationId, userId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { status: 'READ' },
    { new: true }
  );
  return notification;
}

module.exports = { createNotification, listForUser, markRead };
