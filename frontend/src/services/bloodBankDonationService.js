const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function normalizeBaseUrl(baseUrl) { return baseUrl.replace(/\/$/, ''); }

function authHeader() {
	try { const token = localStorage.getItem('lifelink_token'); return token ? { Authorization: `Bearer ${token}` } : {}; }
	catch (_) { return {}; }
}

function buildError(message, status) { const e = new Error(message); if (status) e.status = status; return e; }

async function requestJson(path, init = {}, fallback = null) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) return fallback;
	const response = await fetch(`${baseUrl}${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...authHeader(), ...(init.headers || {}) },
	});
	if (!response.ok) {
		const text = await response.text().catch(() => '');
		throw buildError(text || `Request failed (${response.status})`, response.status);
	}
	return response.json();
}

export function isBloodBankApiConfigured() { return Boolean(normalizeBaseUrl(API_BASE_URL)); }

function buildQuery(params = {}) {
	const usp = new URLSearchParams();
	Object.entries(params).forEach(([k, v]) => {
		if (v === undefined || v === null || v === '') return;
		if (Array.isArray(v)) v.forEach((item) => usp.append(k, String(item)));
		else usp.append(k, String(v));
	});
	const s = usp.toString();
	return s ? `?${s}` : '';
}

export async function fetchBankDonations(filters = {}) {
	return requestJson(`/api/blood-banks/me/donations${buildQuery(filters)}`, {}, null);
}

export async function fetchBankDonationsSummary() {
	return requestJson('/api/blood-banks/me/donations/summary', {}, null);
}

export async function fetchBankDonationDetails(id) {
	return requestJson(`/api/blood-banks/me/donations/${id}`, {}, null);
}

export async function fetchBankDonationActivity(id) {
	return requestJson(`/api/blood-banks/me/donations/${id}/activity`, {}, null);
}

export async function fetchBankDonors() {
	return requestJson('/api/blood-banks/me/donors', {}, null);
}

export async function createBankDonation(payload) {
	return requestJson('/api/blood-banks/me/donations', { method: 'POST', body: JSON.stringify(payload) }, null);
}

export async function transitionBankDonation(id, payload) {
	return requestJson(`/api/blood-banks/me/donations/${id}/transition`, { method: 'POST', body: JSON.stringify(payload) }, null);
}
