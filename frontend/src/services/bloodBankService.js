const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function normalizeBaseUrl(baseUrl) {
	return baseUrl.replace(/\/$/, '');
}

function buildRequestError(message, code, status) {
	const error = new Error(message);
	if (code) {
		error.code = code;
	}
	if (status) {
		error.status = status;
	}
	return error;
}

async function requestJson(path, options = {}, fallbackData = null) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) {
		return fallbackData;
	}

	const response = await fetch(`${baseUrl}${path}`, {
		headers: {
			'Content-Type': 'application/json',
		},
		...options,
	});

	if (response.status === 404) {
		throw buildRequestError(`Resource not found for ${path}`, 'NOT_FOUND', 404);
	}

	if (!response.ok) {
		throw buildRequestError(`Request failed for ${path}`, 'REQUEST_FAILED', response.status);
	}

	if (response.status === 204) {
		return null;
	}

	return response.json();
}

export function isBloodBankApiConfigured() {
	return Boolean(normalizeBaseUrl(API_BASE_URL));
}

export async function fetchBloodBankDetails(id) {
	return requestJson(`/api/blood-banks/${encodeURIComponent(id)}`);
}

export async function fetchBloodBankInventory(id) {
	return requestJson(`/api/blood-banks/${encodeURIComponent(id)}/inventory`, {}, null);
}

export async function fetchBloodBankServices(id) {
	return requestJson(`/api/blood-banks/${encodeURIComponent(id)}/services`, {}, null);
}

export async function fetchBloodBankReviews(id) {
	return requestJson(`/api/blood-banks/${encodeURIComponent(id)}/reviews`, {}, null);
}

export async function fetchBloodBankLocation(id) {
	return requestJson(`/api/blood-banks/${encodeURIComponent(id)}/location`, {}, null);
}

export async function submitBloodRequest(payload) {
	const baseUrl = normalizeBaseUrl(API_BASE_URL);
	if (!baseUrl) {
		throw buildRequestError('Blood request API is not configured yet.', 'NOT_CONFIGURED');
	}

	const response = await fetch(`${baseUrl}/api/blood-requests`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	});

	if (response.status === 404) {
		throw buildRequestError('Blood request API endpoint was not found.', 'NOT_FOUND', 404);
	}

	if (!response.ok) {
		throw buildRequestError('Unable to submit blood request.', 'REQUEST_FAILED', response.status);
	}

	return response.status === 204 ? null : response.json();
}