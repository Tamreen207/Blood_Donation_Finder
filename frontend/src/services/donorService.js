const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

function normalizeBaseUrl(baseUrl) {
	return baseUrl.replace(/\/$/, '');
}

function createRequestError(message, code, status) {
	const error = new Error(message);
	if (code) {
		error.code = code;
	}
	if (status) {
		error.status = status;
	}
	return error;
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

	const response = await fetch(`${baseUrl}${path}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`, {
		headers: {
			'Content-Type': 'application/json',
		},
	});

	if (response.status === 404) {
		throw createRequestError(`Resource not found for ${path}`, 'NOT_FOUND', 404);
	}

	if (!response.ok) {
		throw createRequestError(`Request failed for ${path}`, 'REQUEST_FAILED', response.status);
	}

	return response.json();
}

export function isDonorApiConfigured() {
	return Boolean(normalizeBaseUrl(API_BASE_URL));
}

export async function searchDonors(params) {
	return fetchJson('/api/donors/search', params, null);
}

export async function fetchNearbyDonors(params) {
	return fetchJson('/api/donors/nearby', params, []);
}

export async function fetchDonorDetails(id) {
	return fetchJson(`/api/donors/${encodeURIComponent(id)}`, {}, null);
}

export async function fetchDonorActivity(id) {
	return fetchJson(`/api/donors/${encodeURIComponent(id)}/activity`, {}, null);
}

export async function fetchDonorAvailability(id) {
	return fetchJson(`/api/donors/${encodeURIComponent(id)}/availability`, {}, null);
}
