import { Notification } from '../models/Notification.js';

export async function sendNotification({ userId, type = 'SYSTEM', title, message, relatedRequestId }) {
	return Notification.create({ userId, type, title, message, relatedRequestId });
}

export async function sendBulkNotifications(items = []) {
	if (!items.length) return [];
	return Notification.insertMany(items);
}
