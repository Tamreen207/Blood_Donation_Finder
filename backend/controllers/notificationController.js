import { Notification } from '../models/Notification.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';

export const listMyNotifications = asyncHandler(async (req, res) => {
	const items = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
	const unread = await Notification.countDocuments({ userId: req.user._id, isRead: false });
	res.json({ success: true, data: { items, unreadCount: unread } });
});

export const markRead = asyncHandler(async (req, res) => {
	const n = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
	if (!n) throw new ApiError(404, 'Notification not found');
	n.isRead = true;
	await n.save();
	res.json({ success: true, data: n });
});

export const markAllRead = asyncHandler(async (req, res) => {
	await Notification.updateMany({ userId: req.user._id, isRead: false }, { $set: { isRead: true } });
	res.json({ success: true, message: 'All notifications marked as read' });
});
