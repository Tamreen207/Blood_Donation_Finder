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

export function isDonationApiConfigured() {
	return Boolean(normalizeBaseUrl(API_BASE_URL));
}

function authHeader() {
	try {
		const token = localStorage.getItem('lifelink_token');
		return token ? { Authorization: `Bearer ${token}` } : {};
	} catch (_) {
		return {};
	}
}

async function fetchJson(path, fallback) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) return fallback;
	const response = await fetch(`${baseUrl}${path}`, { headers: { 'Content-Type': 'application/json', ...authHeader() } });
	if (!response.ok) {
		throw buildError(`Donation API failed (${response.status})`, 'REQUEST_FAILED', response.status);
	}
	return response.json();
}

export async function fetchMyDonationHistory({ page = 1, limit = 20 } = {}) {
	const params = new URLSearchParams({ page: String(page), limit: String(limit) });
	return fetchJson(`/api/donations/my-history?${params.toString()}`, { success: true, data: { items: [], total: 0, page, limit } });
}

export async function fetchDonationById(id) {
	return fetchJson(`/api/donations/my-history/${encodeURIComponent(id)}`, null);
}

export async function fetchDonationStatistics() {
	return fetchJson('/api/donations/statistics', null);
}

export async function fetchDonationEligibility() {
	return fetchJson('/api/donations/eligibility', null);
}

export async function fetchUpcomingDonation() {
	return fetchJson('/api/donations/upcoming', null);
}

export async function recordDonation(payload) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) {
		return { success: true, message: 'Donation recorded locally (no API configured)', data: { donation: { _id: `DON-LOCAL-${Date.now().toString(36).toUpperCase()}`, ...payload, status: 'COMPLETED', createdAt: new Date().toISOString() } } };
	}
	const response = await fetch(`${baseUrl}/api/donations/record`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...authHeader() },
		body: JSON.stringify(payload),
	});
	if (!response.ok) throw buildError(`Record donation failed (${response.status})`, 'REQUEST_FAILED', response.status);
	return response.json();
}

export async function cancelDonation(id) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) return { success: true, message: 'Donation cancelled locally' };
	const response = await fetch(`${baseUrl}/api/donations/${encodeURIComponent(id)}/cancel`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json', ...authHeader() },
	});
	if (!response.ok) throw buildError(`Cancel failed (${response.status})`, 'REQUEST_FAILED', response.status);
	return response.json();
}

export async function exportDonations(format = 'pdf') {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) return { success: true, message: 'Export prepared locally', data: { format } };
	const response = await fetch(`${baseUrl}/api/donations/export?format=${encodeURIComponent(format)}`, { headers: { ...authHeader() } });
	if (!response.ok) throw buildError(`Export failed (${response.status})`, 'REQUEST_FAILED', response.status);
	return response.json();
}
