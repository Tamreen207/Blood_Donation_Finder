import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, X, AlertTriangle, User } from 'lucide-react';
import DashboardLayout, { bloodBankSidebar } from '../components/DashboardLayout.jsx';
import DonationSummaryCards from '../components/bloodBank/DonationSummaryCards.jsx';
import DonationFilters from '../components/bloodBank/DonationFilters.jsx';
import DonationTable, { donationStatusLabel, screeningStatusLabel, donationTypeLabel } from '../components/bloodBank/DonationTable.jsx';
import DonationCard from '../components/bloodBank/DonationCard.jsx';
import DonationActivityTimeline from '../components/bloodBank/DonationActivityTimeline.jsx';
import DonationSkeleton from '../components/bloodBank/DonationSkeleton.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import { BLOOD_GROUPS } from '../utils/bloodGroups.js';
import {
	fetchBankDonations,
	fetchBankDonationsSummary,
	fetchBankDonationDetails,
	fetchBankDonationActivity,
	fetchBankDonors,
	createBankDonation,
	transitionBankDonation,
	isBloodBankApiConfigured,
} from '../services/bloodBankDonationService.js';

function readCurrentUser() {
	try { const raw = localStorage.getItem('lifelink_user'); return raw ? JSON.parse(raw) : null; }
	catch (_) { return null; }
}

const TABS = [
	{ key: 'all', label: 'All', match: () => true },
	{ key: 'scheduled', label: 'Scheduled', match: (d) => d.status === 'SCHEDULED' },
	{ key: 'checked-in', label: 'Checked In', match: (d) => d.status === 'CHECKED_IN' },
	{ key: 'screening', label: 'Screening', match: (d) => d.status === 'SCREENING' },
	{ key: 'approved', label: 'Approved', match: (d) => d.status === 'APPROVED' },
	{ key: 'collected', label: 'Collected', match: (d) => d.status === 'COLLECTED' },
	{ key: 'rejected', label: 'Rejected', match: (d) => d.status === 'REJECTED' },
	{ key: 'deferred', label: 'Deferred', match: (d) => d.status === 'DEFERRED' },
	{ key: 'cancelled', label: 'Cancelled', match: (d) => d.status === 'CANCELLED' },
];

const DONATION_TYPES = [
	{ value: 'WHOLE_BLOOD', label: 'Whole Blood' },
	{ value: 'PLASMA', label: 'Plasma' },
	{ value: 'PLATELETS', label: 'Platelets' },
	{ value: 'OTHER', label: 'Other' },
];

const REJECTION_REASONS = [
	{ value: 'LOW_HEMOGLOBIN', label: 'Low hemoglobin' },
	{ value: 'UNFIT_HEALTH', label: 'Unfit for health reasons' },
	{ value: 'INFECTIOUS_MARKERS', label: 'Infectious markers detected' },
	{ value: 'VEIN_ACCESS', label: 'Insufficient vein access' },
	{ value: 'OTHER', label: 'Other' },
];

const DEFERRAL_REASONS = [
	{ value: 'RECENT_DONATION', label: 'Recent donation' },
	{ value: 'MEDICATION', label: 'Current medication' },
	{ value: 'TRAVEL_HISTORY', label: 'Recent travel history' },
	{ value: 'PENDING_TESTS', label: 'Pending lab tests' },
	{ value: 'OTHER', label: 'Other' },
];

function formatDateTime(iso) {
	if (!iso) return '—';
	try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
	catch (_) { return '—'; }
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
	const tones = { rose: 'bg-rose-600 hover:bg-rose-700', sky: 'bg-sky-600 hover:bg-sky-700', emerald: 'bg-emerald-600 hover:bg-emerald-700', amber: 'bg-amber-600 hover:bg-amber-700', slate: 'bg-slate-700 hover:bg-slate-800' };
	return (
		<div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
			<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
				<h3 id="confirm-title" className="text-lg font-semibold text-slate-900">{title}</h3>
				<p className="mt-1 text-sm text-slate-600">{message}</p>
				{children}
				<div className="mt-5 flex flex-wrap justify-end gap-2">
					<button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
					<button type="button" disabled={busy} onClick={onConfirm} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60 ${tones[tone] || tones.rose}`}>
						{busy ? 'Working…' : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

function DonorSearch({ donors, value, onChange }) {
	return (
		<select
			value={value || ''}
			onChange={(e) => onChange(e.target.value)}
			className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
		>
			<option value="">Select donor…</option>
			{donors.map((d) => (
				<option key={d._id} value={d._id}>{d.name} ({d.bloodGroup})</option>
			))}
		</select>
	);
}

function AddDonationModal({ open, onClose, donors, onCreate, busy }) {
	const [form, setForm] = useState({ donorId: '', bloodGroup: '', donationType: 'WHOLE_BLOOD', units: 1, donationDate: new Date().toISOString().slice(0, 16), notes: '' });
	const [error, setError] = useState('');

	useEffect(() => {
		if (open) {
			setForm({ donorId: '', bloodGroup: '', donationType: 'WHOLE_BLOOD', units: 1, donationDate: new Date().toISOString().slice(0, 16), notes: '' });
			setError('');
		}
	}, [open]);

	if (!open) return null;
	const selectedDonor = donors.find((d) => d._id === form.donorId);
	const effectiveGroup = form.bloodGroup || selectedDonor?.bloodGroup || '';

	function submit(e) {
		e.preventDefault();
		setError('');
		if (!form.donorId) { setError('Please select a donor'); return; }
		const units = Number(form.units);
		if (!Number.isFinite(units) || units <= 0) { setError('Units must be greater than 0'); return; }
		if (units > 10) { setError('Units cannot exceed 10 per donation'); return; }
		onCreate({ ...form, units, bloodGroup: effectiveGroup });
	}

	return (
		<div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/70 px-3 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-title">
			<form onSubmit={submit} className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
				<header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-rose-600">New Donation</p>
						<h3 id="add-title" className="mt-0.5 text-lg font-semibold text-slate-900">Add Donation</h3>
					</div>
					<button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" aria-hidden="true" /></button>
				</header>
				<div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">
					<label className="block">
						<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Donor</span>
						<DonorSearch donors={donors} value={form.donorId} onChange={(v) => setForm({ ...form, donorId: v, bloodGroup: '' })} />
					</label>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<label className="block">
							<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blood Group</span>
							<select value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200">
								<option value="">{selectedDonor ? `Use donor default (${selectedDonor.bloodGroup})` : 'Select…'}</option>
								{BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
							</select>
						</label>
						<label className="block">
							<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Donation Type</span>
							<select value={form.donationType} onChange={(e) => setForm({ ...form, donationType: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200">
								{DONATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
							</select>
						</label>
					</div>
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<label className="block">
							<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Donation Date</span>
							<input type="datetime-local" value={form.donationDate} onChange={(e) => setForm({ ...form, donationDate: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200" />
						</label>
						<label className="block">
							<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Units Collected</span>
							<input type="number" min={1} max={10} value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200" />
						</label>
					</div>
					<label className="block">
						<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
						<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200" placeholder="Optional operational notes" />
					</label>
					{error && <p className="text-sm text-rose-700">{error}</p>}
				</div>
				<footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3">
					<button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
					<button type="submit" disabled={busy} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60">{busy ? 'Saving…' : 'Create Donation'}</button>
				</footer>
			</form>
		</div>
	);
}

function DonationDetailsModal({ donation, activity, onClose, onTransition, busy, availableActions }) {
	if (!donation) return null;
	return (
		<div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-3 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="d-title">
			<div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
				<header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Donation Details</p>
						<h3 id="d-title" className="mt-0.5 text-lg font-semibold text-slate-900">{donation._id}</h3>
					</div>
					<button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" aria-hidden="true" /></button>
				</header>
				<div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-4">
					<section>
						<h4 className="text-sm font-semibold text-slate-800">Donation Information</h4>
						<dl className="mt-2 space-y-1 text-sm">
							<InfoLine label="Date" value={formatDateTime(donation.donationDate)} />
							<InfoLine label="Type" value={donationTypeLabel(donation.donationType)} />
							<InfoLine label="Blood group" value={donation.bloodGroup} />
							<InfoLine label="Units" value={donation.units} />
							<InfoLine label="Status" value={donationStatusLabel(donation.status)} />
							<InfoLine label="Screening" value={screeningStatusLabel(donation.screeningStatus)} />
							{donation.inventoryBatchId && <InfoLine label="Inventory Batch" value={donation.inventoryBatchId} />}
						</dl>
					</section>
					<section>
						<h4 className="text-sm font-semibold text-slate-800">Donor</h4>
						<dl className="mt-2 space-y-1 text-sm">
							<InfoLine label="Name" value={donation.donor?.name} />
							<InfoLine label="Donor ID" value={donation.donorUserId} />
							<InfoLine label="Blood group" value={donation.donor?.bloodGroup} />
							<InfoLine label="Eligibility" value={donation.donor?.isAvailable === false ? 'Not eligible (currently unavailable)' : 'Eligible'} />
							{Number.isFinite(donation.donor?.totalDonations) && <InfoLine label="Total donations" value={donation.donor.totalDonations} />}
							{donation.donor?.lastDonationDate && <InfoLine label="Last donation" value={formatDateTime(donation.donor.lastDonationDate)} />}
						</dl>
					</section>
					{donation.notes && (
						<section>
							<h4 className="text-sm font-semibold text-slate-800">Notes</h4>
							<p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{donation.notes}</p>
						</section>
					)}
					{donation.rejectionReason && <InfoLine label="Rejection reason" value={donation.rejectionReason} />}
					{donation.deferralReason && <InfoLine label="Deferral reason" value={donation.deferralReason} />}
					<section>
						<h4 className="text-sm font-semibold text-slate-800">Activity Timeline</h4>
						<div className="mt-2"><DonationActivityTimeline events={activity} /></div>
					</section>
				</div>
				<footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/60 px-5 py-3">
					{availableActions?.map((a) => (
						<button key={a.action} type="button" disabled={busy} onClick={() => onTransition(a.action)} className={`rounded-lg px-3 py-2 text-sm font-semibold shadow-sm disabled:opacity-60 ${a.tone}`}>{a.label}</button>
					))}
					<button type="button" onClick={onClose} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Close</button>
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
			<h2 className="mt-3 text-lg font-semibold text-slate-900">Unable to load donations</h2>
			<p className="mt-1 text-sm text-slate-600">Please try again.</p>
			<button type="button" onClick={onRetry} className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Retry</button>
		</div>
	);
}

function EmptyState({ tabKey, hasAny, onReset, onAdd }) {
	const isFiltered = tabKey && tabKey !== 'all';
	if (!hasAny && !isFiltered) {
		return (
			<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
				<p className="text-sm font-semibold text-slate-800">No donations recorded yet</p>
				<p className="mt-1 text-sm text-slate-500">Once you add donations, they will appear here.</p>
				{onAdd && <button type="button" onClick={onAdd} className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700">Add Donation</button>}
			</div>
		);
	}
	return (
		<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
			<p className="text-sm font-semibold text-slate-800">No donations found</p>
			<p className="mt-1 text-sm text-slate-500">There are no donations matching your current filters.</p>
			{isFiltered && <button type="button" onClick={onReset} className="mt-4 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear Filters</button>}
		</div>
	);
}

function availableActionsFor(d) {
	if (!d) return [];
	const acts = [];
	if (d.status === 'SCHEDULED') acts.push({ action: 'check-in', label: 'Check In', tone: 'bg-sky-600 text-white hover:bg-sky-700' });
	if (d.status === 'CHECKED_IN') acts.push({ action: 'screen', label: 'Start Screening', tone: 'bg-indigo-600 text-white hover:bg-indigo-700' });
	if (d.status === 'SCREENING' || d.status === 'CHECKED_IN') acts.push({ action: 'approve', label: 'Approve', tone: 'bg-emerald-600 text-white hover:bg-emerald-700' });
	if (d.status === 'APPROVED') acts.push({ action: 'collect', label: 'Mark Collected', tone: 'bg-emerald-700 text-white hover:bg-emerald-800' });
	if (!['COLLECTED', 'CANCELLED', 'REJECTED'].includes(d.status)) {
		acts.push({ action: 'reject', label: 'Reject', tone: 'border border-rose-300 bg-white text-rose-700 hover:bg-rose-50' });
		acts.push({ action: 'defer', label: 'Defer', tone: 'border border-amber-300 bg-white text-amber-700 hover:bg-amber-50' });
		acts.push({ action: 'cancel', label: 'Cancel', tone: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50' });
	}
	return acts;
}

export default function BloodBankDonations() {
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
	const [addOpen, setAddOpen] = useState(false);
	const [donors, setDonors] = useState([]);
	const [busy, setBusy] = useState(false);
	const [confirm, setConfirm] = useState(null);
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
				setItems([]); setSummary({}); setTotal(0); setPages(1); setPage(1);
				return;
			}
			const usePage = pageOverride ?? page;
			const [list, sum] = await Promise.allSettled([
				fetchBankDonations({ ...filters, page: usePage, limit: 25 }),
				fetchBankDonationsSummary(),
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
			if (sum.status === 'fulfilled') setSummary(sum.value?.data || {});
		} catch (e) {
			setError(e?.message || 'Failed to load donations');
		} finally {
			setLoading(false); setRefreshing(false);
		}
	}, [configured, filters, isBloodBank, page]);

	useEffect(() => { setUser(readCurrentUser()); setAuthChecked(true); }, []);

	useEffect(() => {
		if (!authChecked) return;
		if (!user) { navigate('/login', { replace: true }); return; }
		if (user.role && !isBloodBank && user.role !== 'admin') return;
		load();
	}, [authChecked, user, isBloodBank, load, navigate]);

	useEffect(() => {
		if (isBloodBank && configured) {
			fetchBankDonors().then((res) => {
				const items = res?.data?.items || res?.data || [];
				if (Array.isArray(items)) setDonors(items);
			}).catch(() => {});
		}
	}, [isBloodBank, configured]);

	async function openDetails(d) {
		setSelected(d); setActivity([]);
		if (configured && d?._id) {
			try { const res = await fetchBankDonationDetails(d._id); setSelected(res?.data || d); } catch (_) {}
			try { const res = await fetchBankDonationActivity(d._id); setActivity(res?.data?.events || []); } catch (_) {}
		}
	}
	function closeDetails() { setSelected(null); setActivity([]); }

	function startTransition(action) {
		if (!selected) return;
		if (action === 'reject') setConfirm({ kind: 'reject', donation: selected, reason: REJECTION_REASONS[0].value });
		else if (action === 'defer') setConfirm({ kind: 'defer', donation: selected, reason: DEFERRAL_REASONS[0].value });
		else setConfirm({ kind: 'action', donation: selected, action, label: actionLabel(action) });
	}

	async function executeConfirm() {
		if (!confirm) return;
		setBusy(true);
		try {
			const payload = confirm.kind === 'reject' ? { action: 'reject', reason: confirm.reason }
				: confirm.kind === 'defer' ? { action: 'defer', reason: confirm.reason }
				: { action: confirm.action };
			await transitionBankDonation(confirm.donation._id, payload);
			toast('Donation updated successfully', 'success');
			setConfirm(null);
			closeDetails();
			load({ silent: true });
		} catch (e) {
			toast(e?.message || 'Action failed', 'error');
		} finally { setBusy(false); }
	}

	async function createDonation(form) {
		setBusy(true);
		try {
			await createBankDonation({ ...form, status: 'SCHEDULED' });
			toast('Donation created', 'success');
			setAddOpen(false);
			load({ silent: true });
		} catch (e) {
			toast(e?.message || 'Failed to create donation', 'error');
		} finally { setBusy(false); }
	}

	function resetFilters() { setFilters({ sort: 'newest' }); setTab('all'); }

	if (!authChecked) {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Donation Management" pageSubtitle="Manage blood donations, donor records, screening status, and collected units.">
				<DonationSkeleton />
			</DashboardLayout>
		);
	}
	if (!user) {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Donation Management" pageSubtitle="Manage blood donations, donor records, screening status, and collected units.">
				<ForbiddenState />
			</DashboardLayout>
		);
	}
	if (user.role && !isBloodBank && user.role !== 'admin') {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Donation Management" pageSubtitle="Manage blood donations, donor records, screening status, and collected units.">
				<ForbiddenState />
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Donation Management" pageSubtitle="Manage blood donations, donor records, screening status, and collected units.">
			<div className="space-y-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Blood Bank Operations</p>
						<h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Donation Management</h1>
						<p className="text-sm text-slate-600">Manage blood donations, donor records, screening status, and collected units.</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<button type="button" onClick={() => load({ silent: true })} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
							<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
							{refreshing ? 'Refreshing…' : 'Refresh'}
						</button>
						<button type="button" onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700">
							<Plus className="h-4 w-4" aria-hidden="true" /> Add Donation
						</button>
					</div>
				</div>

				{loading ? (
					<DonationSkeleton />
				) : error ? (
					<ErrorState onRetry={() => load()} />
				) : (
					<>
						<DonationSummaryCards data={summary} />

						<section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
							<div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist">
								{TABS.map((t) => (
									<button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${tab === t.key ? 'bg-rose-600 text-white shadow-sm' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
										{t.label}
									</button>
								))}
							</div>
						</section>

						<DonationFilters value={filters} onChange={(f) => { setFilters(f); setPage(1); }} onReset={resetFilters} />

						{visibleItems.length === 0 ? (
							<EmptyState tabKey={tab} hasAny={items.length > 0} onReset={resetFilters} onAdd={() => setAddOpen(true)} />
						) : (
							<>
								<DonationTable items={visibleItems} onView={openDetails} onManage={openDetails} />
								<div className="grid grid-cols-1 gap-3 md:hidden">
									{visibleItems.map((d) => <DonationCard key={d._id} donation={d} onView={openDetails} onManage={openDetails} />)}
								</div>
								{pages > 1 && (
									<div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
										<span className="text-slate-600">Page {page} of {pages} • {total} donations</span>
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

			<AddDonationModal open={addOpen} onClose={() => setAddOpen(false)} donors={donors} onCreate={createDonation} busy={busy} />

			<DonationDetailsModal
				donation={selected}
				activity={activity}
				busy={busy}
				availableActions={selected ? availableActionsFor(selected) : []}
				onClose={closeDetails}
				onTransition={startTransition}
			/>

			<ConfirmDialog
				open={Boolean(confirm && (confirm.kind === 'action'))}
				title={confirm?.label || 'Confirm action'}
				message={confirm?.donation ? `Donation ${confirm.donation._id}` : ''}
				confirmLabel="Confirm"
				tone="emerald"
				busy={busy}
				onCancel={() => setConfirm(null)}
				onConfirm={executeConfirm}
			>
				{confirm?.kind === 'action' && confirm?.donation && (
					<div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
						<p><span className="text-slate-500">Blood group:</span> <span className="font-semibold">{confirm.donation.bloodGroup}</span></p>
						<p><span className="text-slate-500">Units:</span> <span className="font-semibold">{confirm.donation.units}</span></p>
						<p><span className="text-slate-500">Screening:</span> <span className="font-semibold">{screeningStatusLabel(confirm.donation.screeningStatus)}</span></p>
					</div>
				)}
			</ConfirmDialog>

			<ConfirmDialog
				open={Boolean(confirm && confirm.kind === 'reject')}
				title="Reject this donation?"
				confirmLabel="Reject"
				tone="rose"
				busy={busy}
				onCancel={() => setConfirm(null)}
				onConfirm={executeConfirm}
			>
				{confirm?.kind === 'reject' && (
					<div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
						<p><span className="text-slate-500">Donation:</span> <span className="font-mono">{confirm.donation._id}</span></p>
						<label className="block">
							<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</span>
							<select value={confirm.reason} onChange={(e) => setConfirm({ ...confirm, reason: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200">
								{REJECTION_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
							</select>
						</label>
					</div>
				)}
			</ConfirmDialog>

			<ConfirmDialog
				open={Boolean(confirm && confirm.kind === 'defer')}
				title="Defer this donation?"
				confirmLabel="Defer"
				tone="amber"
				busy={busy}
				onCancel={() => setConfirm(null)}
				onConfirm={executeConfirm}
			>
				{confirm?.kind === 'defer' && (
					<div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
						<p><span className="text-slate-500">Donation:</span> <span className="font-mono">{confirm.donation._id}</span></p>
						<label className="block">
							<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</span>
							<select value={confirm.reason} onChange={(e) => setConfirm({ ...confirm, reason: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200">
								{DEFERRAL_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
							</select>
						</label>
					</div>
				)}
			</ConfirmDialog>
		</DashboardLayout>
	);
}

function actionLabel(action) {
	return {
		'check-in': 'Check In Donor',
		screen: 'Start Screening',
		approve: 'Approve Donation',
		collect: 'Mark Collected',
	}[action] || action;
}
