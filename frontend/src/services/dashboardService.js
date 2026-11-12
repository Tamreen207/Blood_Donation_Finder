const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function normalizeBaseUrl(baseUrl) {
	return baseUrl.replace(/\/$/, '');
}

async function fetchJson(path, fallbackData) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) {
		return fallbackData;
	}

	const response = await fetch(`${baseUrl}${path}`, {
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (!response.ok) {
		throw new Error(`Request failed for ${path}`);
	}

	return response.json();
}

export async function fetchDashboardProfile() {
	return fetchJson('/api/users/profile', null);
}

export async function fetchMyRequests() {
	return fetchJson('/api/blood-requests/my-requests', []);
}

export async function fetchMyDonationHistory() {
	return fetchJson('/api/donations/my-history', []);
}

export async function fetchNotifications() {
	return fetchJson('/api/notifications', []);
}

export async function fetchNearbyBloodBanks() {
	return fetchJson('/api/blood-banks/nearby', []);
}
