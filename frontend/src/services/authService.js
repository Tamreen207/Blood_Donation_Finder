const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export function getStoredToken() {
	try { return localStorage.getItem('lifelink_token'); } catch (_) { return null; }
}

export function getStoredUser() {
	try {
		const raw = localStorage.getItem('lifelink_user');
		return raw ? JSON.parse(raw) : null;
	} catch (_) {
		return null;
	}
}

export function storeAuthSession(data) {
	try {
		if (data?.token) localStorage.setItem('lifelink_token', data.token);
		if (data?.user) localStorage.setItem('lifelink_user', JSON.stringify(data.user));
	} catch (_) {}
}

export function clearAuthSession() {
	try {
		localStorage.removeItem('lifelink_token');
		localStorage.removeItem('lifelink_user');
	} catch (_) {}
}

export function authHeaders(extra = {}) {
	const token = getStoredToken();
	return {
		'Content-Type': 'application/json',
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...extra,
	};
}

async function requestJson(path, options = {}) {
	if (!API_BASE_URL) throw new Error('API is not configured (VITE_API_BASE_URL).');
	const response = await fetch(`${API_BASE_URL}${path}`, {
		headers: {
			'Content-Type': 'application/json',
			...(options.headers ?? {}),
		},
		...options,
	});

	let payload = null;
	try {
		const text = await response.text();
		payload = text ? JSON.parse(text) : null;
	} catch (_) {
		payload = null;
	}

	if (!response.ok) {
		const message = payload?.message ?? payload?.error ?? 'Request failed.';
		throw new Error(message);
	}

	return payload;
}

export async function loginUser(credentials) {
	const identifier = (credentials?.identifier || credentials?.email || '').trim();
	const password = credentials?.password || '';
	const payload = await requestJson('/api/auth/login', {
		method: 'POST',
		body: JSON.stringify({ email: identifier, password }),
	});
	const data = payload?.data || payload;
	if (data?.token || data?.user) storeAuthSession(data);
	return data;
}

export async function registerUser(payload) {
	const body = {
		name: payload?.name?.trim(),
		email: payload?.email?.trim(),
		password: payload?.password,
		role: payload?.role || 'seeker',
		phone: payload?.phone?.trim() || '',
		city: payload?.city?.trim() || '',
	};
	if (body.role === 'donor') {
		body.bloodGroup = payload?.bloodGroup;
		body.age = payload?.age ? Number(payload.age) : undefined;
		body.gender = payload?.gender || undefined;
		body.latitude = payload?.latitude;
		body.longitude = payload?.longitude;
		body.location = payload?.location || payload?.city || '';
	}
	if (body.role === 'bloodbank') {
		body.name = payload?.bloodBankName?.trim() || payload?.name?.trim();
		body.registrationNumber = payload?.registrationNumber?.trim() || '';
		body.address = payload?.address?.trim() || '';
		body.latitude = payload?.latitude;
		body.longitude = payload?.longitude;
		body.openingHours = payload?.openingHours || '24/7';
	}
	const res = await requestJson('/api/auth/register', {
		method: 'POST',
		body: JSON.stringify(body),
	});
	const data = res?.data || res;
	if (data?.token || data?.user) storeAuthSession(data);
	return data;
}

export async function fetchMe() {
	const res = await requestJson('/api/auth/me', { headers: authHeaders() });
	const data = res?.data || res;
	if (data?.user) {
		try { localStorage.setItem('lifelink_user', JSON.stringify(data.user)); } catch (_) {}
	}
	return data;
}

export function logoutUser() {
	clearAuthSession();
}
