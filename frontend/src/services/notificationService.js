const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function normalizeBaseUrl(baseUrl) {
	return baseUrl.replace(/\/$/, '');
}

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
	} catch (_) {
		return {};
	}
}

async function requestJson(path, init = {}, fallback = null) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) return fallback;
	const response = await fetch(`${baseUrl}${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...authHeader(), ...(init.headers || {}) },
	});
	if (!response.ok) {
		throw buildError(`Notification API failed (${response.status})`, 'REQUEST_FAILED', response.status);
	}
	return response.json();
}

export function isNotificationApiConfigured() {
	return Boolean(normalizeBaseUrl(API_BASE_URL));
}

export async function fetchNotifications({ page = 1, limit = 20 } = {}) {
	return requestJson(`/api/notifications?page=${page}&limit=${limit}`, {}, { success: true, data: { items: [], total: 0, page, limit } });
}

export async function fetchUnreadCount() {
	return requestJson('/api/notifications/unread-count', {}, { success: true, data: { unread: 0 } });
}

export async function markNotificationRead(id) {
	return requestJson(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' }, { success: true });
}

export async function markNotificationUnread(id) {
	return requestJson(`/api/notifications/${encodeURIComponent(id)}/unread`, { method: 'PATCH' }, { success: true });
}

export async function markAllNotificationsRead() {
	return requestJson('/api/notifications/read-all', { method: 'PATCH' }, { success: true });
}

export async function deleteNotification(id) {
	return requestJson(`/api/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' }, { success: true });
}

export async function clearReadNotifications() {
	return requestJson('/api/notifications/clear-read', { method: 'DELETE' }, { success: true });
}
