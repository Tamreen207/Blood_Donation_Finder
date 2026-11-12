const DEFAULT_AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL ?? '';

function getAuthBaseUrl() {
	return DEFAULT_AUTH_BASE_URL.replace(/\/$/, '');
}

async function requestJson(path, options = {}) {
	const baseUrl = getAuthBaseUrl();
	if (!baseUrl) {
		throw new Error('Authentication API is not configured yet.');
	}

	const response = await fetch(`${baseUrl}${path}`, {
		headers: {
			'Content-Type': 'application/json',
			...(options.headers ?? {}),
		},
		...options,
	});

	const responseText = await response.text();
	const payload = responseText ? JSON.parse(responseText) : null;

	if (!response.ok) {
		const message = payload?.message ?? payload?.error ?? 'Authentication request failed.';
		throw new Error(message);
	}

	return payload;
}

export async function loginUser(credentials) {
	return requestJson('/auth/login', {
		method: 'POST',
		body: JSON.stringify(credentials),
	});
}
