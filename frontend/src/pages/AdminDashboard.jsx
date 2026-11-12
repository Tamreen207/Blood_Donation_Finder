import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import DashboardLayout, { adminSidebar } from '../components/DashboardLayout.jsx';
import AdminSummaryCards from '../components/admin/AdminSummaryCards.jsx';
import AdminRequestOverview from '../components/admin/AdminRequestOverview.jsx';
import AdminBloodGroupOverview from '../components/admin/AdminBloodGroupOverview.jsx';
import AdminEmergencyRequests from '../components/admin/AdminEmergencyRequests.jsx';
import AdminRecentRequests from '../components/admin/AdminRecentRequests.jsx';
import AdminRecentDonations from '../components/admin/AdminRecentDonations.jsx';
import AdminBloodBankOverview from '../components/admin/AdminBloodBankOverview.jsx';
import AdminActivityTimeline from '../components/admin/AdminActivityTimeline.jsx';
import AdminSystemHealth from '../components/admin/AdminSystemHealth.jsx';
import AdminQuickActions from '../components/admin/AdminQuickActions.jsx';
import AdminDashboardSkeleton from '../components/admin/AdminDashboardSkeleton.jsx';
import { useNotificationCount } from '../services/notificationCount';
import { fetchAdminDashboard, fetchAdminSystemHealth, isAdminApiConfigured } from '../services/adminDashboardService.js';

function readCurrentUser() {
	try { const raw = localStorage.getItem('lifelink_user'); return raw ? JSON.parse(raw) : null; }
	catch (_) { return null; }
}

function ForbiddenState() {
	return (
		<div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-8 text-center">
			<h2 className="text-lg font-semibold text-slate-900">Admin access required</h2>
			<p className="mt-1 text-sm text-slate-600">This page is only available to administrator accounts.</p>
		</div>
	);
}

function ErrorState({ onRetry }) {
	return (
		<div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-8 text-center">
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
				<AlertTriangle className="h-6 w-6" aria-hidden="true" />
			</div>
			<h2 className="mt-3 text-lg font-semibold text-slate-900">Unable to load dashboard data</h2>
			<p className="mt-1 text-sm text-slate-600">Please try again.</p>
			<button type="button" onClick={onRetry} className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Retry</button>
		</div>
	);
}

function buildActivity(data) {
	const acts = [];
	(data?.recentRequests || []).slice(0, 5).forEach((r) => {
		acts.push({ type: r.urgency === 'CRITICAL' ? 'EMERGENCY' : 'REQUEST_NEW', title: `${r.urgency === 'CRITICAL' ? 'Emergency' : 'Blood'} request created · ${r.bloodGroup} · ${r.unitsRequired}u`, entityId: r._id, at: r.createdAt });
	});
	(data?.recentDonations || []).slice(0, 3).forEach((d) => {
		acts.push({ type: 'DONATION', title: `Donation recorded · ${d.bloodGroup} · ${d.units}u`, entityId: d._id, at: d.donationDate || d.createdAt });
	});
	(data?.recentBanks || []).slice(0, 2).forEach((b) => {
		acts.push({ type: 'BLOOD_BANK', title: `Blood bank registered · ${b.name}`, entityId: b._id, at: b.createdAt });
	});
	acts.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
	return acts;
}

export default function AdminDashboard() {
	const [user, setUser] = useState(() => readCurrentUser());
	const [authChecked, setAuthChecked] = useState(false);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState(null);
	const [data, setData] = useState(null);
	const [health, setHealth] = useState(null);
	const [range, setRange] = useState('all');
	const configured = isAdminApiConfigured();
	const unread = useNotificationCount();
	const isAdmin = user?.role === 'admin';

	const activity = useMemo(() => buildActivity(data), [data]);

	const load = useCallback(async ({ silent = false } = {}) => {
		if (!isAdmin) return;
		if (silent) setRefreshing(true); else setLoading(true);
		setError(null);
		try {
			if (!configured) { setData(null); setHealth(null); return; }
			const [d, h] = await Promise.allSettled([fetchAdminDashboard(), fetchAdminSystemHealth()]);
			if (d.status === 'fulfilled') setData(d.value?.data || d.value);
			else throw d.reason;
			if (h.status === 'fulfilled') setHealth(h.value?.data || h.value);
		} catch (e) {
			setError(e?.message || 'Failed to load dashboard');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [configured, isAdmin]);

	useEffect(() => { setUser(readCurrentUser()); setAuthChecked(true); }, []);

	useEffect(() => {
		if (!authChecked) return;
		if (!user) { window.location.assign('/login'); return; }
		if (user.role && user.role !== 'admin') return;
		load();
	}, [authChecked, user, load]);

	const lastUpdated = data?.generatedAt;

	if (!authChecked) {
		return (
			<DashboardLayout user={user} items={adminSidebar} pageTitle="Admin Dashboard" pageSubtitle="Monitor and manage the LifeLink blood donation network.">
				<AdminDashboardSkeleton />
			</DashboardLayout>
		);
	}
	if (!user) {
		return (
			<DashboardLayout user={user} items={adminSidebar} pageTitle="Admin Dashboard" pageSubtitle="Monitor and manage the LifeLink blood donation network.">
				<ForbiddenState />
			</DashboardLayout>
		);
	}
	if (user.role && user.role !== 'admin') {
		return (
			<DashboardLayout user={user} items={adminSidebar} pageTitle="Admin Dashboard" pageSubtitle="Monitor and manage the LifeLink blood donation network.">
				<ForbiddenState />
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout
			user={user}
			items={adminSidebar}
			pageTitle="Admin Dashboard"
			pageSubtitle="Monitor and manage the LifeLink blood donation network."
			unreadNotifications={unread}
			secondaryAction={
				<button type="button" onClick={() => load({ silent: true })} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
					<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" /> {refreshing ? 'Refreshing…' : 'Refresh Dashboard'}
				</button>
			}
		>
			<div className="space-y-5">
				{lastUpdated && (
					<p className="text-xs text-slate-500">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
				)}

				{loading ? (
					<AdminDashboardSkeleton />
				) : error ? (
					<ErrorState onRetry={() => load()} />
				) : (
					<>
						<AdminSummaryCards data={data?.summary || {}} />

						<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
							<AdminRequestOverview data={data?.requestStatus || {}} />
							<AdminBloodGroupOverview requests={data?.bloodGroups?.requests || {}} units={data?.bloodGroups?.units || {}} />
						</div>

						<AdminEmergencyRequests items={data?.emergencyRequests || []} />

						<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
							<AdminRecentRequests items={data?.recentRequests || []} />
							<AdminRecentDonations items={data?.recentDonations || []} />
						</div>

						<AdminBloodBankOverview summary={data?.summary || {}} recent={data?.recentBanks || []} />

						<div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.9fr]">
							<AdminActivityTimeline items={activity} />
							<AdminSystemHealth checks={health?.checks || {}} />
						</div>

						<AdminQuickActions onRefresh={() => load({ silent: true })} refreshing={refreshing} />
					</>
				)}
			</div>
		</DashboardLayout>
	);
}
