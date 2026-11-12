const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function normalizeBaseUrl(baseUrl) {
	return baseUrl.replace(/\/$/, '');
}

function getAuthHeaders() {
	const headers = { 'Content-Type': 'application/json' };
	try {
		const token = localStorage.getItem('lifelink_token');
		if (token) headers['Authorization'] = `Bearer ${token}`;
	} catch (_) {}
	return headers;
}

async function fetchJson(path, query = {}, fallbackData = null) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) {
		return fallbackData;
	}

	const searchParams = new URLSearchParams();
	Object.entries(query).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			searchParams.set(key, String(value));
		}
	});

	const queryString = searchParams.toString();
	const response = await fetch(`${baseUrl}${path}${queryString ? `?${queryString}` : ''}`, {
		headers: getAuthHeaders(),
		cache: 'no-store',
	});

	if (!response.ok) {
		throw new Error(`Request failed for ${path}`);
	}

	return response.json();
}

function normalizeRadius(r) {
	if (!r) return 25;
	if (typeof r === 'number') return r;
	const m = String(r).match(/(\d+)/);
	return m ? parseInt(m[1], 10) : 25;
}

export async function searchBloodAvailability(params) {
	try {
		// Try blood-banks list first (works without auth) with coordinates
		const lat = params?.latitude;
		const lng = params?.longitude;
		if (lat != null && lng != null) {
			const data = await fetchJson('/api/blood-banks/nearby', {
				latitude: lat,
				longitude: lng,
				bloodGroup: params?.bloodGroup,
				radiusKm: normalizeRadius(params?.radius),
			}, null);
			if (Array.isArray(data?.data) && data.data.length > 0) {
				return {
					results: data.data.map((b) => ({
						id: b._id || b.id,
						name: b.name,
						address: b.address || b.city || '',
						distance: b.distance != null ? `${typeof b.distance === 'number' ? b.distance.toFixed(1) : b.distance} km` : '—',
						distanceLabel: b.distance != null ? `${typeof b.distance === 'number' ? b.distance.toFixed(1) : b.distance} km` : undefined,
						phone: b.phone || '',
						status: b.isActive ? 'Open' : 'Closed',
						updated: 'Recently',
						isDemo: false,
						source: 'live',
						availability: (b.inventory || []).reduce((acc, inv) => {
							acc[inv.bloodGroup] = { label: inv.unitsAvailable > 0 ? (inv.unitsAvailable < 3 ? 'Low Stock' : 'Available') : 'Not Available', units: inv.unitsAvailable };
							return acc;
						}, {}) || {},
					})),
				};
			}
		}
		// Fallback to /api/blood-banks list
		const list = await fetchJson('/api/blood-banks', {}, null);
		if (Array.isArray(list?.data) && list.data.length > 0) {
			return {
				results: list.data.slice(0, 20).map((b) => ({
					id: b._id || b.id,
					name: b.name,
					address: b.address || b.city || '',
					distance: '—',
					distanceLabel: undefined,
					phone: b.phone || '',
					status: b.isActive ? 'Open' : 'Closed',
					updated: 'Recently',
					isDemo: false,
					source: 'live',
					availability: (b.inventory || []).reduce((acc, inv) => {
						acc[inv.bloodGroup] = { label: inv.unitsAvailable > 0 ? (inv.unitsAvailable < 3 ? 'Low Stock' : 'Available') : 'Not Available', units: inv.unitsAvailable };
						return acc;
					}, {}) || {},
				})),
			};
		}
		return null;
	} catch (_) {
		return null;
	}
}

export async function fetchNearbyBloodBanks(params) {
	try {
		const lat = params?.latitude;
		const lng = params?.longitude;
		const radiusKm = normalizeRadius(params?.radius) || 1000;
		if (lat != null && lng != null) {
			const data = await fetchJson('/api/blood-banks/nearby', {
				latitude: lat,
				longitude: lng,
				bloodGroup: params?.bloodGroup,
				radiusKm,
			}, []);
			if (Array.isArray(data?.data) && data.data.length > 0) return data.data.map((b) => ({ ...b, source: 'live', isDemo: false }));
			if (Array.isArray(data) && data.length > 0) return data.map((b) => ({ ...b, source: 'live', isDemo: false }));
		}
		const list = await fetchJson('/api/blood-banks', {}, []);
		if (Array.isArray(list?.data)) return list.data.map((b) => ({ ...b, source: 'live', isDemo: false }));
		if (Array.isArray(list)) return list.map((b) => ({ ...b, source: 'live', isDemo: false }));
		return [];
	} catch (_) {
		return [];
	}
}

export async function fetchNearbyDonors(params) {
	try {
		const data = await fetchJson('/api/donors/nearby', {
			latitude: params?.latitude,
			longitude: params?.longitude,
			bloodGroup: params?.bloodGroup,
			radiusKm: normalizeRadius(params?.radius),
		}, []);
		if (Array.isArray(data?.data)) return data.data;
		if (Array.isArray(data)) return data;
		return [];
	} catch (_) {
		return [];
	}
}

export async function fetchBloodInventoryAvailability(params) {
	return [];
}
