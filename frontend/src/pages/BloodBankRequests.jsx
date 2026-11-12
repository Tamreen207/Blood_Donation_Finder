import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, RefreshCw, Search, X, AlertTriangle, Building2, MapPin, Clock, Droplet, CheckCircle2, XCircle, Package } from 'lucide-react';
import DashboardLayout, { bloodBankSidebar } from '../components/DashboardLayout.jsx';
import RequestSummaryCards from '../components/bloodBank/RequestSummaryCards.jsx';
import RequestFilters from '../components/bloodBank/RequestFilters.jsx';
import EmergencyRequestCard from '../components/bloodBank/EmergencyRequestCard.jsx';
import BloodRequestTable, { urgencyLabel, statusLabel } from '../components/bloodBank/BloodRequestTable.jsx';
import BloodRequestCard from '../components/bloodBank/BloodRequestCard.jsx';
import RequestActivityTimeline from '../components/bloodBank/RequestActivityTimeline.jsx';
import RequestSkeleton from '../components/bloodBank/RequestSkeleton.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import {
	fetchBankRequests,
	fetchBankRequestsSummary,
	fetchBankRequestDetails,
	fetchBankRequestActivity,
	respondToBankRequest,
	fetchBankInventory,
	isBloodBankApiConfigured,
} from '../services/bloodBankRequestService.js';

function readCurrentUser() {
	try {
		const raw = localStorage.getItem('lifelink_user');
		if (!raw) return null;
		return JSON.parse(raw);
	} catch (_) { return null; }
}

const TABS = [
	{ key: 'all', label: 'All', match: () => true },
	{ key: 'pending', label: 'Pending', match: (r) => ['PENDING', 'MATCHING'].includes(r.status) },
	{ key: 'emergency', label: 'Emergency', match: (r) => r.urgency === 'CRITICAL' && !['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(r.status) },
	{ key: 'accepted', label: 'Accepted', match: (r) => ['ACCEPTED', 'PARTIALLY_FULFILLED'].includes(r.status) },
	{ key: 'partial', label: 'Partially Fulfilled', match: (r) => r.status === 'PARTIALLY_FULFILLED' },
	{ key: 'fulfilled', label: 'Fulfilled', match: (r) => r.status === 'FULFILLED' },
	{ key: 'declined', label: 'Declined', match: (r) => r.status === 'CANCELLED' },
	{ key: 'cancelled', label: 'Cancelled', match: (r) => r.status === 'CANCELLED' },
];

function formatDateTime(iso) {
	if (!iso) return '—';
	try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
	catch (_) { return '—'; }
}

function privacyLocation(r) {
	return r?.city || r?.hospitalAddress || '—';
}

function InfoLine({ label, value }) {
	return (
		<div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0">
			<dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
			<dd className="text-right text-sm text-slate-800">{value || '—'}</dd>
		</div>
	);
}

function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', tone = 'rose', busy = false, onCancel, onConfirm, children }) {
	if (!open) return null;
	const toneClasses = {
		rose: 'bg-rose-600 hover:bg-rose-700',
		emerald: 'bg-emerald-600 hover:bg-emerald-700',
		sky: 'bg-sky-600 hover:bg-sky-700',
		slate: 'bg-slate-700 hover:bg-slate-800',
	};
	return (
		<div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
			<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
				<h3 id="confirm-title" className="text-lg font-semibold text-slate-900">{title}</h3>
				<p className="mt-1 text-sm text-slate-600">{message}</p>
				{children}
				<div className="mt-5 flex flex-wrap justify-end gap-2">
					<button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
					<button type="button" disabled={busy} onClick={onConfirm} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60 ${toneClasses[tone] || toneClasses.rose}`}>
						{busy ? 'Working…' : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

function RequestDetailsModal({ request, activity, onClose, onAccept, onPartial, onDecline, busy }) {
	if (!request) return null;
	const remaining = Math.max(0, (request.unitsRequired || 0) - (request.unitsFulfilled || 0));
	return (
		<div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-3 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="details-title">
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
				<header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Request Details</p>
						<h3 id="details-title" className="mt-0.5 text-lg font-semibold text-slate-900">{request._id}</h3>
					</div>
					<button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close details">
						<X className="h-5 w-5" aria-hidden="true" />
					</button>
				</header>
				<div className="max-h-[70vh] overflow-y-auto px-5 py-4">
					<section>
						<h4 className="text-sm font-semibold text-slate-800">Request Information</h4>
						<dl className="mt-2 space-y-1 text-sm">
							<InfoLine label="Blood group" value={request.bloodGroup} />
							<InfoLine label="Units requested" value={request.unitsRequired} />
							<InfoLine label="Units fulfilled" value={request.unitsFulfilled || 0} />
							<InfoLine label="Units remaining" value={remaining} />
							<InfoLine label="Urgency" value={urgencyLabel(request.urgency)} />
							<InfoLine label="Status" value={statusLabel(request.status)} />
							<InfoLine label="Requested" value={formatDateTime(request.createdAt)} />
							<InfoLine label="Needed by" value={formatDateTime(request.requiredBy)} />
						</dl>
					</section>
					<section className="mt-5">
						<h4 className="text-sm font-semibold text-slate-800">Requesting Organization</h4>
						<dl className="mt-2 space-y-1 text-sm">
							<InfoLine label="Hospital" value={request.hospitalName} />
							<InfoLine label="Location" value={privacyLocation(request)} />
						</dl>
					</section>
					{request.message ? (
						<section className="mt-5">
							<h4 className="text-sm font-semibold text-slate-800">Request Notes</h4>
							<p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{request.message}</p>
						</section>
					) : null}
					<section className="mt-5">
						<h4 className="text-sm font-semibold text-slate-800">Activity Timeline</h4>
						<div className="mt-2"><RequestActivityTimeline events={activity} /></div>
					</section>
				</div>
				<footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3">
					{!['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(request.status) && (
						<>
							<button type="button" disabled={busy} onClick={() => onDecline(request)} className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">Decline</button>
							<button type="button" disabled={busy} onClick={() => onPartial(request)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Partially Fulfill</button>
							<button type="button" disabled={busy} onClick={() => onAccept(request)} className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60">Accept Request</button>
						</>
					)}
				</footer>
			</div>
		</div>
	);
}

function ForbiddenState() {
	return (
		<div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-8 text-center">
			<h2 className="text-lg font-semibold text-slate-900">Blood Bank access required</h2>
			<p className="mt-1 text-sm text-slate-600">This page is only available to blood bank accounts.</p>
		</div>
	);
}

function ErrorState({ onRetry }) {
	return (
		<div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-8 text-center">
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
				<AlertTriangle className="h-6 w-6" aria-hidden="true" />
			</div>
			<h2 className="mt-3 text-lg font-semibold text-slate-900">Unable to load blood requests</h2>
			<p className="mt-1 text-sm text-slate-600">Please try again.</p>
			<button type="button" onClick={onRetry} className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Retry</button>
		</div>
	);
}

function EmptyState({ tabKey, onReset }) {
	const isFiltered = tabKey && tabKey !== 'all';
	return (
		<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
			<p className="text-sm font-semibold text-slate-800">{isFiltered ? 'No blood requests found' : 'No blood requests yet'}</p>
			<p className="mt-1 text-sm text-slate-500">{isFiltered ? 'There are no requests matching your current filters.' : 'You will see incoming blood requests here once they are routed to your blood bank.'}</p>
			{isFiltered && (
				<button type="button" onClick={onReset} className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear Filters</button>
			)}
		</div>
	);
}

export default function BloodBankRequests() {
	const navigate = useNavigate();
	const { toast } = useToast();
	const [user, setUser] = useState(() => readCurrentUser());
	const [authChecked, setAuthChecked] = useState(false);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState(null);
	const [items, setItems] = useState([]);
	const [summary, setSummary] = useState({});
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pages, setPages] = useState(1);
	const [filters, setFilters] = useState({ sort: 'newest' });
	const [tab, setTab] = useState('all');
	const [selected, setSelected] = useState(null);
	const [activity, setActivity] = useState([]);
	const [confirm, setConfirm] = useState(null);
	const [busy, setBusy] = useState(false);
	const [inventoryMap, setInventoryMap] = useState({});
	const configured = isBloodBankApiConfigured();

	const role = user?.role;
	const isBloodBank = role === 'bloodbank' || role === 'blood_bank';

	const visibleItems = useMemo(() => {
		const t = TABS.find((x) => x.key === tab) || TABS[0];
		return items.filter(t.match);
	}, [items, tab]);

	const load = useCallback(async ({ silent = false, pageOverride } = {}) => {
		if (!isBloodBank) return;
		if (silent) setRefreshing(true); else setLoading(true);
		setError(null);
		try {
			if (!configured) {
				setItems([]);
				setSummary({});
				setTotal(0);
				setPages(1);
				setPage(1);
				return;
			}
			const usePage = pageOverride ?? page;
			const [list, sum] = await Promise.allSettled([
				fetchBankRequests({ ...filters, page: usePage, limit: 25 }),
				fetchBankRequestsSummary(),
			]);
			if (list.status === 'fulfilled') {
				const data = list.value?.data || {};
				setItems(Array.isArray(data.items) ? data.items : []);
				setTotal(data.total || 0);
				setPage(data.page || usePage);
				setPages(data.pages || 1);
			} else {
				throw list.reason;
			}
			if (sum.status === 'fulfilled') {
				setSummary(sum.value?.data || {});
			}
		} catch (e) {
			setError(e?.message || 'Failed to load blood requests');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [configured, filters, isBloodBank, page]);

	useEffect(() => {
		setUser(readCurrentUser());
		setAuthChecked(true);
	}, []);

	useEffect(() => {
		if (!authChecked) return;
		if (!user) {
			navigate('/login', { replace: true });
			return;
		}
		if (user.role && !isBloodBank && user.role !== 'admin') return;
		load();
	}, [authChecked, user, isBloodBank, load, navigate]);

	useEffect(() => {
		if (isBloodBank && configured) {
			fetchBankInventory().then((res) => {
				const items = res?.data?.items || res?.data || res?.items || res || [];
				if (Array.isArray(items)) {
					const map = {};
					items.forEach((i) => { if (i?.bloodGroup) map[i.bloodGroup] = i.unitsAvailable ?? i.units ?? 0; });
					setInventoryMap(map);
				}
			}).catch(() => {});
		}
	}, [isBloodBank, configured]);

	async function openDetails(request) {
		setSelected(request);
		setActivity([]);
		if (configured && request?._id) {
			try {
				const res = await fetchBankRequestActivity(request._id);
				setActivity(res?.data?.events || []);
			} catch (_) {
				setActivity([]);
			}
		}
	}

	function closeDetails() {
		setSelected(null);
		setActivity([]);
	}

	function startAccept(request) {
		const available = inventoryMap[request.bloodGroup] ?? 0;
		const remaining = Math.max(0, request.unitsRequired - (request.unitsFulfilled || 0));
		setConfirm({
			kind: 'accept',
			request,
			available,
			remaining,
			units: Math.min(available || 0, remaining || 0) || remaining,
		});
	}

	function startPartial(request) {
		const available = inventoryMap[request.bloodGroup] ?? 0;
		const remaining = Math.max(0, request.unitsRequired - (request.unitsFulfilled || 0));
		setConfirm({ kind: 'partial', request, available, remaining, units: 1 });
	}

	function startDecline(request) {
		setConfirm({ kind: 'decline', request, reason: 'INSUFFICIENT_STOCK' });
	}

	async function executeConfirm() {
		if (!confirm) return;
		setBusy(true);
		try {
			let payload;
			if (confirm.kind === 'accept') {
				payload = { action: 'ACCEPT', units: confirm.units };
			} else if (confirm.kind === 'partial') {
				payload = { action: 'PARTIAL', units: confirm.units };
			} else {
				payload = { action: 'REJECT', reason: confirm.reason };
			}
			await respondToBankRequest(confirm.request._id, payload);
			toast({ tone: 'success', title: confirm.kind === 'decline' ? 'Request declined' : 'Request updated', message: 'The request status has been updated.' });
			setConfirm(null);
			closeDetails();
			load({ silent: true });
		} catch (e) {
			toast({ tone: 'error', title: 'Action failed', message: e?.message || 'Please try again.' });
		} finally {
			setBusy(false);
		}
	}

	function resetFilters() {
		setFilters({ sort: 'newest' });
		setTab('all');
	}

	if (!authChecked) {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Requests" pageSubtitle="Review, prioritize, and respond to blood requests received by your blood bank.">
				<RequestSkeleton />
			</DashboardLayout>
		);
	}

	if (!user) {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Requests" pageSubtitle="Review, prioritize, and respond to blood requests received by your blood bank.">
				<ForbiddenState />
			</DashboardLayout>
		);
	}

	if (user.role && !isBloodBank && user.role !== 'admin') {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Requests" pageSubtitle="Review, prioritize, and respond to blood requests received by your blood bank.">
				<ForbiddenState />
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Requests" pageSubtitle="Review, prioritize, and respond to blood requests received by your blood bank.">
			<div className="space-y-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Blood Bank Operations</p>
						<h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Blood Requests</h1>
						<p className="text-sm text-slate-600">Review, prioritize, and respond to blood requests received by your blood bank.</p>
					</div>
					<div className="flex items-center gap-2">
						<button type="button" onClick={() => navigate('/notifications')} className="relative inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
							<Bell className="h-4 w-4" aria-hidden="true" />
							Notifications
						</button>
						<button type="button" onClick={() => load({ silent: true })} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
							<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
							{refreshing ? 'Refreshing…' : 'Refresh'}
						</button>
					</div>
				</div>

				{loading ? (
					<RequestSkeleton />
				) : error ? (
					<ErrorState onRetry={() => load()} />
				) : (
					<>
						<RequestSummaryCards data={summary} />

						<section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
							<div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist">
								{TABS.map((t) => (
									<button
										key={t.key}
										role="tab"
										aria-selected={tab === t.key}
										onClick={() => setTab(t.key)}
										className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${tab === t.key ? 'bg-rose-600 text-white shadow-sm' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
									>
										{t.label}
									</button>
								))}
							</div>
						</section>

						<RequestFilters value={filters} onChange={(f) => { setFilters(f); setPage(1); }} onReset={resetFilters} />

						{visibleItems.filter((r) => r.urgency === 'CRITICAL' && !['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(r.status)).length > 0 && (
							<section className="rounded-2xl border border-rose-200 bg-rose-50/30 p-4 shadow-sm">
								<h2 className="inline-flex items-center gap-2 text-base font-semibold text-rose-700">
									<AlertTriangle className="h-4 w-4" aria-hidden="true" /> Emergency Requests
								</h2>
								<div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
									{visibleItems.filter((r) => r.urgency === 'CRITICAL' && !['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(r.status)).map((r) => (
										<EmergencyRequestCard key={r._id} request={r} onView={openDetails} onRespond={openDetails} />
									))}
								</div>
							</section>
						)}

						{visibleItems.length === 0 ? (
							<EmptyState tabKey={tab} onReset={resetFilters} />
						) : (
							<>
								<BloodRequestTable items={visibleItems} onView={openDetails} onRespond={openDetails} />
								<div className="grid grid-cols-1 gap-3 md:hidden">
									{visibleItems.map((r) => (
										<BloodRequestCard key={r._id} request={r} onView={openDetails} onRespond={openDetails} />
									))}
								</div>
								{pages > 1 && (
									<div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
										<span className="text-slate-600">Page {page} of {pages} • {total} requests</span>
										<div className="flex gap-2">
											<button type="button" disabled={page <= 1} onClick={() => { const np = page - 1; setPage(np); load({ silent: true, pageOverride: np }); }} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Previous</button>
											<button type="button" disabled={page >= pages} onClick={() => { const np = page + 1; setPage(np); load({ silent: true, pageOverride: np }); }} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Next</button>
										</div>
									</div>
								)}
							</>
						)}
					</>
				)}
			</div>

			<RequestDetailsModal
				request={selected}
				activity={activity}
				busy={busy}
				onClose={closeDetails}
				onAccept={startAccept}
				onPartial={startPartial}
				onDecline={startDecline}
			/>

			<ConfirmDialog
				open={Boolean(confirm && confirm.kind === 'accept')}
				title="Accept this blood request?"
				confirmLabel="Accept Request"
				tone="emerald"
				busy={busy}
				onCancel={() => setConfirm(null)}
				onConfirm={executeConfirm}
			>
				{confirm?.kind === 'accept' && (
					<div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
						<p><span className="text-slate-500">Blood group:</span> <span className="font-semibold">{confirm.request.bloodGroup}</span></p>
						<p><span className="text-slate-500">Units requested:</span> <span className="font-semibold">{confirm.request.unitsRequired}</span></p>
						<p><span className="text-slate-500">Available stock:</span> <span className="font-semibold">{confirm.available}</span></p>
						<p><span className="text-slate-500">Hospital:</span> <span className="font-semibold">{confirm.request.hospitalName}</span></p>
						<label className="mt-2 block">
							<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Units to allocate</span>
							<input
								type="number"
								min={1}
								max={Math.max(1, Math.min(confirm.remaining, confirm.available || confirm.remaining))}
								value={confirm.units}
								onChange={(e) => setConfirm({ ...confirm, units: Math.max(1, Number(e.target.value) || 1) })}
								className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
							/>
						</label>
					</div>
				)}
			</ConfirmDialog>

			<ConfirmDialog
				open={Boolean(confirm && confirm.kind === 'partial')}
				title="Confirm partial fulfillment?"
				confirmLabel="Confirm Partial"
				tone="sky"
				busy={busy}
				onCancel={() => setConfirm(null)}
				onConfirm={executeConfirm}
			>
				{confirm?.kind === 'partial' && (
					<div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
						<p><span className="text-slate-500">Requested units:</span> <span className="font-semibold">{confirm.request.unitsRequired}</span></p>
						<p><span className="text-slate-500">Already fulfilled:</span> <span className="font-semibold">{confirm.request.unitsFulfilled || 0}</span></p>
						<p><span className="text-slate-500">Remaining:</span> <span className="font-semibold">{confirm.remaining}</span></p>
						<p><span className="text-slate-500">Available stock:</span> <span className="font-semibold">{confirm.available}</span></p>
						<label className="mt-2 block">
							<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Units to fulfill now</span>
							<input
								type="number"
								min={1}
								max={Math.max(1, Math.min(confirm.remaining, confirm.available || 0))}
								value={confirm.units}
								onChange={(e) => setConfirm({ ...confirm, units: Math.max(1, Number(e.target.value) || 1) })}
								className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
							/>
						</label>
					</div>
				)}
			</ConfirmDialog>

			<ConfirmDialog
				open={Boolean(confirm && confirm.kind === 'decline')}
				title="Decline this blood request?"
				confirmLabel="Decline Request"
				tone="rose"
				busy={busy}
				onCancel={() => setConfirm(null)}
				onConfirm={executeConfirm}
			>
				{confirm?.kind === 'decline' && (
					<div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
						<p><span className="text-slate-500">Request:</span> <span className="font-mono">{confirm.request._id}</span></p>
						<p><span className="text-slate-500">Blood group:</span> <span className="font-semibold">{confirm.request.bloodGroup}</span></p>
						<label className="mt-2 block">
							<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</span>
							<select
								value={confirm.reason}
								onChange={(e) => setConfirm({ ...confirm, reason: e.target.value })}
								className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
							>
								<option value="INSUFFICIENT_STOCK">Insufficient stock</option>
								<option value="BLOOD_GROUP_UNAVAILABLE">Blood group unavailable</option>
								<option value="REQUEST_INVALID">Request invalid</option>
								<option value="OUTSIDE_SERVICE_AREA">Outside service area</option>
								<option value="OTHER">Other</option>
							</select>
						</label>
					</div>
				)}
			</ConfirmDialog>
		</DashboardLayout>
	);
}
