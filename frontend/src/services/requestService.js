const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function getAuthHeaders(extra = {}) {
	const headers = { 'Content-Type': 'application/json', ...extra };
	try {
		const token = localStorage.getItem('lifelink_token');
		if (token) headers.Authorization = `Bearer ${token}`;
	} catch (_) {}
	return headers;
}

function buildError(message, code, status) {
	const err = new Error(message);
	if (code) err.code = code;
	if (status) err.status = status;
	return err;
}

export function isBloodRequestApiConfigured() {
	return Boolean(API_BASE_URL);
}

async function request(path, options = {}) {
	if (!API_BASE_URL) throw buildError('API is not configured (VITE_API_BASE_URL).', 'NO_API', 0);
	const res = await fetch(`${API_BASE_URL}${path}`, {
		headers: getAuthHeaders(options.headers),
		...options,
	});
	let payload = null;
	try {
		const text = await res.text();
		payload = text ? JSON.parse(text) : null;
	} catch (_) {
		payload = null;
	}
	if (!res.ok) {
		throw buildError(payload?.message || `Request failed (${res.status})`, payload?.code || 'REQUEST_FAILED', res.status);
	}
	return payload;
}

function normalizeUrgency(u) {
	const v = String(u || 'MEDIUM').toUpperCase();
	if (v === 'EMERGENCY' || v === 'CRITICAL') return 'CRITICAL';
	if (v === 'URGENT' || v === 'HIGH') return 'HIGH';
	if (v === 'NORMAL' || v === 'LOW') return 'LOW';
	return 'MEDIUM';
}

function buildRequestBody(payload) {
	return {
		patientName: payload.patient?.name || payload.patientName || 'Patient',
		bloodGroup: payload.bloodGroup,
		unitsRequired: Number(payload.unitsRequired) || 1,
		hospitalName: payload.hospital?.name || payload.hospitalName || 'Hospital',
		hospitalAddress: payload.hospital?.location || payload.hospital?.address || payload.hospitalAddress || '',
		latitude: payload.location?.latitude ?? payload.latitude ?? undefined,
		longitude: payload.location?.longitude ?? payload.longitude ?? undefined,
		city: payload.location?.city || payload.city || '',
		urgency: normalizeUrgency(payload.urgency || payload.priority),
		requiredBy: payload.requiredDate && payload.requiredTime ? `${payload.requiredDate}T${payload.requiredTime}:00` : (payload.requiredBy || undefined),
		contactPhone: payload.contact?.phone || payload.contactPhone || '',
		message: payload.additionalInformation || payload.message || payload.reason || '',
	};
}

function toFrontendRequest(raw) {
	if (!raw) return null;
	const id = raw._id || raw.id;
	const createdAt = raw.createdAt;
	const urgency = raw.urgency === 'CRITICAL' ? 'EMERGENCY' : raw.urgency;
	const status = raw.status || 'PENDING';
	return {
		...raw,
		id,
		_id: id,
		patientName: raw.patientName || raw.patient?.name || '',
		bloodGroup: raw.bloodGroup,
		unitsRequired: raw.unitsRequired ?? raw.units ?? 1,
		hospitalName: raw.hospitalName || raw.hospital?.name || '',
		hospitalAddress: raw.hospitalAddress || raw.hospital?.location || raw.hospital?.address || '',
		contactPhone: raw.contactPhone || raw.contact?.phone || '',
		urgency,
		priority: urgency,
		status,
		createdAt,
		submittedAt: createdAt,
		location: raw.location || { city: raw.city, area: raw.area, latitude: raw.latitude, longitude: raw.longitude },
		hospital: raw.hospital || { name: raw.hospitalName, address: raw.hospitalAddress, location: raw.hospitalAddress },
		contact: raw.contact || { phone: raw.contactPhone },
		patient: raw.patient || { name: raw.patientName },
	};
}

export async function createBloodRequest(payload) {
	const body = buildRequestBody(payload);
	const res = await request('/api/requests', { method: 'POST', body: JSON.stringify(body) });
	const req = toFrontendRequest(res?.data?.request || res?.data || res);
	return { success: true, data: { request: req, matches: res?.data?.matches, notifiedCount: res?.data?.notifiedCount } };
}

export async function createEmergencyRequest(payload) {
	const res = await createBloodRequest({ ...payload, urgency: 'CRITICAL' });
	if (res?.data?.request) res.data.request.status = res.data.request.status || 'SEARCHING';
	return res;
}

export async function listMyRequests() {
	const res = await request('/api/requests');
	const items = (res?.data || res || []).map(toFrontendRequest).filter(Boolean);
	return { success: true, data: items };
}

export async function fetchRequestById(id) {
	const res = await request(`/api/requests/${encodeURIComponent(id)}`);
	const req = toFrontendRequest(res?.data || res);
	return { success: true, data: req };
}

export async function fetchRequestStatus(id) {
	const r = await fetchRequestById(id);
	return { success: true, data: { status: r?.data?.status || 'PENDING' } };
}

export async function fetchRequestMatches(id) {
	try {
		const res = await request(`/api/matching/requests/${encodeURIComponent(id)}`);
		const data = res?.data || res || {};
		const donors = Array.isArray(data.donors) ? data.donors : [];
		const banks = Array.isArray(data.banks) ? data.banks : [];
		return { success: true, data: { donors, banks } };
	} catch (_) {
		return { success: true, data: { donors: [], banks: [] } };
	}
}

export async function fetchRequestResponses(_id) {
	return { success: true, data: [] };
}

export async function fetchRequestActivity(id) {
	const r = await fetchRequestById(id);
	const req = r?.data;
	if (!req) return { success: true, data: [] };
	const events = [
		{ type: 'REQUEST_CREATED', label: 'Request created', at: req.createdAt },
	];
	if (req.status && req.status !== 'PENDING') {
		events.push({ type: `STATUS_${req.status}`, label: `Status updated to ${req.status}`, at: req.updatedAt || req.createdAt });
	}
	return { success: true, data: events };
}

export async function cancelRequest(id) {
	const res = await request(`/api/requests/${encodeURIComponent(id)}`, { method: 'DELETE' });
	const req = toFrontendRequest(res?.data || res);
	return { success: true, data: req };
}

export async function respondToRequest(id, action, payload = {}) {
	const res = await request(`/api/requests/${encodeURIComponent(id)}/respond`, {
		method: 'POST',
		body: JSON.stringify({ action, ...payload }),
	});
	return { success: true, data: toFrontendRequest(res?.data || res) };
}
