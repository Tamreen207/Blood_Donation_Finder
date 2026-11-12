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
		throw buildError(`Profile API failed (${response.status})`, 'REQUEST_FAILED', response.status);
	}
	return response.json();
}

export function isProfileApiConfigured() {
	return Boolean(normalizeBaseUrl(API_BASE_URL));
}

export async function fetchMyProfile() {
	return requestJson('/api/users/me', {}, null);
}

export async function updateMyProfile(payload) {
	return requestJson('/api/users/me', { method: 'PATCH', body: JSON.stringify(payload) }, { success: true, data: payload });
}

export async function updateDonorStatus({ isAvailable }) {
	return requestJson('/api/users/me/donor-status', { method: 'PATCH', body: JSON.stringify({ isAvailable }) }, { success: true, data: { isAvailable } });
}

export async function updatePreferences(payload) {
	return requestJson('/api/users/me/preferences', { method: 'PATCH', body: JSON.stringify(payload) }, { success: true, data: payload });
}

export async function uploadProfilePhoto(file) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) {
		return { success: true, message: 'Photo prepared locally (no API configured)', data: { photoUrl: URL.createObjectURL(file) } };
	}
	const form = new FormData();
	form.append('photo', file);
	const token = localStorage.getItem('lifelink_token');
	const response = await fetch(`${baseUrl}/api/users/me/profile-photo`, {
		method: 'POST',
		headers: token ? { Authorization: `Bearer ${token}` } : {},
		body: form,
	});
	if (!response.ok) {
		throw buildError(`Upload failed (${response.status})`, 'REQUEST_FAILED', response.status);
	}
	return response.json();
}

export async function deleteProfilePhoto() {
	return requestJson('/api/users/me/profile-photo', { method: 'DELETE' }, { success: true });
}

export async function deleteAccount() {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) return { success: true, message: 'Account deletion requested (no API configured)' };
	const response = await fetch(`${baseUrl}/api/users/me`, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json', ...authHeader() },
	});
	if (!response.ok) {
		throw buildError(`Account deletion failed (${response.status})`, 'REQUEST_FAILED', response.status);
	}
	return response.json();
}
