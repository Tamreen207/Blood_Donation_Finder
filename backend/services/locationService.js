export const DEFAULT_CENTER = { latitude: 17.385, longitude: 78.4867, city: 'Hyderabad' };

export function normalizeLocation(payload = {}) {
	const latitude = numOrNull(payload.latitude ?? payload.lat);
	const longitude = numOrNull(payload.longitude ?? payload.lng);
	const city = (payload.city || payload.location || '').toString().trim();
	return { latitude, longitude, city };
}

export function numOrNull(v) {
	if (v == null || v === '') return null;
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
}
