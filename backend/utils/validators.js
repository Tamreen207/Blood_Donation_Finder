export const ROLES = ['seeker', 'donor', 'bloodbank', 'admin'];
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function isEmail(s) {
	return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function validateRegister({ name, email, password, role, phone }) {
	const errors = [];
	if (!name || String(name).trim().length < 2) errors.push('name is required');
	if (!isEmail(email)) errors.push('valid email is required');
	if (!password || String(password).length < 6) errors.push('password must be at least 6 characters');
	if (!ROLES.includes(role)) errors.push('invalid role');
	if (phone && !/^[+\d][\d\s-]{5,20}$/.test(String(phone).trim())) errors.push('phone format invalid');
	return errors;
}

export function validateLogin({ email, password }) {
	const errors = [];
	if (!isEmail(email)) errors.push('valid email is required');
	if (!password) errors.push('password is required');
	return errors;
}
