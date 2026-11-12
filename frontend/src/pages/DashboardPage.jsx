import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
	BookmarkCheck,
	HeartPulse,
	LayoutDashboard,
	ShieldCheck,
	Sparkles,
	Search,
	Users,
	Building2,
	AlertTriangle,
	ArrowRight,
	Activity,
	FileClock,
	Plus,
	MapPin,
	RefreshCw,
} from 'lucide-react';
import DashboardLayout, { seekerSidebar, getSidebarForRole } from '../components/DashboardLayout.jsx';
import {
	fetchDashboardProfile,
	fetchMyDonationHistory,
	fetchMyRequests,
	fetchNearbyBloodBanks,
	fetchNotifications,
} from '../services/dashboardService.js';
import { fetchMyProfile } from '../services/profileService.js';
import { useNotificationCount } from '../services/notificationCount';
import { getDashboardRoute } from '../utils/routes.js';

const quickActions = [
	{
		title: 'Find Blood',
		description: 'Search compatible blood near your location.',
		icon: Search,
		to: '/find-blood',
		button: 'Search Now',
	},
	{
		title: 'Find Nearby Donors',
		description: 'Discover active donors matching your request.',
		icon: Users,
		to: '/find-donor',
		button: 'Find Donors',
	},
	{
		title: 'Find Blood Banks',
		description: 'View nearby verified blood banks and stock.',
		icon: Building2,
		to: '/blood-banks',
		button: 'Browse Banks',
	},
	{
		title: 'Emergency Request',
		description: 'Raise an urgent request immediately.',
		icon: AlertTriangle,
		to: '/emergency-request',
		button: 'Create Request',
	},
];

const statusStyles = {
	Pending: 'bg-amber-500/10 text-amber-200 border-amber-400/20',
	Matched: 'bg-sky-500/10 text-sky-200 border-sky-400/20',
	Completed: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/20',
	Cancelled: 'bg-rose-500/10 text-rose-200 border-rose-400/20',
	PENDING: 'bg-amber-500/10 text-amber-200 border-amber-400/20',
	MATCHING: 'bg-sky-500/10 text-sky-200 border-sky-400/20',
	FULFILLED: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/20',
	ACCEPTED: 'bg-indigo-500/10 text-indigo-200 border-indigo-400/20',
	PARTIALLY_FULFILLED: 'bg-violet-500/10 text-violet-200 border-violet-400/20',
	CANCELLED: 'bg-rose-500/10 text-rose-200 border-rose-400/20',
	EXPIRED: 'bg-slate-500/10 text-slate-200 border-slate-400/20',
};

function safeRead() {
	try {
		const raw = localStorage.getItem('lifelink_user');
		return raw ? JSON.parse(raw) : null;
	} catch (_) { return null; }
}

function DashboardPage() {
	const [user, setUser] = useState(() => safeRead());
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [searchValue, setSearchValue] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [profile, setProfile] = useState({ name: 'User', bloodGroup: '—', avatar: 'U', role: 'Registered User', location: '' });
	const [stats, setStats] = useState([
		{ label: 'Active Blood Requests', value: 0, icon: FileClock, accent: 'from-rose-500 to-red-600' },
		{ label: 'Completed Requests', value: 0, icon: BookmarkCheck, accent: 'from-sky-500 to-cyan-500' },
		{ label: 'Donations Made', value: 0, icon: HeartPulse, accent: 'from-emerald-500 to-teal-500' },
		{ label: 'Saved Lives', value: 0, icon: Sparkles, accent: 'from-amber-500 to-orange-500' },
	]);
	const [recentRequests, setRecentRequests] = useState([]);
	const [nearbyBanks, setNearbyBanks] = useState([]);
	const [activity, setActivity] = useState([]);
	const unreadNotifications = useNotificationCount();

	useEffect(() => {
		function onChange() { setUser(safeRead()); }
		window.addEventListener('lifelink-auth-changed', onChange);
		return () => window.removeEventListener('lifelink-auth-changed', onChange);
	}, []);

	async function load() {
		setIsLoading(true);
		setErrorMessage('');
		try {
			const [prof, reqs, hist, notif, banks, profileRes] = await Promise.allSettled([
				fetchDashboardProfile(),
				fetchMyRequests(),
				fetchMyDonationHistory(),
				fetchNotifications(),
				fetchNearbyBloodBanks(),
				fetchMyProfile(),
			]);
			const p = prof.value || profileRes.value;
			if (p) {
				const u = p?.data?.user || p?.user || p?.data || p;
				if (u) {
					setProfile((cur) => ({
						...cur,
						name: u.name || cur.name,
						bloodGroup: u.bloodGroup || cur.bloodGroup,
						avatar: (u.name?.[0] || cur.avatar || 'U').toUpperCase(),
						role: u.role || cur.role,
						location: u.city || u.location || cur.location,
					}));
				}
			}
			const requests = reqs.value?.data?.items || reqs.value?.data || reqs.value;
			if (Array.isArray(requests)) {
				setRecentRequests(requests.slice(0, 5).map((r) => ({
					id: r._id || r.id,
					group: r.bloodGroup,
					units: r.unitsRequired || r.units,
					location: r.hospitalName || r.hospital || r.city || '—',
					status: r.status,
					date: r.createdAt ? new Date(r.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '',
				})));
				const fulfilled = requests.filter((r) => ['FULFILLED', 'Completed'].includes(r.status)).length;
				const pending = requests.filter((r) => ['PENDING', 'MATCHING', 'Pending', 'Matched'].includes(r.status)).length;
				setStats((s) => s.map((x) => {
					if (x.label === 'Active Blood Requests') return { ...x, value: pending };
					if (x.label === 'Completed Requests') return { ...x, value: fulfilled };
					return x;
				}));
			}
			const history = hist.value?.data?.items || hist.value?.data || hist.value;
			if (Array.isArray(history)) {
				const donations = history.length;
				setStats((s) => s.map((x) => {
					if (x.label === 'Donations Made') return { ...x, value: donations };
					if (x.label === 'Saved Lives') return { ...x, value: donations * 3 };
					return x;
				}));
				setActivity(history.slice(0, 5).map((h) => ({
					icon: HeartPulse,
					text: `Donation recorded for ${h.bloodGroup || ''}`.trim(),
					time: h.donationDate ? new Date(h.donationDate).toLocaleString() : '',
				})));
			}
			const banks2 = banks.value?.data || banks.value;
			if (Array.isArray(banks2) && banks2.length) {
				setNearbyBanks(banks2.slice(0, 3).map((b) => ({
					id: b._id,
					name: b.name,
					location: b.city || b.address || '',
					distance: b.distance ? `${b.distance.toFixed(1)} km` : '—',
					availability: b.availability || 'Available',
					groups: b.availableGroups || [],
				})));
			}
		} catch (e) {
			setErrorMessage('Live dashboard data is not connected yet. Showing safe demo values.');
		} finally {
			setIsLoading(false);
		}
	}

	useEffect(() => { load(); }, []);

	const filteredRequests = useMemo(() => {
		const query = searchValue.trim().toLowerCase();
		if (!query) return recentRequests;
		return recentRequests.filter((item) =>
			[item.id, item.group, item.location, item.status].some((value) => String(value || '').toLowerCase().includes(query))
		);
	}, [recentRequests, searchValue]);

	const sidebar = getSidebarForRole(user?.role) || seekerSidebar;
	const isBloodBank = user?.role === 'bloodbank' || user?.role === 'blood_bank';
	const dashboardHome = getDashboardRoute(user);

	return (
		<DashboardLayout
			user={user}
			items={sidebar}
			pageTitle="Dashboard"
			pageSubtitle="Main control center for your blood support activity"
			unreadNotifications={unreadNotifications}
			primaryAction={
				<Link to="/emergency-request" className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
					<Plus className="h-4 w-4" aria-hidden="true" /> Request Blood
				</Link>
			}
			secondaryAction={
				<button type="button" onClick={load} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10" aria-label="Refresh dashboard">
					<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
				</button>
			}
		>
			{errorMessage ? (
				<div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
					{errorMessage}
				</div>
			) : null}

			<section className="glass-card overflow-hidden rounded-[2rem] p-6 sm:p-8">
				<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
					<div>
						<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Welcome back, {profile.name}!</p>
						<h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Find the blood you need or help someone in need today.</h2>
						<p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Your dashboard keeps requests, donations, and nearby support in one secure view.</p>
					</div>
					<div className="flex flex-wrap gap-3">
						<Link to="/find-blood" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10">
							<Search className="h-4 w-4" aria-hidden="true" /> Find Blood
						</Link>
						<Link to="/emergency-request" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
							<Plus className="h-4 w-4" aria-hidden="true" /> Request Blood
						</Link>
					</div>
				</div>
			</section>

			<section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{stats.map((stat, index) => {
					const Icon = stat.icon;
					return (
						<article key={stat.label} className="glass-card rounded-[1.5rem] p-5 transition hover:-translate-y-1">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-sm text-slate-300">{stat.label}</p>
									<p className="mt-3 text-3xl font-semibold text-white">{isLoading ? '...' : stat.value}</p>
								</div>
								<div className={`rounded-2xl bg-gradient-to-br ${stat.accent} p-3 text-white shadow-lg`}>
									<Icon className="h-6 w-6" aria-hidden="true" />
								</div>
							</div>
							<div className="mt-5 h-1.5 rounded-full bg-white/10">
								<div className="h-1.5 rounded-full bg-white/30" style={{ width: `${55 + index * 10}%` }} />
							</div>
						</article>
					);
				})}
			</section>

			<section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
				<article className="glass-card rounded-[2rem] p-6 sm:p-8">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">My Blood Group</p>
							<h3 className="mt-2 text-3xl font-semibold text-white">{profile.bloodGroup || '—'}</h3>
							<p className="mt-2 text-sm text-slate-300">Compatible blood information</p>
						</div>
						<div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-100">
							<ShieldCheck className="h-8 w-8" aria-hidden="true" />
						</div>
					</div>
					<div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/40 p-5">
						<p className="text-sm text-slate-400">Update your blood group in your profile</p>
						<Link to="/profile" className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10">
							Update Blood Group
						</Link>
					</div>
				</article>

				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
					{quickActions.map((action) => {
						const Icon = action.icon;
						return (
							<article key={action.title} className="glass-card rounded-[1.5rem] p-5 transition hover:-translate-y-1 hover:border-white/20">
								<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-rose-200">
									<Icon className="h-6 w-6" aria-hidden="true" />
								</div>
								<h3 className="mt-5 text-lg font-semibold text-white">{action.title}</h3>
								<p className="mt-2 text-sm leading-6 text-slate-300">{action.description}</p>
								<Link to={action.to} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rose-200 transition hover:text-white">
									{action.button}
									<ArrowRight className="h-4 w-4" aria-hidden="true" />
								</Link>
							</article>
						);
					})}
				</div>
			</section>

			<section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
				<article className="glass-card rounded-[2rem] p-6 sm:p-8">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Recent Blood Requests</p>
							<h3 className="mt-2 text-2xl font-semibold text-white">Track your latest activity</h3>
						</div>
						<Link to="/donation-history" className="text-sm font-semibold text-rose-200 transition hover:text-white">
							View All Requests
						</Link>
					</div>
					{filteredRequests.length === 0 ? (
						<div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-center text-sm text-slate-400">
							No recent requests yet. <Link to="/request-blood" className="font-semibold text-rose-200 hover:text-white">Create your first request</Link>.
						</div>
					) : (
						<div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
							<div className="overflow-x-auto">
								<table className="min-w-full divide-y divide-white/10 text-left text-sm">
									<thead className="bg-white/5 text-slate-300">
										<tr>
											<th className="px-4 py-3 font-medium">Request ID</th>
											<th className="px-4 py-3 font-medium">Blood Group</th>
											<th className="px-4 py-3 font-medium">Units</th>
											<th className="px-4 py-3 font-medium">Location</th>
											<th className="px-4 py-3 font-medium">Status</th>
											<th className="px-4 py-3 font-medium">Date</th>
											<th className="px-4 py-3 font-medium">Action</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-white/10">
										{filteredRequests.map((request) => (
											<tr key={request.id} className="bg-slate-950/30 transition hover:bg-white/5">
												<td className="px-4 py-4 font-mono text-xs text-white">{String(request.id).slice(-8)}</td>
												<td className="px-4 py-4 text-slate-300">{request.group}</td>
												<td className="px-4 py-4 text-slate-300">{request.units}</td>
												<td className="px-4 py-4 text-slate-300">{request.location}</td>
												<td className="px-4 py-4">
													<span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[request.status] ?? 'bg-white/5 text-white border-white/10'}`}>
														{request.status}
													</span>
												</td>
												<td className="px-4 py-4 text-slate-300">{request.date}</td>
												<td className="px-4 py-4">
													<Link to={`/request-tracking/${encodeURIComponent(request.id)}`} className="text-sm font-semibold text-rose-200 transition hover:text-white">
														View
													</Link>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</article>

				<article className="glass-card rounded-[2rem] p-6 sm:p-8">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Nearby Blood Banks</p>
							<h3 className="mt-2 text-2xl font-semibold text-white">Available support near you</h3>
						</div>
						<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200">
							<MapPin className="h-5 w-5" aria-hidden="true" />
						</div>
					</div>
					{nearbyBanks.length === 0 ? (
						<div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-center text-sm text-slate-400">
							No nearby blood banks found. <Link to="/blood-banks" className="font-semibold text-rose-200 hover:text-white">Browse all blood banks</Link>.
						</div>
					) : (
						<div className="mt-6 space-y-4">
							{nearbyBanks.map((bank) => (
								<div key={bank.id || bank.name} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5 transition hover:border-white/20">
									<div className="flex items-start justify-between gap-4">
										<div>
											<h4 className="text-lg font-semibold text-white">{bank.name}</h4>
											<p className="mt-1 text-sm text-slate-400">{bank.location}</p>
										</div>
										<div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
											{bank.availability}
										</div>
									</div>
									{Array.isArray(bank.groups) && bank.groups.length > 0 && (
										<div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
											{bank.groups.map((group) => (
												<span key={group} className="rounded-full bg-white/5 px-3 py-1">{group}</span>
											))}
										</div>
									)}
									<div className="mt-5 flex items-center justify-between gap-3">
										<p className="text-sm text-slate-400">{bank.distance !== '—' ? `Distance: ${bank.distance}` : ''}</p>
										<Link to={`/blood-banks/${bank.id || ''}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5">
											View Details
										</Link>
									</div>
								</div>
							))}
						</div>
					)}
				</article>
			</section>

			<section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.9fr]">
				<article className="glass-card overflow-hidden rounded-[2rem] border-rose-400/20 bg-gradient-to-br from-rose-500/15 via-red-500/10 to-slate-900 p-6 sm:p-8">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Emergency Alert</p>
							<h3 className="mt-2 text-3xl font-semibold text-white">Need Blood Urgently?</h3>
							<p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/90 sm:text-base">Submit an emergency blood request and find nearby matching blood resources.</p>
						</div>
						<Link to="/emergency-request" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-rose-100">
							<AlertTriangle className="h-4 w-4" aria-hidden="true" /> Create Emergency Request
						</Link>
					</div>
				</article>

				<article className="glass-card rounded-[2rem] p-6 sm:p-8">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Recent Activity</p>
							<h3 className="mt-2 text-2xl font-semibold text-white">Latest actions</h3>
						</div>
						<div className="rounded-2xl bg-white/5 p-3 text-slate-200">
							<Activity className="h-5 w-5" aria-hidden="true" />
						</div>
					</div>
					{activity.length === 0 ? (
						<div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-950/40 p-6 text-center text-sm text-slate-400">No recent activity yet.</div>
					) : (
						<div className="mt-6 space-y-4">
							{activity.map((item, idx) => {
								const Icon = item.icon;
								return (
									<div key={`${item.text}-${idx}`} className="flex items-start gap-4 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
										<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-rose-200">
											<Icon className="h-5 w-5" aria-hidden="true" />
										</div>
										<div>
											<p className="text-sm font-medium text-white">{item.text}</p>
											<p className="mt-1 text-xs text-slate-400">{item.time}</p>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</article>
			</section>
		</DashboardLayout>
	);
}

export default DashboardPage;
