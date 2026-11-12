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

export function isBloodRequestApiConfigured() {
	return Boolean(normalizeBaseUrl(API_BASE_URL));
}

export async function createBloodRequest(payload) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) {
		// No backend configured — return a clean local response so the UI flow still works.
		const id = `LR-${Date.now().toString(36).toUpperCase()}`;
		return {
			success: true,
			message: 'Request saved locally (no API configured)',
			data: {
				request: {
					_id: id,
					...payload,
					status: 'PENDING',
					createdAt: new Date().toISOString(),
				},
			},
		};
	}

	const response = await fetch(`${baseUrl}/api/blood-requests`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		throw buildError(`Blood request submission failed (${response.status})`, 'REQUEST_FAILED', response.status);
	}

	return response.json();
}

export async function createEmergencyRequest(payload) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) {
		const id = `EM-${Date.now().toString(36).toUpperCase()}`;
		return {
			success: true,
			message: 'Emergency request saved locally (no API configured)',
			data: {
				request: {
					_id: id,
					...payload,
					status: 'SEARCHING',
					urgency: 'CRITICAL',
					priority: 'EMERGENCY',
					createdAt: new Date().toISOString(),
				},
			},
		};
	}

	let token = null;
	try { token = localStorage.getItem('lifelink_token'); } catch (_) {}
	const headers = { 'Content-Type': 'application/json' };
	if (token) headers['Authorization'] = `Bearer ${token}`;

	const body = {
		patientName: payload.patient?.name || payload.patientName,
		bloodGroup: payload.bloodGroup,
		unitsRequired: Number(payload.unitsRequired) || 1,
		hospitalName: payload.hospital?.name || payload.hospitalName,
		hospitalAddress: payload.hospital?.address || payload.hospitalAddress,
		latitude: payload.location?.latitude ?? payload.latitude,
		longitude: payload.location?.longitude ?? payload.longitude,
		city: payload.location?.city || payload.city,
		urgency: 'CRITICAL',
		requiredBy: payload.requiredDate && payload.requiredTime ? `${payload.requiredDate}T${payload.requiredTime}:00` : (payload.requiredBy || undefined),
		contactPhone: payload.contact?.phone || payload.contactPhone,
		message: payload.additionalInformation || payload.message || payload.reason || '',
	};

	const response = await fetch(`${baseUrl}/api/requests`, {
		method: 'POST',
		headers: getAuthHeaders(),
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		let msg = `Emergency request submission failed (${response.status})`;
		try {
			const json = await response.json();
			if (json?.message) msg = json.message;
		} catch (_) {}
		throw buildError(msg, 'REQUEST_FAILED', response.status);
	}

	const result = await response.json();
	// Normalize response
	if (result?.data?.request) {
		return { success: true, data: result.data };
	} else if (result?.data) {
		return { success: true, data: { request: result.data } };
	}
	return { success: true, data: result };
}

async function fetchRequestEndpoint(path, fallback) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) return fallback;
	const response = await fetch(`${baseUrl}${path}`, {
		headers: { 'Content-Type': 'application/json' },
	});
	if (response.status === 404) {
		const err = new Error('Request not found');
		err.code = 'NOT_FOUND';
		err.status = 404;
		throw err;
	}
	if (!response.ok) {
		const err = new Error(`Request failed (${response.status})`);
		err.code = 'REQUEST_FAILED';
		err.status = response.status;
		throw err;
	}
	return response.json();
}

export async function fetchRequestById(id) {
	return fetchRequestEndpoint(`/api/blood-requests/${encodeURIComponent(id)}`, null);
}

export async function fetchRequestStatus(id) {
	return fetchRequestEndpoint(`/api/blood-requests/${encodeURIComponent(id)}/status`, null);
}

export async function fetchRequestMatches(id) {
	return fetchRequestEndpoint(`/api/blood-requests/${encodeURIComponent(id)}/matches`, []);
}

export async function fetchRequestResponses(id) {
	return fetchRequestEndpoint(`/api/blood-requests/${encodeURIComponent(id)}/responses`, []);
}

export async function fetchRequestActivity(id) {
	return fetchRequestEndpoint(`/api/blood-requests/${encodeURIComponent(id)}/activity`, []);
}

export async function cancelRequest(id) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) return { success: true, message: 'Request cancelled locally' };
	const response = await fetch(`${baseUrl}/api/blood-requests/${encodeURIComponent(id)}/cancel`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
	});
	if (!response.ok) {
		const err = new Error(`Cancel failed (${response.status})`);
		err.code = 'REQUEST_FAILED';
		err.status = response.status;
		throw err;
	}
	return response.json();
}
