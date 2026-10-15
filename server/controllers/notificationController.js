const db = require('../config/db');

// Get notifications for current user
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await db('notifications')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc')
      .limit(50);

    const unreadCountRow = await db('notifications')
      .where({ user_id: req.user.id, is_read: false })
      .count('* as count')
      .first();

    const unreadCount = Number(unreadCountRow.count) || 0;

    return res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

// Mark single notification as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notif = await db('notifications').where({ id }).first();
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notif.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await db('notifications').where({ id }).update({ is_read: true });
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    await db('notifications').where({ user_id: req.user.id, is_read: false }).update({ is_read: true });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
