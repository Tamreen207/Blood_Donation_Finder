const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function buildError(message, code, status) {
	const err = new Error(message);
	if (code) err.code = code;
	if (status) err.status = status;
	return err;
}

function authHeader() {
	try {
		const token = localStorage.getItem('lifelink_token');
		return token ? { Authorization: `Bearer ${token}` } : {};
	} catch (_) { return {}; }
}

async function requestJson(path, init = {}, fallback = null) {
	if (!API_BASE_URL) return fallback;
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...authHeader(), ...(init.headers || {}) },
	});
	if (!response.ok) {
		if (fallback !== null) return fallback;
		throw buildError(`Notification API failed (${response.status})`, 'REQUEST_FAILED', response.status);
	}
	const text = await response.text();
	return text ? JSON.parse(text) : null;
}

export function isNotificationApiConfigured() {
	return Boolean(API_BASE_URL);
}

export async function fetchNotifications({ page = 1, limit = 20 } = {}) {
	const res = await requestJson('/api/notifications', {}, { success: true, data: { items: [], unreadCount: 0 } });
	const data = res?.data || res || {};
	const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
	return { success: true, data: { items, total: items.length, unread: data.unreadCount ?? data.unread ?? 0, page, limit } };
}

export async function fetchUnreadCount() {
	const res = await fetchNotifications();
	return { success: true, data: { unread: res?.data?.unread ?? 0 } };
}

export async function markNotificationRead(id) {
	return requestJson(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' }, { success: true });
}

export async function markNotificationUnread(id) {
	return { success: false, message: 'Mark unread not supported by backend.' };
}

export async function markAllNotificationsRead() {
	return requestJson('/api/notifications/read-all', { method: 'PUT' }, { success: true });
}

export async function deleteNotification(id) {
	return { success: false, message: 'Delete notification not supported by backend.' };
}

export async function clearReadNotifications() {
	return { success: false, message: 'Clear read notifications not supported by backend.' };
}
