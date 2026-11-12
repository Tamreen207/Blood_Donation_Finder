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
	} catch (_) { return {}; }
}

async function requestJson(path, init = {}, fallback = null) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) return fallback;
	const response = await fetch(`${baseUrl}${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...authHeader(), ...(init.headers || {}) },
	});
	if (!response.ok) {
		throw buildError(`Blood bank API failed (${response.status})`, 'REQUEST_FAILED', response.status);
	}
	return response.json();
}

export function isBloodBankApiConfigured() {
	return Boolean(normalizeBaseUrl(API_BASE_URL));
}

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export async function fetchMyBankProfile() {
	return requestJson('/api/blood-banks/me', {}, null);
}

export async function fetchDashboard() {
	return requestJson('/api/blood-banks/me/dashboard', {}, null);
}

export async function fetchInventorySummary() {
	return requestJson('/api/blood-banks/me/inventory/summary', {}, { success: true, data: { items: [] } });
}

export async function fetchRequestsSummary() {
	return requestJson('/api/blood-banks/me/requests/summary', {}, { success: true, data: { items: [], total: 0 } });
}

export async function fetchEmergencyRequests() {
	return requestJson('/api/blood-banks/me/emergency-requests', {}, { success: true, data: { items: [] } });
}

export async function fetchDonationsSummary() {
	return requestJson('/api/blood-banks/me/donations/summary', {}, { success: true, data: { today: 0, week: 0, month: 0, byDay: [] } });
}

export async function fetchRecentActivity() {
	return requestJson('/api/blood-banks/me/activity', {}, { success: true, data: { items: [] } });
}

export async function fetchRecentNotifications() {
	return requestJson('/api/blood-banks/me/notifications', {}, { success: true, data: { items: [] } });
}
