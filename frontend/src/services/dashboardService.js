const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function authHeader() {
	try {
		const token = localStorage.getItem('lifelink_token');
		return token ? { Authorization: `Bearer ${token}` } : {};
	} catch (_) { return {}; }
}

async function fetchJson(path, fallbackData = null) {
	if (!API_BASE_URL) return fallbackData;
	try {
		const response = await fetch(`${API_BASE_URL}${path}`, {
			headers: { 'Content-Type': 'application/json', ...authHeader() },
		});
		if (!response.ok) return fallbackData;
		const text = await response.text();
		return text ? JSON.parse(text) : fallbackData;
	} catch (_) {
		return fallbackData;
	}
}

export async function fetchDashboardProfile() {
	const me = await fetchJson('/api/auth/me', null);
	if (me?.data?.user || me?.user) return me;
	try {
		const raw = localStorage.getItem('lifelink_user');
		return raw ? { data: { user: JSON.parse(raw) } } : null;
	} catch (_) { return null; }
}

export async function fetchMyRequests() {
	const res = await fetchJson('/api/requests', { success: true, data: [] });
	const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
	return { success: true, data: items };
}

export async function fetchMyDonationHistory() {
	const res = await fetchJson('/api/donations/my-history?limit=20', { success: true, data: { items: [] } });
	const data = res?.data || res || {};
	const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
	return { success: true, data: items };
}

export async function fetchNotifications() {
	const res = await fetchJson('/api/notifications', { success: true, data: { items: [] } });
	const data = res?.data || res || {};
	const items = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
	return { success: true, data: items };
}

export async function fetchNearbyBloodBanks() {
	const res = await fetchJson('/api/blood-banks', { success: true, data: [] });
	const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
	return { success: true, data: items };
}
