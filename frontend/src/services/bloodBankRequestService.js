const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function normalizeBaseUrl(baseUrl) {
	return baseUrl.replace(/\/$/, '');
}

function authHeader() {
	try {
		const token = localStorage.getItem('lifelink_token');
		return token ? { Authorization: `Bearer ${token}` } : {};
	} catch (_) { return {}; }
}

function buildError(message, status) {
	const err = new Error(message);
	if (status) err.status = status;
	return err;
}

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

export function isBloodBankApiConfigured() {
	return Boolean(normalizeBaseUrl(API_BASE_URL));
}

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

export async function fetchBankRequests(filters = {}) {
	return requestJson(`/api/blood-banks/me/requests${buildQuery(filters)}`, {}, null);
}

export async function fetchBankRequestsSummary() {
	return requestJson('/api/blood-banks/me/requests/summary', {}, null);
}

export async function fetchBankRequestDetails(id) {
	return requestJson(`/api/blood-banks/me/requests/${id}`, {}, null);
}

export async function fetchBankRequestActivity(id) {
	return requestJson(`/api/blood-banks/me/requests/${id}/activity`, {}, null);
}

export async function respondToBankRequest(id, payload) {
	return requestJson(
		`/api/blood-banks/me/requests/${id}/respond`,
		{ method: 'POST', body: JSON.stringify(payload) },
		null
	);
}

export async function fetchBankInventory(bloodGroup) {
	return requestJson(`/api/inventory${bloodGroup ? `?bloodGroup=${encodeURIComponent(bloodGroup)}` : ''}`, {}, null);
}
