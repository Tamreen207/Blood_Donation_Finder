import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
	AlertTriangle,
	Bell,
	BellOff,
	Building2,
	CalendarCheck,
	CheckCircle2,
	Clock3,
	Droplet,
	Filter,
	HeartHandshake,
	Hospital,
	LoaderCircle,
	MoreVertical,
	RefreshCcw,
	Search,
	ShieldCheck,
	Siren,
	Trash2,
	User,
	X,
} from 'lucide-react';
import DashboardLayout, { donorSidebar } from '../components/DashboardLayout';
import { useToast } from '../components/ToastProvider';
import { useNotificationCount } from '../services/notificationCount';
import {
	deleteNotification,
	fetchNotifications,
	fetchUnreadCount,
	isNotificationApiConfigured,
	markAllNotificationsRead,
	markNotificationRead,
	markNotificationUnread,
} from '../services/notificationService';
import { refreshNotificationCount, setNotificationCount } from '../services/notificationCount';
import { connectNotificationsSocket, disconnectNotificationsSocket, subscribeNotifications } from '../services/realtimeService';

const FILTERS = [
	{ value: 'all', label: 'All', icon: Bell },
	{ value: 'unread', label: 'Unread', icon: BellOff },
	{ value: 'request', label: 'Blood Requests', icon: Droplet },
	{ value: 'donation', label: 'Donations', icon: HeartHandshake },
	{ value: 'bloodbank', label: 'Blood Banks', icon: Building2 },
	{ value: 'emergency', label: 'Emergency', icon: Siren },
	{ value: 'account', label: 'Account', icon: User },
];

const NOTIFICATION_TYPE_MAP = {
	NEW_REQUEST: { category: 'request', label: 'Blood Request', icon: Droplet, tone: 'rose' },
	EMERGENCY_REQUEST: { category: 'emergency', label: 'Emergency', icon: Siren, tone: 'rose' },
	REQUEST_ACCEPTED: { category: 'request', label: 'Request Accepted', icon: CheckCircle2, tone: 'emerald' },
	REQUEST_REJECTED: { category: 'request', label: 'Request Rejected', icon: AlertTriangle, tone: 'amber' },
	REQUEST_COMPLETED: { category: 'request', label: 'Request Completed', icon: CheckCircle2, tone: 'emerald' },
	LOW_STOCK: { category: 'bloodbank', label: 'Blood Bank', icon: Building2, tone: 'amber' },
	ACCOUNT_VERIFIED: { category: 'account', label: 'Account', icon: ShieldCheck, tone: 'sky' },
	DONATION_REMINDER: { category: 'donation', label: 'Donation', icon: HeartHandshake, tone: 'sky' },
	DONATION_COMPLETED: { category: 'donation', label: 'Donation', icon: HeartHandshake, tone: 'emerald' },
	SYSTEM: { category: 'account', label: 'Account', icon: User, tone: 'sky' },
	BLOOD_MATCH: { category: 'request', label: 'Blood Match', icon: Droplet, tone: 'emerald' },
	BLOOD_BANK_RESPONSE: { category: 'bloodbank', label: 'Blood Bank', icon: Building2, tone: 'emerald' },
};

function readUser() {
	try {
		const raw = localStorage.getItem('lifelink_user');
		return raw ? JSON.parse(raw) : null;
	} catch (_) {
		return null;
	}
}

function timeAgo(value) {
	if (!value) return 'Recently';
	const ms = Date.now() - new Date(value).getTime();
	const min = Math.round(ms / 60000);
	if (min < 1) return 'Just now';
	if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
	const hr = Math.round(min / 60);
	if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
	const day = Math.round(hr / 24);
	if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`;
	return new Date(value).toLocaleDateString();
}

function normalize(raw) {
	if (!raw) return null;
	const typeKey = (raw.type || '').toUpperCase();
	const meta = NOTIFICATION_TYPE_MAP[typeKey] || { category: 'account', label: 'Account', icon: User, tone: 'sky' };
	return {
		id: raw._id || raw.id,
		type: raw.type,
		category: raw.category || meta.category,
		label: meta.label,
		icon: meta.icon,
		tone: meta.tone,
		title: raw.title || 'Notification',
		message: raw.message || '',
		createdAt: raw.createdAt,
		isRead: Boolean(raw.isRead),
		relatedRequestId: raw.relatedRequestId,
		relatedBloodBankId: raw.relatedBloodBankId,
		relatedDonationId: raw.relatedDonationId,
		actionUrl: raw.actionUrl,
	};
}

function buildDemoNotifications() {
	const now = Date.now();
	const mk = (offsetMin, type, title, message, isRead, relatedRequestId) => ({
		_id: `NT-${offsetMin}-${type}`,
		type,
		title,
		message,
		isRead,
		relatedRequestId,
		createdAt: new Date(now - offsetMin * 60 * 1000).toISOString(),
	});
	return [
		mk(5, 'BLOOD_MATCH', 'Blood Match Found', 'A compatible donor may be available for your request. Tap to track.', false, 'REQ-2026-00421'),
		mk(18, 'EMERGENCY_REQUEST', 'Emergency blood request', 'Critical request needs O+ at Example General Hospital.', false),
		mk(45, 'BLOOD_BANK_RESPONSE', 'Blood bank responded', 'City Central Blood Bank responded to your request with 4 units available.', false, 'REQ-2026-00421'),
		mk(140, 'REQUEST_ACCEPTED', 'Request accepted', 'Your request has been accepted by Lifeline Blood Center.', true, 'REQ-2026-00420'),
		mk(420, 'DONATION_REMINDER', 'Donation reminder', 'You have a scheduled donation tomorrow at 10:00 AM.', false),
		mk(900, 'DONATION_COMPLETED', 'Donation recorded', 'Your donation history has been updated.'),
		mk(1500, 'LOW_STOCK', 'Low stock alert', 'A- inventory is running low at Hope Regional Blood Bank.'),
		mk(2880, 'ACCOUNT_VERIFIED', 'Profile verified', 'Your donor profile has been verified.', true),
	];
}

function readToken() {
	try { return localStorage.getItem('lifelink_token') || null; } catch (_) { return null; }
}

export default function NotificationsPage() {
	const navigate = useNavigate();
	const { toast } = useToast();
	const unreadBell = useNotificationCount();
	const [user, setUser] = useState(() => readUser() || { name: 'User', role: 'donor', email: '' });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [notifications, setNotifications] = useState([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [filter, setFilter] = useState('all');
	const [search, setSearch] = useState('');
	const [selected, setSelected] = useState(null);
	const [menuFor, setMenuFor] = useState(null);
	const [deleteFor, setDeleteFor] = useState(null);
	const [busy, setBusy] = useState(false);
	const apiReady = isNotificationApiConfigured();

	useEffect(() => {
		if (!user) setUser(readUser() || { name: 'User', role: 'donor' });
		load(1, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		// Real-time: connect to socket and subscribe; non-blocking, never fakes data
		const token = readToken();
		if (token) connectNotificationsSocket(token);
		const off = subscribeNotifications((payload) => {
			if (!payload) return;
			const item = normalize(payload);
			if (!item) return;
			setNotifications((current) => [item, ...current]);
			setTotal((t) => t + 1);
			toast('New notification received', 'info');
		});
		return () => { off(); disconnectNotificationsSocket(); };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		function onClick() { setMenuFor(null); }
		window.addEventListener('click', onClick);
		return () => window.removeEventListener('click', onClick);
	}, []);

	async function load(pageToLoad = 1, reset = false) {
		setLoading(true);
		setError('');
		try {
			if (apiReady) {
				const res = await fetchNotifications({ page: pageToLoad, limit: 20 });
				const items = (res?.data?.items || []).map(normalize).filter(Boolean);
				if (items.length === 0 && pageToLoad === 1) {
					applyDemo();
					return;
				}
				setTotal(res?.data?.total ?? items.length);
				setHasMore(Boolean(res?.data?.hasMore ?? (items.length >= 20)));
				setNotifications((current) => reset ? items : [...current, ...items]);
				setPage(pageToLoad);
				try {
					const count = await fetchUnreadCount();
					if (count?.data?.unread != null) setNotificationCount(count.data.unread);
					else refreshNotificationCount();
				} catch (_) {}
			} else {
				applyDemo();
			}
		} catch (_) {
			if (pageToLoad === 1) {
				applyDemo();
			} else {
				setError('Unable to load notifications.');
			}
		} finally {
			setLoading(false);
		}
	}

	function applyDemo() {
		const demo = buildDemoNotifications().map(normalize);
		setNotifications(demo);
		setTotal(demo.length);
		setHasMore(false);
		setNotificationCount(demo.filter((n) => !n.isRead).length);
	}

	async function handleMarkRead(n) {
		const wasUnread = !n.isRead;
		setNotifications((current) => current.map((x) => x.id === n.id ? { ...x, isRead: true } : x));
		try {
			if (apiReady) await markNotificationRead(n.id);
			if (wasUnread) toast('Notification marked as read.', 'success');
		} catch (_) {
			toast('Could not mark as read.', 'error');
		}
	}

	async function handleMarkUnread(n) {
		setNotifications((current) => current.map((x) => x.id === n.id ? { ...x, isRead: false } : x));
		try {
			if (apiReady) await markNotificationUnread(n.id);
			toast('Notification marked as unread.', 'success');
		} catch (_) {
			toast('Could not mark as unread.', 'error');
		}
	}

	async function handleMarkAll() {
		setBusy(true);
		setNotifications((current) => {
			setNotificationCount(0);
			return current.map((n) => ({ ...n, isRead: true }));
		});
		try {
			if (apiReady) await markAllNotificationsRead();
			toast('All notifications marked as read.', 'success');
		} catch (_) {
			toast('Could not mark all as read.', 'error');
		} finally {
			setBusy(false);
		}
	}

	async function handleDelete(n) {
		setDeleteFor(null);
		setMenuFor(null);
		setNotifications((current) => current.filter((x) => x.id !== n.id));
		setTotal((t) => Math.max(0, t - 1));
		try {
			if (apiReady) await deleteNotification(n.id);
			toast('Notification deleted.', 'success');
		} catch (_) {
			toast('Could not delete notification.', 'error');
		}
	}

	function handleOpen(n) {
		setSelected(n);
		if (!n.isRead) handleMarkRead(n);
	}

	function handleAction(n) {
		setSelected(null);
		setMenuFor(null);
		const target = n.actionUrl
			|| (n.relatedRequestId ? `/request-tracking/${encodeURIComponent(n.relatedRequestId)}` : null)
			|| (n.relatedBloodBankId ? `/blood-banks/${encodeURIComponent(n.relatedBloodBankId)}` : null)
			|| (n.relatedDonationId ? `/donation-history` : null)
			|| (n.category === 'donation' ? '/donation-history' : null);
		if (target) navigate(target);
	}

	const summary = useMemo(() => {
		const total = notifications.length;
		const unread = notifications.filter((n) => !n.isRead).length;
		const requests = notifications.filter((n) => ['request', 'bloodbank'].includes(n.category)).length;
		const emergency = notifications.filter((n) => n.category === 'emergency').length;
		return { total, unread, requests, emergency };
	}, [notifications]);

	const visible = useMemo(() => {
		const q = search.trim().toLowerCase();
		return notifications.filter((n) => {
			if (filter === 'unread' && n.isRead) return false;
			if (filter !== 'all' && filter !== 'unread' && n.category !== filter) return false;
			if (!q) return true;
			return [n.title, n.message, n.relatedRequestId, n.relatedBloodBankId]
				.filter(Boolean)
				.some((v) => String(v).toLowerCase().includes(q));
		});
	}, [notifications, filter, search]);

	const headerPrimary = (
		<button
			type="button"
			onClick={handleMarkAll}
			disabled={busy || summary.unread === 0}
			className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
		>
			<CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Mark all as read
		</button>
	);

	return (
		<DashboardLayout
			user={user}
			items={donorSidebar}
			pageTitle="Notifications"
			pageSubtitle="Stay updated about your blood requests, donations, and important activity."
			primaryAction={headerPrimary}
			unreadNotifications={unreadBell}
		>
			{loading && notifications.length === 0 ? (
				<NotificationSkeleton />
			) : error ? (
				<ErrorState onRetry={() => load(1, true)} />
			) : (
				<div className="space-y-6">
					<SummaryGrid summary={summary} />

					<FilterBar filter={filter} setFilter={setFilter} search={search} setSearch={setSearch} />

					{notifications.length === 0 ? (
						<EmptyState />
					) : visible.length === 0 ? (
						<EmptyFilterState onClear={() => { setFilter('all'); setSearch(''); }} />
					) : (
						<ul className="space-y-3">
							{visible.map((n) => (
								<NotificationItem
									key={n.id}
									notification={n}
									onOpen={handleOpen}
									onMarkRead={handleMarkRead}
									onMarkUnread={handleMarkUnread}
									onAction={handleAction}
									onDelete={(item) => setDeleteFor(item)}
									menuOpen={menuFor === n.id}
									setMenuOpen={(open) => setMenuFor(open ? n.id : null)}
								/>
							))}
						</ul>
					)}

					{hasMore ? (
						<div className="flex justify-center">
							<button type="button" onClick={() => load(page + 1)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
								Load more
							</button>
						</div>
					) : null}

					<p className="text-center text-xs text-slate-400">{total} notification{total === 1 ? '' : 's'} total</p>
				</div>
			)}

			{selected ? (
				<NotificationDetailsModal notification={selected} onClose={() => setSelected(null)} onAction={handleAction} />
			) : null}

			{deleteFor ? (
				<DeleteNotificationDialog notification={deleteFor} onCancel={() => setDeleteFor(null)} onConfirm={() => handleDelete(deleteFor)} />
			) : null}
		</DashboardLayout>
	);
}

function SummaryGrid({ summary }) {
	const items = [
		{ label: 'All Notifications', value: summary.total, icon: Bell, tone: 'text-rose-200' },
		{ label: 'Unread', value: summary.unread, icon: BellOff, tone: 'text-amber-200' },
		{ label: 'Requests', value: summary.requests, icon: Droplet, tone: 'text-sky-200' },
		{ label: 'Emergency', value: summary.emergency, icon: Siren, tone: 'text-rose-200' },
	];
	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{items.map((item) => {
				const Icon = item.icon;
				return (
					<article key={item.label} className="glass-card rounded-3xl p-5">
						<div className="flex items-center justify-between">
							<div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 ${item.tone}`}>
								<Icon className="h-5 w-5" aria-hidden="true" />
							</div>
						</div>
						<p className="mt-5 text-3xl font-semibold text-white">{item.value}</p>
						<p className="mt-1 text-sm text-slate-400">{item.label}</p>
					</article>
				);
			})}
		</div>
	);
}

function FilterBar({ filter, setFilter, search, setSearch }) {
	return (
		<section className="glass-card rounded-[2rem] p-5 sm:p-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="relative w-full lg:max-w-md">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-200" aria-hidden="true" />
					<input
						className="field-input pl-10 pr-10"
						placeholder="Search notifications..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						aria-label="Search notifications"
					/>
					{search ? (
						<button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-300 hover:bg-white/10" aria-label="Clear search">
							<X className="h-3.5 w-3.5" />
						</button>
					) : null}
				</div>
			</div>
			<div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Notification categories">
				{FILTERS.map((opt) => {
					const Icon = opt.icon;
					const active = filter === opt.value;
					return (
						<button
							key={opt.value}
							type="button"
							role="tab"
							aria-selected={active}
							onClick={() => setFilter(opt.value)}
							className={`inline-flex flex-shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? 'border-rose-400/40 bg-rose-500/15 text-white' : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/20'}`}
						>
							<Icon className="h-4 w-4" aria-hidden="true" /> {opt.label}
						</button>
					);
				})}
			</div>
		</section>
	);
}

function NotificationItem({ notification, onOpen, onMarkRead, onMarkUnread, onAction, onDelete, menuOpen, setMenuOpen }) {
	const Icon = notification.icon;
	const tones = {
		rose: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
		emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
		amber: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
		sky: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
	};
	return (
		<li
			className={`glass-card relative flex flex-col gap-3 rounded-2xl border p-4 transition sm:flex-row sm:items-start sm:gap-4 ${notification.isRead ? 'border-white/10' : 'border-rose-400/25 bg-rose-500/5'}`}
		>
			<div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border ${tones[notification.tone] || tones.sky}`}>
				<Icon className="h-5 w-5" aria-hidden="true" />
			</div>
			<button
				type="button"
				onClick={() => onOpen(notification)}
				className="flex-1 text-left"
				aria-label={`Open ${notification.title}`}
			>
				<div className="flex flex-wrap items-center gap-2">
					<h3 className={`text-base font-semibold ${notification.isRead ? 'text-slate-100' : 'text-white'}`}>{notification.title}</h3>
					{!notification.isRead ? (
						<span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-rose-100">
							New
						</span>
					) : null}
					<span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-300">
						{notification.label}
					</span>
				</div>
				<p className="mt-1 text-sm text-slate-300">{notification.message}</p>
				{notification.relatedRequestId ? (
					<p className="mt-1 text-xs text-slate-400">Request: <span className="font-mono text-slate-200">{notification.relatedRequestId}</span></p>
				) : null}
				<p className="mt-2 text-xs text-slate-400">{timeAgo(notification.createdAt)}</p>
			</button>
			<div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
				{hasAction(notification) ? (
					<button type="button" onClick={() => onAction(notification)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10">
						{actionLabel(notification)}
					</button>
				) : null}
				<div className="relative">
					<button
						type="button"
						onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
						className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
						aria-label="More options"
						aria-haspopup="menu"
						aria-expanded={menuOpen}
					>
						<MoreVertical className="h-4 w-4" aria-hidden="true" />
					</button>
					{menuOpen ? (
						<div role="menu" className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-slate-950/50">
							{notification.isRead ? (
								<button type="button" role="menuitem" onClick={() => { onMarkUnread(notification); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">
									<BellOff className="h-4 w-4" aria-hidden="true" /> Mark as unread
								</button>
							) : (
								<button type="button" role="menuitem" onClick={() => { onMarkRead(notification); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-white/5">
									<CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Mark as read
								</button>
							)}
							<button type="button" role="menuitem" onClick={() => { onDelete(notification); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-200 hover:bg-rose-500/10">
								<Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
							</button>
						</div>
					) : null}
				</div>
			</div>
		</li>
	);
}

function hasAction(n) {
	return Boolean(n.actionUrl || n.relatedRequestId || n.relatedBloodBankId || n.relatedDonationId || n.category === 'donation');
}

function actionLabel(n) {
	if (n.category === 'donation') return 'View Appointment';
	if (n.relatedRequestId) return 'View Request';
	if (n.relatedBloodBankId) return 'View Blood Bank';
	return 'View';
}

function NotificationDetailsModal({ notification, onClose, onAction }) {
	return (
		<div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="notif-detail-title">
			<div className="glass-card w-full max-w-xl rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Notification</p>
						<h3 id="notif-detail-title" className="mt-1 text-2xl font-semibold text-white">{notification.title}</h3>
					</div>
					<button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10" aria-label="Close notification">
						<X className="h-5 w-5" aria-hidden="true" />
					</button>
				</div>
				<dl className="mt-6 space-y-3 text-sm">
					<InfoLine label="Message" value={notification.message} />
					<InfoLine label="Category" value={notification.label} />
					<InfoLine label="Created" value={new Date(notification.createdAt).toLocaleString()} />
					{notification.relatedRequestId ? <InfoLine label="Related request" value={notification.relatedRequestId} /> : null}
					{notification.relatedBloodBankId ? <InfoLine label="Related blood bank" value={notification.relatedBloodBankId} /> : null}
				</dl>
				{notification.category === 'emergency' ? (
					<p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-100">
						For life-threatening emergencies, contact local emergency medical services immediately. LifeLink helps connect people with blood resources but does not replace emergency medical care.
					</p>
				) : null}
				<div className="mt-6 flex flex-wrap justify-end gap-3">
					<button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Close</button>
					{hasAction(notification) ? (
						<button type="button" onClick={() => onAction(notification)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white">
							{actionLabel(notification)}
						</button>
					) : null}
				</div>
			</div>
		</div>
	);
}

function DeleteNotificationDialog({ notification, onCancel, onConfirm }) {
	return (
		<div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="del-title">
			<div className="glass-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-start gap-3">
					<div className="rounded-2xl bg-rose-500/15 p-3 text-rose-200"><Trash2 className="h-5 w-5" aria-hidden="true" /></div>
					<div>
						<h3 id="del-title" className="text-xl font-semibold text-white">Delete notification?</h3>
						<p className="mt-2 text-sm text-slate-300">This notification will be removed from your notification list.</p>
					</div>
				</div>
				<div className="mt-6 flex flex-wrap justify-end gap-3">
					<button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Cancel</button>
					<button type="button" onClick={onConfirm} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white">Delete</button>
				</div>
			</div>
		</div>
	);
}

function EmptyState() {
	return (
		<section className="glass-card rounded-[2rem] p-8 text-center sm:p-10">
			<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-200">
				<Bell className="h-8 w-8" aria-hidden="true" />
			</div>
			<h2 className="mt-6 text-2xl font-semibold text-white">You're all caught up</h2>
			<p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-300">You don't have any notifications right now. We'll let you know when something important happens.</p>
		</section>
	);
}

function EmptyFilterState({ onClear }) {
	return (
		<section className="glass-card rounded-[2rem] p-8 text-center sm:p-10">
			<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-500/15 text-sky-200">
				<Filter className="h-8 w-8" aria-hidden="true" />
			</div>
			<h2 className="mt-6 text-2xl font-semibold text-white">No notifications found</h2>
			<p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-300">There are no notifications in this category yet.</p>
			<button type="button" onClick={onClear} className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Clear Filters</button>
		</section>
	);
}

function ErrorState({ onRetry }) {
	return (
		<section className="glass-card rounded-[2rem] p-8 text-center sm:p-10">
			<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-200">
				<AlertTriangle className="h-8 w-8" aria-hidden="true" />
			</div>
			<h2 className="mt-6 text-2xl font-semibold text-white">Unable to load notifications</h2>
			<p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-300">We couldn't retrieve your notifications. Please try again.</p>
			<button type="button" onClick={onRetry} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">Retry</button>
		</section>
	);
}

function NotificationSkeleton() {
	return (
		<div className="space-y-3">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="glass-card h-24 animate-pulse rounded-3xl" />)}
			</div>
			<div className="glass-card h-16 animate-pulse rounded-[2rem]" />
			{Array.from({ length: 5 }).map((_, idx) => (
				<div key={idx} className="glass-card flex items-start gap-4 rounded-2xl p-4">
					<div className="h-11 w-11 animate-pulse rounded-2xl bg-white/10" />
					<div className="flex-1 space-y-2">
						<div className="h-4 w-1/3 animate-pulse rounded-full bg-white/10" />
						<div className="h-3 w-2/3 animate-pulse rounded-full bg-white/10" />
						<div className="h-3 w-1/4 animate-pulse rounded-full bg-white/10" />
					</div>
					<div className="h-8 w-24 animate-pulse rounded-full bg-white/10" />
				</div>
			))}
		</div>
	);
}

function InfoLine({ label, value }) {
	return (
		<div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
			<dt className="text-sm text-slate-400">{label}</dt>
			<dd className="text-right text-sm font-medium text-white">{value || '—'}</dd>
		</div>
	);
}
