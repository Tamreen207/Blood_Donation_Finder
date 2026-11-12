const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function getAuthHeaders() {
	const headers = { 'Content-Type': 'application/json' };
	try {
		const token = localStorage.getItem('lifelink_token');
		if (token) headers.Authorization = `Bearer ${token}`;
	} catch (_) {}
	return headers;
}

async function fetchJson(path, query = {}, { auth = false } = {}) {
	if (!API_BASE_URL) return null;
	const searchParams = new URLSearchParams();
	Object.entries(query).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') searchParams.set(key, String(value));
	});
	const queryString = searchParams.toString();
	const response = await fetch(`${API_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`, {
		headers: auth ? getAuthHeaders() : { 'Content-Type': 'application/json' },
		cache: 'no-store',
	});
	if (!response.ok) throw new Error(`Request failed for ${path}`);
	return response.json();
}

function normalizeRadius(r) {
	if (!r) return 25;
	if (typeof r === 'number') return r;
	const m = String(r).match(/(\d+)/);
	return m ? parseInt(m[1], 10) : 25;
}

function inventoryToAvailability(inventory = []) {
	const map = {};
	(inventory || []).forEach((inv) => {
		const units = Number(inv.unitsAvailable ?? inv.units ?? 0);
		map[inv.bloodGroup] = {
			label: units > 0 ? (units < 3 ? 'Low Stock' : 'Available') : 'Not Available',
			units,
		};
	});
	return map;
}

function mapBank(b) {
	const distanceNum = b.distance != null ? Number(b.distance) : null;
	return {
		id: b._id || b.id,
		name: b.name,
		address: b.address || '',
		city: b.city || '',
		distance: distanceNum != null ? `${distanceNum.toFixed(1)} km` : '—',
		distanceLabel: distanceNum != null ? `${distanceNum.toFixed(1)} km` : undefined,
		distanceKm: distanceNum,
		phone: b.phone || b.emergencyPhone || '',
		status: b.isActive === false ? 'Closed' : 'Open',
		verified: Boolean(b.isVerified || b.verification?.status === 'VERIFIED'),
		updated: b.updatedAt ? new Date(b.updatedAt).toLocaleString() : 'Recently',
		lastUpdated: b.updatedAt || null,
		isDemo: false,
		source: 'live',
		availability: inventoryToAvailability(b.inventory),
		inventory: b.inventory || [],
	};
}

export async function searchBloodAvailability(params = {}) {
	const lat = params?.latitude;
	const lng = params?.longitude;
	const radiusKm = normalizeRadius(params?.radius);
	let banks = [];
	if (lat != null && lng != null) {
		const data = await fetchJson('/api/blood-banks/nearby', { latitude: lat, longitude: lng, bloodGroup: params?.bloodGroup, radiusKm }, { auth: false }).catch(() => null);
		if (Array.isArray(data?.data)) banks = data.data;
		else if (Array.isArray(data)) banks = data;
	}
	if (!banks.length) {
		const list = await fetchJson('/api/blood-banks', {}, { auth: false }).catch(() => null);
		if (Array.isArray(list?.data)) banks = list.data;
		else if (Array.isArray(list)) banks = list;
	}
	return { results: (banks || []).map(mapBank) };
}

export async function fetchNearbyBloodBanks(params = {}) {
	const res = await searchBloodAvailability(params);
	return res.results || [];
}

export async function fetchNearbyDonors(params = {}) {
	if (!API_BASE_URL) return [];
	const radiusKm = normalizeRadius(params?.radius);
	try {
		const data = await fetchJson('/api/public/donors', {
			bloodGroup: params?.bloodGroup,
			latitude: params?.latitude,
			longitude: params?.longitude,
			radiusKm,
		}, { auth: false });
		const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
		return list.map((d) => ({
			...d,
			id: d.id || d._id,
			name: d.displayName || d.name || 'Donor',
			displayName: d.displayName || d.name || 'Donor',
			bloodGroup: d.bloodGroup,
			distance: d.distanceKm ?? d.distance,
			distanceKm: d.distanceKm ?? d.distance,
			verified: Boolean(d.verified ?? d.isVerified),
			availability: (d.available ?? d.isAvailable) ? 'Available' : 'Unavailable',
			isDemo: false,
		}));
	} catch (_) {
		return [];
	}
}

export async function fetchBloodInventoryAvailability() {
	return [];
}
