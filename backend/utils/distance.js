export function haversineKm(a, b) {
	if (!a || !b) return null;
	const toRad = (d) => (d * Math.PI) / 180;
	const R = 6371;
	const dLat = toRad((b.lat ?? b.latitude) - (a.lat ?? a.latitude));
	const dLon = toRad((b.lng ?? b.longitude) - (a.lng ?? a.longitude));
	const lat1 = toRad(a.lat ?? a.latitude);
	const lat2 = toRad(b.lat ?? b.latitude);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
}

export function withinRadius(point, center, radiusKm) {
	const d = haversineKm(point, center);
	if (d == null) return false;
	return d <= radiusKm;
}
