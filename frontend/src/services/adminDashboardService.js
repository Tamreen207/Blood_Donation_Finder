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

export function isAdminApiConfigured() { return Boolean(normalizeBaseUrl(API_BASE_URL)); }

export async function fetchAdminDashboard() {
	return requestJson('/api/admin/dashboard', {}, null);
}

export async function fetchAdminSystemHealth() {
	return requestJson('/api/admin/dashboard/health', {}, null);
}
