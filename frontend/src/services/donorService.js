const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function authHeader() {
	try {
		const token = localStorage.getItem('lifelink_token');
		return token ? { Authorization: `Bearer ${token}` } : {};
	} catch (_) { return {}; }
}

async function fetchJson(path, query = {}, { auth = false, fallback = null } = {}) {
	if (!API_BASE_URL) return fallback;
	const params = new URLSearchParams();
	Object.entries(query).forEach(([k, v]) => {
		if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
	});
	const qs = params.toString();
	const res = await fetch(`${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`, {
		headers: { 'Content-Type': 'application/json', ...(auth ? authHeader() : {}) },
	});
	if (!res.ok) {
		if (fallback !== null) return fallback;
		const err = new Error(`Request failed (${res.status})`);
		err.status = res.status;
		throw err;
	}
	return res.json();
}

function normalizeDonor(d) {
	if (!d) return null;
	const u = d.user || {};
	return {
		...d,
		id: d.id || d._id,
		_id: d._id || d.id,
		userId: d.userId,
		displayName: d.displayName || u.name?.split(' ')[0] || u.name || 'Donor',
		name: u.name || d.displayName || 'Donor',
		bloodGroup: d.bloodGroup,
		verified: Boolean(d.verified ?? d.isVerified),
		isAvailable: Boolean(d.available ?? d.isAvailable),
		availability: (d.available ?? d.isAvailable) ? 'Available Now' : 'Unavailable',
		distanceKm: d.distanceKm ?? d.distance ?? null,
		distance: d.distanceKm ?? d.distance ?? null,
		city: d.city || '',
		area: d.area || d.location || d.city || '',
		location: d.location || d.area || d.city || '',
		phone: d.phone || u.phone || '',
		lastDonation: d.lastDonation,
		lastDonationDate: d.lastDonation,
		contactAllowed: true,
	};
}

export function isDonorApiConfigured() {
	return Boolean(API_BASE_URL);
}

export async function searchDonors(params = {}) {
	const query = {
		bloodGroup: params.bloodGroup,
		latitude: params.latitude,
		longitude: params.longitude,
		radiusKm: params.radiusKm || (params.radius ? parseInt(String(params.radius), 10) : undefined),
		urgency: params.urgency,
	};
	// try auth endpoint first, fall back to public
	let res = await fetchJson('/api/donors', query, { auth: true, fallback: null });
	if (!res) res = await fetchJson('/api/public/donors', query, { auth: false, fallback: { success: true, data: [] } });
	const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
	return { success: true, results: list.map(normalizeDonor).filter(Boolean) };
}

export async function fetchNearbyDonors(params = {}) {
	const res = await searchDonors(params);
	return { success: true, results: res.results || [] };
}

export async function fetchDonorDetails(id) {
	if (!API_BASE_URL) return null;
	try {
		const res = await fetchJson(`/api/donors/${encodeURIComponent(id)}`, {}, { auth: true, fallback: null });
		const d = res?.data || res;
		return d ? { success: true, data: normalizeDonor(d) } : null;
	} catch (_) { return null; }
}

export async function fetchDonorActivity() { return { success: true, data: [] }; }
export async function fetchDonorAvailability() { return { success: true, data: null }; }
