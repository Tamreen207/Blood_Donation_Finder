// Lightweight shared store for the notification unread count so any page
// rendered in the dashboard layout can show the same bell badge.

import { useEffect, useState } from 'react';
import { fetchUnreadCount, isNotificationApiConfigured } from './notificationService';

let memoryCount = 0;
const subscribers = new Set();
let loaded = false;

function notify() {
	subscribers.forEach((fn) => {
		try { fn(memoryCount); } catch (_) {}
	});
}

export async function refreshNotificationCount() {
	if (!isNotificationApiConfigured()) {
		memoryCount = 0;
		loaded = true;
		notify();
		return 0;
	}
	try {
		const res = await fetchUnreadCount();
		memoryCount = Number(res?.data?.unread || 0);
		loaded = true;
		notify();
	} catch (_) {
		// leave previous value
	}
	return memoryCount;
}

export function setNotificationCount(value) {
	memoryCount = Math.max(0, Number(value) || 0);
	loaded = true;
	notify();
}

export function useNotificationCount() {
	const [count, setCount] = useState(memoryCount);
	useEffect(() => {
		const fn = (v) => setCount(v);
		subscribers.add(fn);
		setCount(memoryCount);
		if (!loaded) refreshNotificationCount();
		return () => { subscribers.delete(fn); };
	}, []);
	return count;
}
