const listeners = new Set();

export function emitToast(message, type = 'info', duration = 3000) {
	const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
	const toast = { id, message, type, duration };
	listeners.forEach((fn) => {
		try { fn(toast); } catch (_) {}
	});
	return id;
}

export function subscribeToasts(fn) {
	listeners.add(fn);
	return () => listeners.delete(fn);
}
