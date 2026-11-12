// Real-time notification service abstraction.
// Connects to a Socket.IO endpoint if available; otherwise remains dormant.

let socket = null;
const listeners = new Set();

function getSocketUrl() {
	try {
		const base = import.meta.env.VITE_API_BASE_URL;
		if (!base) return null;
		return base.replace(/\/+$/, '');
	} catch (_) {
		return null;
	}
}

export function connectNotificationsSocket(token) {
	const url = getSocketUrl();
	if (!url || typeof window === 'undefined') return null;
	if (socket && socket.connected) return socket;
	try {
		// dynamic import kept unresolvable at build time
		const dynamicImport = new Function('m', 'return import(m);');
		dynamicImport('socket.io-client').then(({ io }) => {
			try {
				socket = io(url, { auth: token ? { token } : undefined, transports: ['websocket', 'polling'] });
				socket.on('notification:new', (payload) => {
					listeners.forEach((fn) => {
						try { fn(payload); } catch (_) {}
					});
				});
			} catch (_) {
				// ignore
			}
		}).catch(() => { /* ignore */ });
	} catch (_) {
		// ignore
	}
	return null;
}

export function disconnectNotificationsSocket() {
	try { socket?.disconnect(); } catch (_) {}
	socket = null;
}

export function subscribeNotifications(fn) {
	listeners.add(fn);
	return () => listeners.delete(fn);
}
