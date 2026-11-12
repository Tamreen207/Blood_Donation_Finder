import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout, { bloodBankSidebar } from '../components/DashboardLayout.jsx';
import BloodBankHeader from '../components/bloodBank/BloodBankHeader.jsx';
import BloodBankStatus from '../components/bloodBank/BloodBankStatus.jsx';
import DashboardSummaryCards from '../components/bloodBank/DashboardSummaryCards.jsx';
import InventoryOverview from '../components/bloodBank/InventoryOverview.jsx';
import StockAlerts from '../components/bloodBank/StockAlerts.jsx';
import EmergencyRequests from '../components/bloodBank/EmergencyRequests.jsx';
import PendingRequests from '../components/bloodBank/PendingRequests.jsx';
import RecentActivity from '../components/bloodBank/RecentActivity.jsx';
import DonationActivity from '../components/bloodBank/DonationActivity.jsx';
import RequestOverview from '../components/bloodBank/RequestOverview.jsx';
import DonorMatchingStatus from '../components/bloodBank/DonorMatchingStatus.jsx';
import RecentNotifications from '../components/bloodBank/RecentNotifications.jsx';
import QuickActions from '../components/bloodBank/QuickActions.jsx';
import InventoryStatusTable from '../components/bloodBank/InventoryStatusTable.jsx';
import BloodBankDashboardSkeleton from '../components/bloodBank/BloodBankDashboardSkeleton.jsx';
import {
	BLOOD_GROUPS,
	fetchDashboard,
	fetchDonationsSummary,
	fetchEmergencyRequests,
	fetchInventorySummary,
	fetchMyBankProfile,
	fetchRecentActivity,
	fetchRecentNotifications,
	fetchRequestsSummary,
	isBloodBankApiConfigured,
} from '../services/bloodBankDashboardService.js';

function readCurrentUser() {
	try {
		const raw = localStorage.getItem('lifelink_user');
		if (!raw) return null;
		return JSON.parse(raw);
	} catch (_) { return null; }
}

const DEFAULT_INVENTORY = BLOOD_GROUPS.map((g) => ({ bloodGroup: g, units: 0, threshold: 5, status: 'UNAVAILABLE', lastUpdated: '—' }));

function deriveStatus(units, threshold = 5) {
	if (!units || units <= 0) return 'UNAVAILABLE';
	if (units < 2) return 'CRITICAL';
	if (units < threshold) return 'LOW';
	return 'HEALTHY';
}

function buildAlerts(items) {
	const alerts = [];
	items.forEach((it) => {
		const status = it.status || deriveStatus(it.units, it.threshold);
		if (status === 'CRITICAL') {
			alerts.push({ bloodGroup: it.bloodGroup, units: it.units || 0, threshold: it.threshold, severity: 'CRITICAL', message: `${it.bloodGroup} stock is critically low`, time: it.lastUpdated });
		} else if (status === 'LOW') {
			alerts.push({ bloodGroup: it.bloodGroup, units: it.units || 0, threshold: it.threshold, severity: 'LOW', message: `${it.bloodGroup} inventory is below recommended threshold`, time: it.lastUpdated });
		}
	});
	return alerts;
}

function relativeTime(iso) {
	if (!iso) return '';
	try {
		const d = new Date(iso);
		const diff = Date.now() - d.getTime();
		const m = Math.round(diff / 60000);
		if (m < 1) return 'just now';
		if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
		const h = Math.round(m / 60);
		if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
		const days = Math.round(h / 24);
		return `${days} day${days === 1 ? '' : 's'} ago`;
	} catch (_) { return ''; }
}

function todayLabel() {
	try {
		return new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	} catch (_) { return ''; }
}

function ErrorState({ onRetry }) {
	return (
		<div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-8 text-center">
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
			</div>
			<h2 className="mt-3 text-lg font-semibold text-slate-900">Unable to load dashboard</h2>
			<p className="mt-1 text-sm text-slate-600">We couldn't retrieve your blood bank information. Please try again.</p>
			<button type="button" onClick={onRetry} className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Retry</button>
		</div>
	);
}

function ForbiddenState() {
	return (
		<div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-8 text-center">
			<h2 className="text-lg font-semibold text-slate-900">Blood Bank access required</h2>
			<p className="mt-1 text-sm text-slate-600">This dashboard is only available to blood bank accounts.</p>
		</div>
	);
}

export default function BloodBankDashboard() {
	const navigate = useNavigate();
	const [user, setUser] = useState(() => readCurrentUser());
	const [authChecked, setAuthChecked] = useState(false);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState(null);
	const [profile, setProfile] = useState(null);
	const [dashboard, setDashboard] = useState(null);
	const [inventoryItems, setInventoryItems] = useState(DEFAULT_INVENTORY);
	const [pendingRequests, setPendingRequests] = useState([]);
	const [emergencyRequests, setEmergencyRequests] = useState([]);
	const [donations, setDonations] = useState({ stats: {}, byDay: [] });
	const [activity, setActivity] = useState([]);
	const [notifications, setNotifications] = useState([]);
	const [lastUpdated, setLastUpdated] = useState('');

	const role = user?.role;
	const isBloodBank = role === 'bloodbank' || role === 'blood_bank';
	const configured = isBloodBankApiConfigured();

	const load = useCallback(async ({ silent = false } = {}) => {
		if (!isBloodBank) return;
		if (silent) setRefreshing(true); else setLoading(true);
		setError(null);
		try {
			if (configured) {
				const [prof, dash, inv, reqs, emerg, don, act, notif] = await Promise.allSettled([
					fetchMyBankProfile(),
					fetchDashboard(),
					fetchInventorySummary(),
					fetchRequestsSummary(),
					fetchEmergencyRequests(),
					fetchDonationsSummary(),
					fetchRecentActivity(),
					fetchRecentNotifications(),
				]);

				if (prof.status === 'fulfilled') setProfile(prof.value?.data || prof.value || null);
				if (dash.status === 'fulfilled') setDashboard(dash.value?.data || dash.value || null);

				if (inv.status === 'fulfilled') {
					const data = inv.value?.data || inv.value;
					const items = Array.isArray(data?.items) && data.items.length ? data.items : DEFAULT_INVENTORY;
					const map = new Map(items.map((i) => [i.bloodGroup, i]));
					const normalized = BLOOD_GROUPS.map((g) => {
						const it = map.get(g) || {};
						return {
							bloodGroup: g,
							units: it.units ?? 0,
							threshold: it.threshold ?? 5,
							status: it.status || deriveStatus(it.units, it.threshold ?? 5),
							lastUpdated: it.lastUpdated || '—',
						};
					});
					setInventoryItems(normalized);
				}

				if (reqs.status === 'fulfilled') {
					const data = reqs.value?.data || reqs.value;
					setPendingRequests(Array.isArray(data?.items) ? data.items : []);
				}
				if (emerg.status === 'fulfilled') {
					const data = emerg.value?.data || emerg.value;
					setEmergencyRequests(Array.isArray(data?.items) ? data.items : []);
				}
				if (don.status === 'fulfilled') {
					const data = don.value?.data || don.value;
					setDonations({ stats: data?.stats || { today: data?.today, scheduled: data?.scheduled, completed: data?.completed, cancelled: data?.cancelled }, byDay: Array.isArray(data?.byDay) ? data.byDay : [] });
				}
				if (act.status === 'fulfilled') {
					const data = act.value?.data || act.value;
					setActivity(Array.isArray(data?.items) ? data.items : []);
				}
				if (notif.status === 'fulfilled') {
					const data = notif.value?.data || notif.value;
					setNotifications(Array.isArray(data?.items) ? data.items : []);
				}
			} else {
				setProfile(null);
				setDashboard(null);
				setInventoryItems(DEFAULT_INVENTORY);
				setPendingRequests([]);
				setEmergencyRequests([]);
				setDonations({ stats: {}, byDay: [] });
				setActivity([]);
				setNotifications([]);
			}
			setLastUpdated(relativeTime(new Date().toISOString()));
		} catch (e) {
			setError(e?.message || 'Failed to load dashboard');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [configured, isBloodBank]);

	useEffect(() => {
		try {
			const u = readCurrentUser();
			setUser(u);
		} finally {
			setAuthChecked(true);
		}
	}, []);

	useEffect(() => {
		if (!authChecked) return;
		if (!user) {
			navigate('/login', { replace: true });
			return;
		}
		if (user.role && !isBloodBank && user.role !== 'admin') {
			return;
		}
		load();
	}, [authChecked, user, isBloodBank, load, navigate]);

	const alerts = useMemo(() => buildAlerts(inventoryItems), [inventoryItems]);
	const totalUnits = useMemo(() => inventoryItems.reduce((s, i) => s + (i.units || 0), 0), [inventoryItems]);
	const lowStock = useMemo(() => inventoryItems.filter((i) => ['LOW', 'CRITICAL'].includes(i.status)).length, [inventoryItems]);

	const summaryData = {
		totalUnits: dashboard?.totalUnits ?? totalUnits,
		lowStock: dashboard?.lowStock ?? lowStock,
		pendingRequests: dashboard?.pendingRequests ?? pendingRequests.length,
		emergencyRequests: dashboard?.emergencyRequests ?? emergencyRequests.length,
		todayDonations: dashboard?.todayDonations ?? donations?.stats?.today ?? 0,
		availableDonors: dashboard?.availableDonors ?? 0,
	};

	const requestStats = dashboard?.requestStats || {
		received: dashboard?.requestsReceived ?? pendingRequests.length,
		accepted: dashboard?.requestsAccepted ?? 0,
		fulfilled: dashboard?.requestsFulfilled ?? 0,
		declined: dashboard?.requestsDeclined ?? 0,
		emergency: dashboard?.emergencyRequests ?? emergencyRequests.length,
	};

	const requestChart = Array.isArray(dashboard?.requestChart) ? dashboard.requestChart : [];
	const donorMatching = dashboard?.donorMatching || { activeRequests: emergencyRequests.length + pendingRequests.length, potentialDonorMatches: 0, bloodBankMatches: 0, successfulMatches: 0 };

	const bankName = profile?.name || user?.bloodBankName || user?.name || 'Blood Bank';
	const bankAddress = [profile?.address, profile?.city, profile?.state].filter(Boolean).join(', ');
	const bankLocation = profile?.city || profile?.location || '';

	if (!authChecked) {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Bank Dashboard" pageSubtitle="Monitor inventory, requests, donors, and daily blood bank operations.">
				<BloodBankDashboardSkeleton />
			</DashboardLayout>
		);
	}

	if (!user) {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Bank Dashboard" pageSubtitle="Monitor inventory, requests, donors, and daily blood bank operations.">
				<ForbiddenState />
			</DashboardLayout>
		);
	}

	if (user.role && !isBloodBank && user.role !== 'admin') {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Bank Dashboard" pageSubtitle="Monitor inventory, requests, donors, and daily blood bank operations.">
				<ForbiddenState />
			</DashboardLayout>
		);
	}

	if (loading) {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Bank Dashboard" pageSubtitle="Monitor inventory, requests, donors, and daily blood bank operations.">
				<BloodBankDashboardSkeleton />
			</DashboardLayout>
		);
	}

	if (error) {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Bank Dashboard" pageSubtitle="Monitor inventory, requests, donors, and daily blood bank operations.">
				<div className="space-y-5">
					<BloodBankHeader name={bankName} location={bankLocation} address={bankAddress} role="Blood Bank" />
					<ErrorState onRetry={() => load()} />
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Bank Dashboard" pageSubtitle="Monitor inventory, requests, donors, and daily blood bank operations.">
			<div className="space-y-5">
				<BloodBankHeader name={bankName} location={bankLocation} address={bankAddress} role="Blood Bank" />

				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<BloodBankStatus status={profile?.status || 'OPERATIONAL'} updatedAt={lastUpdated} accent />
					<div className="flex items-center gap-2">
						<div className="hidden text-right sm:block">
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Today</p>
							<p className="text-sm font-medium text-slate-800">{todayLabel()}</p>
						</div>
						<button
							type="button"
							onClick={() => load({ silent: true })}
							disabled={refreshing}
							className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
						>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></svg>
							{refreshing ? 'Refreshing…' : 'Refresh Dashboard'}
						</button>
					</div>
				</div>

				<DashboardSummaryCards data={summaryData} />

				<div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
					<div className="xl:col-span-2 space-y-5">
						<InventoryOverview items={inventoryItems} onManage={() => navigate('/blood-bank/inventory')} />
						<StockAlerts alerts={alerts} />
						<EmergencyRequests
							items={emergencyRequests}
							onView={(it) => navigate(`/blood-bank/requests?focus=${encodeURIComponent(it.id || '')}`)}
							onRespond={(it) => navigate(`/blood-bank/requests?focus=${encodeURIComponent(it.id || '')}&action=respond`)}
						/>
						<PendingRequests
							items={pendingRequests}
							onView={(it) => navigate(`/blood-bank/requests?focus=${encodeURIComponent(it.id || '')}`)}
							onRespond={(it) => navigate(`/blood-bank/requests?focus=${encodeURIComponent(it.id || '')}&action=respond`)}
						/>
						<RequestOverview stats={requestStats} chart={requestChart} />
					</div>
					<div className="space-y-5">
						<QuickActions />
						<DonorMatchingStatus stats={donorMatching} />
						<DonationActivity stats={donations?.stats || {}} byDay={donations?.byDay || []} />
						<RecentActivity items={activity.map((a) => ({ ...a, timeAgo: a.timeAgo || relativeTime(a.at || a.createdAt) }))} />
						<RecentNotifications items={notifications} />
						<InventoryStatusTable items={inventoryItems} />
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}
