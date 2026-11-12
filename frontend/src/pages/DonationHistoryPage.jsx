import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
	AlertTriangle,
	ArrowDownToLine,
	Calendar,
	CalendarCheck,
	CalendarClock,
	CheckCircle2,
	ChevronDown,
	Clock3,
	Droplet,
	Filter,
	Heart,
	HeartHandshake,
	Hospital,
	LoaderCircle,
	MapPin,
	Pause,
	Plus,
	Search,
	ShieldCheck,
	Sparkles,
	TrendingUp,
	User,
	X,
} from 'lucide-react';
import DashboardLayout, { donorSidebar } from '../components/DashboardLayout';
import { useNotificationCount } from '../services/notificationCount';
import {
	cancelDonation,
	exportDonations,
	fetchDonationById,
	fetchDonationEligibility,
	fetchDonationStatistics,
	fetchMyDonationHistory,
	fetchUpcomingDonation,
	isDonationApiConfigured,
	recordDonation,
} from '../services/donationService';

const STATUS_FILTERS = [
	{ value: 'all', label: 'All' },
	{ value: 'COMPLETED', label: 'Completed' },
	{ value: 'SCHEDULED', label: 'Scheduled' },
	{ value: 'CANCELLED', label: 'Cancelled' },
];

const MIN_INTERVAL_DAYS = 90;

function readUser() {
	try {
		const raw = localStorage.getItem('lifelink_user');
		return raw ? JSON.parse(raw) : null;
	} catch (_) {
		return null;
	}
}

function getCurrentUser() {
	return readUser() || { name: 'Donor', role: 'donor', email: '' };
}

function formatDate(value) {
	if (!value) return '—';
	try {
		const d = new Date(value);
		return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
	} catch (_) {
		return value;
	}
}

function daysBetween(a, b) {
	const ms = new Date(b).getTime() - new Date(a).getTime();
	return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function nextEligible(lastDonationDate, intervalDays = MIN_INTERVAL_DAYS) {
	if (!lastDonationDate) return null;
	const d = new Date(lastDonationDate);
	d.setDate(d.getDate() + intervalDays);
	return d.toISOString();
}

function buildDemoHistory() {
	const today = new Date();
	const mk = (offsetDays, bloodBank, location, type, status) => {
		const d = new Date(today);
		d.setDate(d.getDate() - offsetDays);
		return {
			id: `DON-${(2026000 + offsetDays).toString()}`,
			donationDate: d.toISOString(),
			bloodGroup: 'O+',
			bloodBankName: bloodBank,
			bloodBankId: `BB-${bloodBank.replace(/\s/g, '').toLowerCase()}`,
			location,
			donationType: type,
			units: 1,
			status,
		};
	};
	return [
		mk(60, 'City Central Blood Bank', 'Anantapur', 'Whole Blood', 'COMPLETED'),
		mk(150, 'Lifeline Blood Center', 'Anantapur', 'Whole Blood', 'COMPLETED'),
		mk(240, 'MetroCare Blood Bank', 'Anantapur', 'Plasma', 'COMPLETED'),
		mk(330, 'Hope Regional Blood Bank', 'Anantapur', 'Whole Blood', 'COMPLETED'),
		mk(420, 'Sunrise Blood Bank', 'Anantapur', 'Whole Blood', 'COMPLETED'),
	];
}

function buildDemoStatistics() {
	return {
		totalDonations: 12,
		livesHelped: 36,
		donationStreak: 3,
		lastDonationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
		nextEligibleDate: nextEligible(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)),
		totalUnits: 14,
		byMonth: [
			{ month: 'May', count: 1 },
			{ month: 'Jun', count: 1 },
			{ month: 'Jul', count: 2 },
			{ month: 'Aug', count: 2 },
			{ month: 'Sep', count: 0 },
		],
	};
}

function buildDemoUpcoming() {
	return null;
}

function statusTone(status) {
	if (status === 'COMPLETED') return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200';
	if (status === 'SCHEDULED') return 'border-sky-400/20 bg-sky-500/10 text-sky-200';
	if (status === 'CANCELLED') return 'border-slate-400/20 bg-slate-500/10 text-slate-300';
	return 'border-white/10 bg-white/5 text-slate-200';
}

export default function DonationHistoryPage() {
	const navigate = useNavigate();
	const params = useParams();
	const detailId = params.id;
	const unreadBell = useNotificationCount();
	const [user, setUser] = useState(() => getCurrentUser());
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [history, setHistory] = useState([]);
	const [statistics, setStatistics] = useState(null);
	const [eligibility, setEligibility] = useState(null);
	const [upcoming, setUpcoming] = useState(null);
	const [search, setSearch] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [sort, setSort] = useState('newest');
	const [page, setPage] = useState(1);
	const [pageSize] = useState(8);
	const [selectedDonation, setSelectedDonation] = useState(null);
	const [recordOpen, setRecordOpen] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [exportMessage, setExportMessage] = useState('');
	const apiReady = isDonationApiConfigured();

	useEffect(() => {
		if (!user) setUser(getCurrentUser());
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function load() {
		setLoading(true);
		setError('');
		try {
			if (apiReady) {
				const [hist, stats, elig, up] = await Promise.allSettled([
					fetchMyDonationHistory({ page: 1, limit: 100 }),
					fetchDonationStatistics(),
					fetchDonationEligibility(),
					fetchUpcomingDonation(),
				]);
				if (hist.status === 'fulfilled') setHistory(hist.value?.data?.items || []);
				if (stats.status === 'fulfilled') setStatistics(stats.value?.data || null);
				if (elig.status === 'fulfilled') setEligibility(elig.value?.data || null);
				if (up.status === 'fulfilled') setUpcoming(up.value?.data || null);
			} else {
				setHistory(buildDemoHistory());
				setStatistics(buildDemoStatistics());
				setEligibility({
					eligible: false,
					lastDonationDate: buildDemoStatistics().lastDonationDate,
					nextEligibleDate: buildDemoStatistics().nextEligibleDate,
					daysRemaining: 30,
				});
				setUpcoming(buildDemoUpcoming());
			}
		} catch (_) {
			setError('Unable to load donation history.');
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		if (!detailId) return;
		if (apiReady) {
			fetchDonationById(detailId)
				.then((res) => {
					if (res?.data) setSelectedDonation(normalizeDonation(res.data));
				})
				.catch(() => {});
		} else {
			const local = history.find((d) => d.id === detailId || d._id === detailId);
			if (local) setSelectedDonation(local);
		}
	}, [detailId, apiReady, history]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		let list = history.filter((d) => {
			const status = (d.status || '').toUpperCase();
			if (statusFilter !== 'all' && status !== statusFilter) return false;
			if (!q) return true;
			return [d.id, d._id, d.bloodBankName, d.location, d.donationType, d.bloodGroup]
				.filter(Boolean)
				.some((v) => String(v).toLowerCase().includes(q));
		});
		list = [...list].sort((a, b) => {
			const ad = new Date(a.donationDate).getTime();
			const bd = new Date(b.donationDate).getTime();
			return sort === 'oldest' ? ad - bd : bd - ad;
		});
		return list;
	}, [history, search, statusFilter, sort]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
	const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

	useEffect(() => {
		if (page > totalPages) setPage(1);
	}, [totalPages, page]);

	const headerActions = (
		<div className="flex flex-wrap items-center gap-2">
			<button
				type="button"
				onClick={async () => {
					setExporting(true);
					setExportMessage('');
					try {
						const res = await exportDonations('pdf');
						setExportMessage(res?.message || 'Export ready');
					} catch (_) {
						setExportMessage('Export is not available right now.');
					} finally {
						setExporting(false);
						window.setTimeout(() => setExportMessage(''), 4000);
					}
				}}
				disabled={exporting}
				className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
			>
				{exporting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />}
				Download History
			</button>
			<button
				type="button"
				onClick={() => setRecordOpen(true)}
				className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:-translate-y-0.5"
			>
				<Plus className="h-4 w-4" aria-hidden="true" /> Record Donation
			</button>
		</div>
	);

	return (
		<DashboardLayout
			user={user}
			items={donorSidebar}
			pageTitle="Donation History"
			pageSubtitle="Track your blood donations and make a difference in someone's life."
			primaryAction={headerActions}
			unreadNotifications={unreadBell}
		>
			{loading ? (
				<DonationSkeleton />
			) : error ? (
				<ErrorState onRetry={load} message={error} />
			) : (
				<div className="space-y-6">
					{exportMessage ? (
						<div className="glass-card flex items-center gap-3 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-sm text-sky-100">
							<ArrowDownToLine className="h-4 w-4" aria-hidden="true" /> {exportMessage}
						</div>
					) : null}

					<SummaryGrid statistics={statistics} />

					<div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
						<EligibilityCard eligibility={eligibility} onFind={() => navigate('/find-blood')} />
						<UpcomingDonationCard upcoming={upcoming} onCancel={async (id) => {
							try { await cancelDonation(id); setUpcoming(null); } catch (_) {}
						}} />
					</div>

					{history.length === 0 ? (
						<EmptyState onFind={() => navigate('/find-blood')} onLearn={() => navigate('/about')} />
					) : (
						<HistorySection
							filtered={filtered}
							pageItems={pageItems}
							search={search}
							setSearch={setSearch}
							statusFilter={statusFilter}
							setStatusFilter={setStatusFilter}
							sort={sort}
							setSort={setSort}
							page={page}
							totalPages={totalPages}
							setPage={setPage}
							onView={(d) => { setSelectedDonation(d); navigate(`/donation-history/${d.id || d._id}`); }}
						/>
					)}

					<ImpactSection statistics={statistics} />

					<DonationTimeline history={history} upcoming={upcoming} />
				</div>
			)}

			{selectedDonation ? (
				<DonationDetailsModal donation={selectedDonation} onClose={() => { setSelectedDonation(null); navigate('/donation-history'); }} />
			) : null}

			{recordOpen ? (
				<RecordDonationModal
					onClose={() => setRecordOpen(false)}
					onSubmit={async (payload) => {
						try {
							const res = await recordDonation(payload);
							const donation = res?.data?.donation || res?.data;
							if (donation) {
								setHistory((current) => [normalizeDonation(donation), ...current]);
							}
							setRecordOpen(false);
						} catch (_) {
							setRecordOpen(false);
						}
					}}
				/>
			) : null}
		</DashboardLayout>
	);
}

function SummaryGrid({ statistics }) {
	const items = [
		{ icon: Heart, label: 'Total Donations', value: statistics?.totalDonations ?? 0, sub: 'Lifetime donations', tone: 'text-rose-200' },
		{ icon: HeartHandshake, label: 'Lives Potentially Helped', value: statistics?.livesHelped ?? (statistics?.totalDonations || 0) * 3, sub: 'Estimated impact', tone: 'text-emerald-200' },
		{ icon: CalendarClock, label: 'Last Donation', value: formatDate(statistics?.lastDonationDate), sub: statistics?.nextEligibleDate ? `Next eligible date: ${formatDate(statistics.nextEligibleDate)}` : 'No prior donation', tone: 'text-amber-200' },
		{ icon: TrendingUp, label: 'Donation Streak', value: statistics?.donationStreak ?? 0, sub: 'Consecutive donations', tone: 'text-sky-200' },
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
						<p className="mt-1 text-sm font-medium text-slate-200">{item.label}</p>
						<p className="mt-1 text-xs text-slate-400">{item.sub}</p>
					</article>
				);
			})}
		</div>
	);
}

function EligibilityCard({ eligibility, onFind }) {
	const eligible = eligibility?.eligible ?? (eligibility?.daysRemaining === 0 || eligibility?.daysRemaining == null);
	const last = eligibility?.lastDonationDate;
	const next = eligibility?.nextEligibleDate;
	const remaining = eligibility?.daysRemaining;
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center gap-3">
				<div className={`rounded-2xl p-3 ${eligible ? 'bg-emerald-500/10 text-emerald-200' : 'bg-amber-500/10 text-amber-200'}`}>
					<ShieldCheck className="h-5 w-5" aria-hidden="true" />
				</div>
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Eligibility</p>
					<h2 className="mt-1 text-2xl font-semibold text-white">Donation Eligibility</h2>
				</div>
			</div>
			<div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${eligible ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/30 bg-amber-500/10 text-amber-200'}`}>
						{eligible ? <><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Eligible to Donate</> : <><Pause className="h-4 w-4" aria-hidden="true" /> Not Yet Eligible</>}
					</span>
					<p className="mt-4 text-sm leading-7 text-slate-300">
						{eligible
							? 'You are eligible to donate again. Find a blood bank to schedule your next donation.'
							: remaining != null
								? `You are eligible to donate again in ${remaining} day${remaining === 1 ? '' : 's'}.`
								: 'You can check eligibility once a donation is recorded.'}
					</p>
				</div>
				<div className="grid gap-2 text-sm sm:grid-cols-2">
					<InfoLine label="Last donation" value={formatDate(last)} />
					<InfoLine label="Next eligible" value={formatDate(next)} />
				</div>
			</div>
			<div className="mt-6 flex flex-wrap gap-3">
				<button type="button" onClick={onFind} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:-translate-y-0.5">
					<Search className="h-4 w-4" aria-hidden="true" /> Find a Blood Bank
				</button>
			</div>
			<p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
				<AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Eligibility depends on current health conditions and screening by the blood bank or healthcare professional.
			</p>
		</section>
	);
}

function UpcomingDonationCard({ upcoming, onCancel }) {
	const [confirmOpen, setConfirmOpen] = useState(false);
	if (!upcoming) {
		return (
			<section className="glass-card rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-center gap-3">
					<div className="rounded-2xl bg-sky-500/10 p-3 text-sky-200"><Calendar className="h-5 w-5" aria-hidden="true" /></div>
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200/80">Upcoming</p>
						<h2 className="mt-1 text-2xl font-semibold text-white">No upcoming donations</h2>
					</div>
				</div>
				<p className="mt-4 text-sm leading-7 text-slate-300">You have no scheduled donations. Find a blood bank to book your next appointment.</p>
				<Link to="/find-blood" className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
					Find a Blood Bank
				</Link>
			</section>
		);
	}
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center gap-3">
				<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200"><CalendarCheck className="h-5 w-5" aria-hidden="true" /></div>
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Upcoming</p>
					<h2 className="mt-1 text-2xl font-semibold text-white">Upcoming Donation</h2>
				</div>
			</div>
			<div className="mt-5 grid gap-2 text-sm">
				<InfoLine label="Blood bank" value={upcoming.bloodBankName || '—'} />
				<InfoLine label="Date" value={formatDate(upcoming.appointmentDate || upcoming.donationDate)} />
				<InfoLine label="Time" value={upcoming.appointmentTime || '—'} />
				<InfoLine label="Location" value={upcoming.location || '—'} />
				<InfoLine label="Status" value={upcoming.status || 'Scheduled'} />
			</div>
			<div className="mt-6 flex flex-wrap gap-3">
				<button type="button" onClick={() => {}} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-rose-100">
					View Appointment
				</button>
				<button type="button" onClick={() => setConfirmOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/20">
					Cancel Appointment
				</button>
			</div>
			{confirmOpen ? (
				<ConfirmModal
					title="Cancel this appointment?"
					message="Are you sure you want to cancel your upcoming donation? This action cannot be undone."
					confirmLabel="Cancel Appointment"
					onClose={() => setConfirmOpen(false)}
					onConfirm={async () => { await onCancel(upcoming.id || upcoming._id); setConfirmOpen(false); }}
				/>
			) : null}
		</section>
	);
}

function HistorySection({ filtered, pageItems, search, setSearch, statusFilter, setStatusFilter, sort, setSort, page, totalPages, setPage, onView }) {
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Donations</p>
					<h2 className="mt-1 text-2xl font-semibold text-white">Your Donations</h2>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-200" aria-hidden="true" />
						<input
							className="field-input pl-10"
							placeholder="Search donations..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							aria-label="Search donations"
						/>
					</div>
					<div className="relative">
						<select
							className="field-input pr-8"
							value={sort}
							onChange={(e) => setSort(e.target.value)}
							aria-label="Sort donations"
						>
							<option value="newest">Newest first</option>
							<option value="oldest">Oldest first</option>
						</select>
					</div>
				</div>
			</div>

			<div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Status filter">
				{STATUS_FILTERS.map((opt) => (
					<button
						key={opt.value}
						type="button"
						role="tab"
						aria-selected={statusFilter === opt.value}
						onClick={() => setStatusFilter(opt.value)}
						className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${statusFilter === opt.value ? 'border-rose-400/40 bg-rose-500/15 text-white' : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/20'}`}
					>
						{opt.label}
					</button>
				))}
			</div>

			{filtered.length === 0 ? (
				<div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-950/30 px-4 py-10 text-center text-sm text-slate-300">
					No donations match the current filters.
				</div>
			) : (
				<>
					{/* Desktop table */}
					<div className="mt-6 hidden overflow-hidden rounded-2xl border border-white/10 md:block">
						<table className="w-full text-left text-sm">
							<thead className="bg-white/5 text-xs uppercase tracking-[0.25em] text-slate-400">
								<tr>
									<th className="px-4 py-3">Donation ID</th>
									<th className="px-4 py-3">Date</th>
									<th className="px-4 py-3">Blood Bank</th>
									<th className="px-4 py-3">Location</th>
									<th className="px-4 py-3">Type</th>
									<th className="px-4 py-3">Units</th>
									<th className="px-4 py-3">Status</th>
									<th className="px-4 py-3 text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/5 bg-slate-950/30">
								{pageItems.map((d) => {
									const status = (d.status || '').toUpperCase();
									return (
										<tr key={d.id || d._id} className="text-slate-200 transition hover:bg-white/5">
											<td className="px-4 py-3 font-mono text-xs text-white">{d.id || d._id}</td>
											<td className="px-4 py-3">{formatDate(d.donationDate)}</td>
											<td className="px-4 py-3">{d.bloodBankName || '—'}</td>
											<td className="px-4 py-3 text-slate-400">{d.location || '—'}</td>
											<td className="px-4 py-3">{d.donationType || '—'}</td>
											<td className="px-4 py-3">{d.units || 1} unit{Number(d.units) > 1 ? 's' : ''}</td>
											<td className="px-4 py-3">
												<span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusTone(status)}`}>
													{status || 'Unknown'}
												</span>
											</td>
											<td className="px-4 py-3 text-right">
												<button type="button" onClick={() => onView(d)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10">
													View Details
												</button>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{/* Mobile cards */}
					<div className="mt-6 grid gap-3 md:hidden">
						{pageItems.map((d) => {
							const status = (d.status || '').toUpperCase();
							return (
								<article key={d.id || d._id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
									<div className="flex items-center justify-between">
										<p className="font-mono text-xs text-white">{d.id || d._id}</p>
										<span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusTone(status)}`}>
											{status || 'Unknown'}
										</span>
									</div>
									<dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
										<InfoLine label="Date" value={formatDate(d.donationDate)} />
										<InfoLine label="Blood bank" value={d.bloodBankName || '—'} />
										<InfoLine label="Location" value={d.location || '—'} />
										<InfoLine label="Type" value={d.donationType || '—'} />
										<InfoLine label="Units" value={`${d.units || 1}`} />
									</dl>
									<button type="button" onClick={() => onView(d)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10">
										View Details
									</button>
								</article>
							);
						})}
					</div>

					<Pagination page={page} totalPages={totalPages} setPage={setPage} total={filtered.length} />
				</>
			)}
		</section>
	);
}

function Pagination({ page, totalPages, setPage, total }) {
	if (totalPages <= 1) return null;
	return (
		<div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
			<p className="text-sm text-slate-400">Page {page} of {totalPages} · {total} record{total === 1 ? '' : 's'}</p>
			<div className="flex gap-2">
				<button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
					Previous
				</button>
				<button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
					Next
				</button>
			</div>
		</div>
	);
}

function ImpactSection({ statistics }) {
	const byMonth = statistics?.byMonth || [];
	const max = Math.max(1, ...byMonth.map((m) => m.count || 0));
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center gap-3">
				<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200"><HeartHandshake className="h-5 w-5" aria-hidden="true" /></div>
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Impact</p>
					<h2 className="mt-1 text-2xl font-semibold text-white">Your Impact</h2>
				</div>
			</div>
			<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<Metric icon={Heart} label="Total donations" value={statistics?.totalDonations ?? 0} tone="rose" />
				<Metric icon={Droplet} label="Total units donated" value={statistics?.totalUnits ?? (statistics?.totalDonations || 0)} tone="amber" />
				<Metric icon={Calendar} label="Appointments" value={statistics?.totalDonations ?? 0} tone="sky" />
				<Metric icon={HeartHandshake} label="Lives impacted" value={statistics?.livesHelped ?? (statistics?.totalDonations || 0) * 3} tone="emerald" />
			</div>
			{byMonth.length > 0 ? (
				<div className="mt-6">
					<p className="text-sm font-medium text-slate-200">Donations by month</p>
					<div className="mt-3 flex h-40 items-end gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
						{byMonth.map((m) => (
							<div key={m.month} className="flex flex-1 flex-col items-center gap-2">
								<div
									className="w-full rounded-t-2xl bg-gradient-to-t from-rose-500/40 to-rose-500"
									style={{ height: `${Math.max(6, ((m.count || 0) / max) * 100)}%` }}
									aria-label={`${m.count} donations in ${m.month}`}
								/>
								<span className="text-xs text-slate-400">{m.month}</span>
							</div>
						))}
					</div>
				</div>
			) : null}
		</section>
	);
}

function Metric({ icon: Icon, label, value, tone }) {
	const tones = {
		rose: 'border-rose-400/20 bg-rose-500/10 text-rose-200',
		amber: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
		sky: 'border-sky-400/20 bg-sky-500/10 text-sky-200',
		emerald: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
	};
	return (
		<div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
			<div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${tones[tone] || ''}`}>
				<Icon className="h-5 w-5" aria-hidden="true" />
			</div>
			<p className="mt-4 text-3xl font-semibold text-white">{value}</p>
			<p className="mt-1 text-sm text-slate-400">{label}</p>
		</div>
	);
}

const TIMELINE_STAGES = [
	{ id: 'scheduled', label: 'Appointment Scheduled', icon: Calendar },
	{ id: 'arrived', label: 'Arrived at Blood Bank', icon: Hospital },
	{ id: 'screening', label: 'Health Screening', icon: ShieldCheck },
	{ id: 'donated', label: 'Donation Completed', icon: Droplet },
	{ id: 'processed', label: 'Donation Processed', icon: Sparkles },
];

function DonationTimeline({ history, upcoming }) {
	const latest = history.filter((d) => (d.status || '').toUpperCase() === 'COMPLETED')[0];
	const baseStages = upcoming ? ['scheduled'] : ['scheduled', 'arrived', 'screening', 'donated', 'processed'];
	const reached = latest ? baseStages.length : upcoming ? 1 : 0;
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center gap-3">
				<div className="rounded-2xl bg-sky-500/10 p-3 text-sky-200"><Clock3 className="h-5 w-5" aria-hidden="true" /></div>
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200/80">Journey</p>
					<h2 className="mt-1 text-2xl font-semibold text-white">Donation Journey</h2>
				</div>
			</div>
			<ol className="mt-6 grid gap-3 sm:grid-cols-5">
				{TIMELINE_STAGES.map((stage, idx) => {
					const Icon = stage.icon;
					const isReached = idx < reached;
					const isCurrent = idx === reached - 1;
					return (
						<li key={stage.id} className={`relative flex flex-col gap-2 rounded-2xl border p-4 ${isCurrent ? 'border-rose-400/40 bg-rose-500/10' : isReached ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-white/10 bg-slate-950/40'}`}>
							<div className="flex items-center gap-2">
								<span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${isReached ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/5 text-slate-400'}`}>
									<Icon className="h-4 w-4" aria-hidden="true" />
								</span>
								{isCurrent ? <span className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-100">Active</span> : null}
							</div>
							<p className="text-sm font-semibold text-white">{stage.label}</p>
						</li>
					);
				})}
			</ol>
			<p className="mt-4 text-xs text-slate-400">Screening results and sensitive health information are not shown here. The blood bank or healthcare professional manages clinical details.</p>
		</section>
	);
}

function DonationDetailsModal({ donation, onClose }) {
	return (
		<div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="donation-details-title">
			<div className="glass-card w-full max-w-2xl rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Donation details</p>
						<h3 id="donation-details-title" className="mt-1 text-2xl font-semibold text-white">{donation.id || donation._id}</h3>
					</div>
					<button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10" aria-label="Close donation details">
						<X className="h-5 w-5" aria-hidden="true" />
					</button>
				</div>

				<div className="mt-6 space-y-5">
					<div>
						<h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Donation information</h4>
						<dl className="mt-3 grid gap-2 sm:grid-cols-2">
							<InfoLine label="Donation ID" value={donation.id || donation._id} />
							<InfoLine label="Donation date" value={formatDate(donation.donationDate)} />
							<InfoLine label="Donation type" value={donation.donationType || 'Whole Blood'} />
							<InfoLine label="Units donated" value={`${donation.units || 1} unit${Number(donation.units) > 1 ? 's' : ''}`} />
							<InfoLine label="Status" value={donation.status || '—'} />
							<InfoLine label="Blood group" value={donation.bloodGroup || '—'} />
						</dl>
					</div>

					<div>
						<h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Blood bank information</h4>
						<dl className="mt-3 grid gap-2 sm:grid-cols-2">
							<InfoLine label="Blood bank" value={donation.bloodBankName || '—'} />
							<InfoLine label="City / location" value={donation.location || '—'} />
							{donation.address ? <InfoLine label="Address" value={donation.address} /> : null}
						</dl>
					</div>

					{donation.appointmentDate || donation.appointmentTime ? (
						<div>
							<h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">Appointment information</h4>
							<dl className="mt-3 grid gap-2 sm:grid-cols-2">
								<InfoLine label="Appointment date" value={formatDate(donation.appointmentDate)} />
								<InfoLine label="Appointment time" value={donation.appointmentTime || '—'} />
								{donation.checkInTime ? <InfoLine label="Check-in time" value={donation.checkInTime} /> : null}
								{donation.completionTime ? <InfoLine label="Completion time" value={donation.completionTime} /> : null}
							</dl>
						</div>
					) : null}

					<div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
						<HeartHandshake className="mr-2 inline h-4 w-4" aria-hidden="true" /> Your donation may help multiple patients depending on how the donated blood is processed and used.
					</div>
				</div>
			</div>
		</div>
	);
}

function RecordDonationModal({ onClose, onSubmit }) {
	const [submitting, setSubmitting] = useState(false);
	const [form, setForm] = useState({
		bloodBankName: '',
		location: '',
		donationType: 'Whole Blood',
		donationDate: new Date().toISOString().slice(0, 10),
		units: 1,
		notes: '',
	});
	function update(k, v) { setForm((c) => ({ ...c, [k]: v })); }
	async function submit(e) {
		e.preventDefault();
		setSubmitting(true);
		try {
			await onSubmit({ ...form, units: Number(form.units) || 1, status: 'COMPLETED' });
		} finally {
			setSubmitting(false);
		}
	}
	return (
		<div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="record-title">
			<form onSubmit={submit} className="glass-card w-full max-w-xl rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Record</p>
						<h3 id="record-title" className="mt-1 text-2xl font-semibold text-white">Record a donation</h3>
						<p className="mt-1 text-xs text-slate-400">Use this to add a donation completed outside LifeLink. The record will appear in your donation history.</p>
					</div>
					<button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10" aria-label="Close record modal">
						<X className="h-5 w-5" aria-hidden="true" />
					</button>
				</div>
				<div className="mt-5 grid gap-4 sm:grid-cols-2">
					<FormField label="Blood bank">
						<input className="field-input" value={form.bloodBankName} onChange={(e) => update('bloodBankName', e.target.value)} required />
					</FormField>
					<FormField label="Location">
						<input className="field-input" value={form.location} onChange={(e) => update('location', e.target.value)} required />
					</FormField>
					<FormField label="Donation type">
						<select className="field-input" value={form.donationType} onChange={(e) => update('donationType', e.target.value)}>
							{['Whole Blood', 'Plasma', 'Platelets', 'Power Red'].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
						</select>
					</FormField>
					<FormField label="Units">
						<input className="field-input" type="number" min={1} max={4} value={form.units} onChange={(e) => update('units', e.target.value)} />
					</FormField>
					<FormField label="Donation date">
						<input className="field-input" type="date" value={form.donationDate} onChange={(e) => update('donationDate', e.target.value)} required />
					</FormField>
				</div>
				<div className="mt-4">
					<FormField label="Notes">
						<textarea className="field-input min-h-[80px]" value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Optional notes" />
					</FormField>
				</div>
				<div className="mt-6 flex flex-wrap justify-end gap-3">
					<button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Cancel</button>
					<button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
						{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />} Save donation
					</button>
				</div>
			</form>
		</div>
	);
}

function ConfirmModal({ title, message, confirmLabel, onClose, onConfirm }) {
	const [busy, setBusy] = useState(false);
	return (
		<div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true">
			<div className="glass-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-start gap-3">
					<div className="rounded-2xl bg-rose-500/15 p-3 text-rose-200"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></div>
					<div>
						<h3 className="text-xl font-semibold text-white">{title}</h3>
						<p className="mt-2 text-sm text-slate-300">{message}</p>
					</div>
				</div>
				<div className="mt-6 flex flex-wrap justify-end gap-3">
					<button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Keep</button>
					<button type="button" onClick={async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } }} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
						{busy ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null} {confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

function EmptyState({ onFind, onLearn }) {
	return (
		<section className="glass-card rounded-[2rem] p-8 text-center sm:p-10">
			<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-200">
				<Droplet className="h-8 w-8" aria-hidden="true" />
			</div>
			<h2 className="mt-6 text-2xl font-semibold text-white">No donations yet</h2>
			<p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-300">Your first donation could help someone in need. Find a nearby blood bank and start your donation journey.</p>
			<div className="mt-6 flex flex-wrap justify-center gap-3">
				<button type="button" onClick={onFind} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">Find a Blood Bank</button>
				<button type="button" onClick={onLearn} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Learn About Blood Donation</button>
			</div>
		</section>
	);
}

function ErrorState({ onRetry, message }) {
	return (
		<section className="glass-card rounded-[2rem] p-8 text-center sm:p-10">
			<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-200"><AlertTriangle className="h-8 w-8" aria-hidden="true" /></div>
			<h2 className="mt-6 text-2xl font-semibold text-white">Unable to load donation history</h2>
			<p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-300">Something went wrong while retrieving your donation records. Please try again.</p>
			<button type="button" onClick={onRetry} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">Retry</button>
			{message ? <p className="sr-only">{message}</p> : null}
		</section>
	);
}

function DonationSkeleton() {
	return (
		<div className="space-y-6">
			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="glass-card h-28 animate-pulse rounded-3xl" />)}
			</div>
			<div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
				<div className="glass-card h-56 animate-pulse rounded-[2rem]" />
				<div className="glass-card h-56 animate-pulse rounded-[2rem]" />
			</div>
			<div className="glass-card h-80 animate-pulse rounded-[2rem]" />
		</div>
	);
}

function InfoLine({ label, value }) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
			<dt className="text-sm text-slate-400">{label}</dt>
			<dd className="text-right text-sm font-medium text-white">{value || '—'}</dd>
		</div>
	);
}

function FormField({ label, children }) {
	return (
		<label className="block">
			<span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
			{children}
		</label>
	);
}

function normalizeDonation(raw) {
	if (!raw) return null;
	return {
		id: raw._id || raw.id,
		donationDate: raw.donationDate || raw.date,
		bloodGroup: raw.bloodGroup,
		bloodBankName: raw.bloodBankName || (raw.bloodBankId && raw.bloodBankId.name),
		bloodBankId: typeof raw.bloodBankId === 'object' ? raw.bloodBankId?._id : raw.bloodBankId,
		location: raw.location,
		address: raw.address,
		donationType: raw.donationType || 'Whole Blood',
		units: raw.units || 1,
		status: raw.status || 'COMPLETED',
		appointmentDate: raw.appointmentDate,
		appointmentTime: raw.appointmentTime,
		checkInTime: raw.checkInTime,
		completionTime: raw.completionTime,
	};
}
