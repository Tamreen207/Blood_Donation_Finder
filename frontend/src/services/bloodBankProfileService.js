const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function normalizeBaseUrl(b) { return b.replace(/\/$/, ''); }

function authHeader() {
	try { const t = localStorage.getItem('lifelink_token'); return t ? { Authorization: `Bearer ${t}` } : {}; }
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

async function uploadFile(path, file) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) throw buildError('API not configured', 0);
	const form = new FormData();
	form.append('logo', file);
	const response = await fetch(`${baseUrl}${path}`, {
		method: 'POST',
		headers: { ...authHeader() },
		body: form,
	});
	if (!response.ok) throw buildError(`Upload failed (${response.status})`, response.status);
	return response.json();
}

export function isBloodBankApiConfigured() { return Boolean(normalizeBaseUrl(API_BASE_URL)); }

export async function fetchMyBankProfile() {
	return requestJson('/api/blood-banks/me', {}, null);
}

export async function updateMyBankProfile(payload) {
	return requestJson('/api/blood-banks/me', { method: 'PUT', body: JSON.stringify(payload) }, null);
}

export async function uploadBankLogo(file) {
	return uploadFile('/api/blood-banks/me/logo', file);
}

export async function deleteBankLogo() {
	return requestJson('/api/blood-banks/me/logo', { method: 'DELETE' }, null);
}
