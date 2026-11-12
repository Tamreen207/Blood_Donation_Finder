export function getDashboardRoute(user) {
	const role = user?.role;
	if (role === 'bloodbank' || role === 'blood_bank') return '/blood-bank/dashboard';
	if (role === 'admin') return '/dashboard';
	return '/dashboard';
}

export function getHomeRoute(user) {
	return getDashboardRoute(user);
}
