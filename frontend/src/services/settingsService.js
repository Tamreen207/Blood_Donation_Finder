const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const SETTINGS_KEY = 'lifelink_settings';

function normalizeBaseUrl(baseUrl) {
	return baseUrl.replace(/\/$/, '');
}

function buildError(message, code, status) {
	const err = new Error(message);
	if (code) err.code = code;
	if ((status)) err.status = status;
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

function readLocal() {
	try {
		const raw = localStorage.getItem(SETTINGS_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch (_) {
		return null;
	}
}

function writeLocal(value) {
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
	} catch (_) {
		// ignore
	}
}

const defaultSettings = () => ({
	general: { language: 'en', timeZone: 'UTC', dateFormat: 'DD/MM/YYYY' },
	notifications: {
		bloodRequestAlerts: true,
		emergencyAlerts: true,
		donationReminders: true,
		bloodBankUpdates: true,
		accountActivity: true,
		promotionalMessages: false,
		channels: { email: true, sms: false, push: true },
	},
	privacy: {
		profileVisibility: 'visible',
		approximateLocation: true,
		contactPrivacy: true,
	},
	donor: {
		available: true,
		searchRadius: '10 km',
	},
	appearance: { theme: 'system', compactMode: false },
});

export function getDefaultSettings() {
	return defaultSettings();
}

export function isSettingsApiConfigured() {
	return Boolean(normalizeBaseUrl(API_BASE_URL));
}

async function requestJson(path, init = {}, fallback = null) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) return fallback;
	const response = await fetch(`${baseUrl}${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...authHeader(), ...(init.headers || {}) },
	});
	if (!response.ok) {
		throw buildError(`Settings API failed (${response.status})`, 'REQUEST_FAILED', response.status);
	}
	return response.json();
}

export async function fetchSettings() {
	if (!isSettingsApiConfigured()) {
		return { success: true, data: readLocal() || defaultSettings() };
	}
	return requestJson('/api/users/me/settings', {}, { success: true, data: defaultSettings() });
}

export async function saveSettings(payload) {
	if (!isSettingsApiConfigured()) {
		writeLocal(payload);
		return { success: true, data: payload };
	}
	return requestJson('/api/users/me/settings', { method: 'PATCH', body: JSON.stringify(payload) }, { success: true, data: payload });
}

export async function saveNotificationPreferences(payload) {
	if (!isSettingsApiConfigured()) {
		const current = readLocal() || defaultSettings();
		writeLocal({ ...current, notifications: payload });
		return { success: true, data: payload };
	}
	return requestJson('/api/users/me/notification-preferences', { method: 'PATCH', body: JSON.stringify(payload) }, { success: true, data: payload });
}

export async function savePrivacyPreferences(payload) {
	if (!isSettingsApiConfigured()) {
		const current = readLocal() || defaultSettings();
		writeLocal({ ...current, privacy: payload });
		return { success: true, data: payload };
	}
	return requestJson('/api/users/me/privacy-preferences', { method: 'PATCH', body: JSON.stringify(payload) }, { success: true, data: payload });
}

export async function saveDonorPreferences(payload) {
	if (!isSettingsApiConfigured()) {
		const current = readLocal() || defaultSettings();
		writeLocal({ ...current, donor: payload });
		return { success: true, data: payload };
	}
	return requestJson('/api/users/me/donor-preferences', { method: 'PATCH', body: JSON.stringify(payload) }, { success: true, data: payload });
}

export async function changePassword({ currentPassword, newPassword }) {
	if (!isSettingsApiConfigured()) {
		return { success: true, message: 'Password change request accepted (no API configured)' };
	}
	return requestJson('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }, { success: true });
}

export async function requestDataExport() {
	if (!isSettingsApiConfigured()) {
		return { success: true, message: 'Export prepared locally (no API configured)' };
	}
	return requestJson('/api/users/me/export', { method: 'POST' }, { success: true });
}

export async function deleteAccount() {
	if (!isSettingsApiConfigured()) {
		return { success: true, message: 'Account deletion requested (no API configured)' };
	}
	return requestJson('/api/users/me', { method: 'DELETE' }, { success: true });
}

export async function resetPreferences() {
	if (!isSettingsApiConfigured()) {
		const fresh = defaultSettings();
		writeLocal(fresh);
		return { success: true, data: fresh };
	}
	return requestJson('/api/users/me/settings/reset', { method: 'POST' }, { success: true, data: defaultSettings() });
}
