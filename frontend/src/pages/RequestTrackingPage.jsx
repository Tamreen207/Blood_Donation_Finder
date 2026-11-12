import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	BadgeCheck,
	Banknote,
	Bell,
	BellRing,
	Building2,
	Calendar,
	CalendarClock,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock3,
	Droplet,
	Droplets,
	Filter,
	HeartHandshake,
	Hospital,
	LoaderCircle,
	MapPin,
	MessageCircle,
	Navigation2,
	Phone,
	RefreshCcw,
	Search,
	ShieldCheck,
	Siren,
	Sparkles,
	Trash2,
	User,
	Users,
	X,
} from 'lucide-react';
import MapPlaceholder from '../components/MapPlaceholder';
import {
	cancelRequest,
	fetchRequestActivity,
	fetchRequestById,
	fetchRequestMatches,
	fetchRequestResponses,
	fetchRequestStatus,
	isBloodRequestApiConfigured,
} from '../services/requestService';

export default function RequestTrackingPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [notFound, setNotFound] = useState(false);
	const [request, setRequest] = useState(null);
	const [statusInfo, setStatusInfo] = useState(null);
	const [matches, setMatches] = useState([]);
	const [responses, setResponses] = useState([]);
	const [activity, setActivity] = useState([]);
	const [refreshing, setRefreshing] = useState(false);
	const [cancelOpen, setCancelOpen] = useState(false);
	const [cancelling, setCancelling] = useState(false);
	const [cancelError, setCancelError] = useState('');
	const [detailsOpen, setDetailsOpen] = useState(true);

	const apiReady = isBloodRequestApiConfigured();

	async function load({ silent = false } = {}) {
		if (!silent) setLoading(true);
		setError('');
		setNotFound(false);
		try {
			if (apiReady) {
				const data = await fetchRequestById(id);
				if (data && data.success && data.data) {
					setRequest(normalizeRequest(data.data));
				} else {
					setNotFound(true);
					return;
				}
				const [status, mt, rs, act] = await Promise.allSettled([
					fetchRequestStatus(id),
					fetchRequestMatches(id),
					fetchRequestResponses(id),
					fetchRequestActivity(id),
				]);
				if (status.status === 'fulfilled' && status.value?.data) setStatusInfo(status.value.data);
				if (mt.status === 'fulfilled' && Array.isArray(mt.value?.data)) setMatches(mt.value.data);
				else if (mt.status === 'fulfilled' && Array.isArray(mt.value)) setMatches(mt.value);
				if (rs.status === 'fulfilled' && Array.isArray(rs.value?.data)) setResponses(rs.value.data);
				else if (rs.status === 'fulfilled' && Array.isArray(rs.value)) setResponses(rs.value);
				if (act.status === 'fulfilled' && Array.isArray(act.value?.data)) setActivity(act.value.data);
				else if (act.status === 'fulfilled' && Array.isArray(act.value)) setActivity(act.value);
			} else {
				const demo = buildDemoRequest(id);
				if (!demo) {
					setNotFound(true);
					return;
				}
				setRequest(demo);
				setStatusInfo({ status: demo.status });
				setMatches(demo.demoMatches);
				setResponses(demo.demoResponses);
				setActivity(demo.demoActivity);
			}
		} catch (err) {
			if (err?.status === 404 || err?.code === 'NOT_FOUND') {
				setNotFound(true);
			} else {
				setError('Unable to load request information.');
			}
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	async function handleRefresh() {
		setRefreshing(true);
		await load({ silent: true });
	}

	async function handleCancel() {
		setCancelling(true);
		setCancelError('');
		try {
			if (apiReady) {
				await cancelRequest(id);
			}
			setRequest((current) => (current ? { ...current, status: 'CANCELLED' } : current));
			setCancelOpen(false);
		} catch (_) {
			setCancelError('Unable to cancel the request. Please try again.');
		} finally {
			setCancelling(false);
		}
	}

	if (loading) return <TrackingSkeleton />;
	if (notFound) {
		return (
			<PageShell>
				<StateCard
					icon={<AlertTriangle className="h-8 w-8" aria-hidden="true" />}
					title="Request not found"
					description="The request you are looking for may have been removed or is no longer available."
					primary={
						<Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-rose-100">
							<ArrowRight className="h-4 w-4" aria-hidden="true" /> Back to My Requests
						</Link>
					}
				/>
			</PageShell>
		);
	}
	if (error && !request) {
		return (
			<PageShell>
				<StateCard
					icon={<AlertTriangle className="h-8 w-8" aria-hidden="true" />}
					title="Unable to load request information"
					description="Please try again in a moment. The request data is preserved and can be reloaded."
					primary={
						<>
							<button type="button" onClick={() => load()} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">
								<RefreshCcw className="h-4 w-4" aria-hidden="true" /> Try Again
							</button>
							<Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">
								Back to My Requests
							</Link>
						</>
					}
				/>
			</PageShell>
		);
	}

	const isEmergency = request.urgency === 'EMERGENCY' || request.priority === 'EMERGENCY' || String(request.id || '').startsWith('EM-');
	const status = (statusInfo?.status || request.status || 'PENDING').toUpperCase();
	const canCancel = !['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(status);

	return (
		<PageShell>
			<Breadcrumbs id={request.id} />
			<BackBar onBack={() => navigate(-1)} />

			<Header request={request} status={status} isEmergency={isEmergency} onRefresh={handleRefresh} refreshing={refreshing} apiReady={apiReady} />

			<div className="mt-8 space-y-6">
				{isEmergency ? <EmergencyBanner /> : null}
				<ProgressTimeline status={status} isEmergency={isEmergency} />
				<MatchingStatusCard request={request} matches={matches} responses={responses} />
				<ResponsesLayout
					bankResponses={responses.filter((r) => (r.responderType || r.type) === 'BLOOD_BANK')}
					donorResponses={responses.filter((r) => (r.responderType || r.type) === 'DONOR')}
				/>
				<DetailsCard request={request} open={detailsOpen} onToggle={() => setDetailsOpen((v) => !v)} />
				<TimelineCard activity={activity} />
				<MapCard request={request} responses={responses} />
				<ActionsCard
					request={request}
					status={status}
					canCancel={canCancel}
					onCancel={() => setCancelOpen(true)}
					onRefresh={handleRefresh}
					refreshing={refreshing}
					onSupport={() => navigate('/contact')}
				/>
			</div>

			{cancelOpen ? (
				<CancelModal
					onClose={() => setCancelOpen(false)}
					onConfirm={handleCancel}
					loading={cancelling}
					error={cancelError}
				/>
			) : null}
		</PageShell>
	);
}

function PageShell({ children }) {
	return (
		<div className="min-h-screen overflow-x-hidden bg-blood-radial text-slate-100">
			<div className="section-shell py-8 sm:py-10 lg:py-12">{children}</div>
		</div>
	);
}

function Breadcrumbs({ id }) {
	return (
		<nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-400">
			<Link to="/dashboard" className="transition hover:text-white">Dashboard</Link>
			<span aria-hidden="true">/</span>
			<span className="text-slate-200">My Requests</span>
			<span aria-hidden="true">/</span>
			<span className="text-slate-200" aria-current="page">Request Tracking{id ? ` · ${id}` : ''}</span>
		</nav>
	);
}

function BackBar({ onBack }) {
	return (
		<div className="mb-4 flex items-center justify-between">
			<button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10">
				<ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to My Requests
			</button>
		</div>
	);
}

function Header({ request, status, isEmergency, onRefresh, refreshing, apiReady }) {
	return (
		<header className="glass-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
			<div className={`absolute inset-x-0 top-0 h-1 ${isEmergency ? 'bg-gradient-to-r from-rose-500 via-red-400 to-amber-400' : 'bg-gradient-to-r from-rose-500 to-sky-400'}`} aria-hidden="true" />
			<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Request tracking</p>
						{isEmergency ? (
							<span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-100">
								<Siren className="h-3.5 w-3.5" aria-hidden="true" /> Emergency Request
							</span>
						) : null}
					</div>
					<h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Track Blood Request</h1>
					<p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Monitor the progress of your blood request in real time.</p>
					<p className="mt-4 text-sm text-slate-400">Request ID: <span className="font-mono text-white">{request.id}</span></p>
				</div>
				<div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
					<span className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1 text-xs font-semibold ${apiReady ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/30 bg-amber-500/10 text-amber-200'}`}>
						<span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
						{apiReady ? 'API Connected' : 'Local mode (no backend configured)'}
					</span>
					<button
						type="button"
						onClick={onRefresh}
						disabled={refreshing}
						className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-60"
					>
						<RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh Status
					</button>
				</div>
			</div>

			<div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<HeaderStat icon={Droplet} label="Blood group" value={request.bloodGroup} accent="text-rose-200" />
				<HeaderStat icon={Banknote} label="Units required" value={`${request.unitsRequired || 1} unit${(request.unitsRequired || 1) > 1 ? 's' : ''}`} accent="text-amber-200" />
				<HeaderStat icon={isEmergency ? Siren : AlertTriangle} label="Urgency" value={isEmergency ? 'Emergency' : (request.urgencyLabel || request.urgency || 'Normal')} accent={isEmergency ? 'text-rose-200' : 'text-emerald-200'} />
				<HeaderStat icon={Hospital} label="Hospital" value={request.hospital} accent="text-sky-200" />
			</div>

			<div className="mt-4 flex flex-wrap items-center gap-3">
				<StatusBadge status={status} />
				<span className="inline-flex items-center gap-2 text-sm text-slate-300">
					<MapPin className="h-4 w-4 text-rose-200" aria-hidden="true" /> {request.location || '—'}
				</span>
				{request.requiredBy ? (
					<span className="inline-flex items-center gap-2 text-sm text-slate-300">
						<CalendarClock className="h-4 w-4 text-rose-200" aria-hidden="true" /> Required by {request.requiredBy}
					</span>
				) : null}
			</div>
		</header>
	);
}

function HeaderStat({ icon: Icon, label, value, accent }) {
	return (
		<div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
			<div className="flex items-center gap-3">
				<div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 ${accent}`}>
					<Icon className="h-5 w-5" aria-hidden="true" />
				</div>
				<div>
					<p className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</p>
					<p className="mt-1 text-base font-semibold text-white">{value || '—'}</p>
				</div>
			</div>
		</div>
	);
}

function StatusBadge({ status }) {
	const cfg = STATUS_BADGES[status] || STATUS_BADGES.PENDING;
	return (
		<span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.classes}`}>
			{cfg.icon ? <cfg.icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
			{cfg.label}
		</span>
	);
}

const STATUS_BADGES = {
	PENDING: { label: 'Pending', icon: Clock3, classes: 'border-slate-400/30 bg-slate-500/10 text-slate-200' },
	SEARCHING: { label: 'Searching for Matches', icon: Search, classes: 'border-sky-400/30 bg-sky-500/10 text-sky-200' },
	MATCHING: { label: 'Matching', icon: Users, classes: 'border-sky-400/30 bg-sky-500/10 text-sky-200' },
	DONOR_RESPONDED: { label: 'Donor Responded', icon: HeartHandshake, classes: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' },
	BLOOD_BANK_RESPONDED: { label: 'Blood Bank Responded', icon: Building2, classes: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' },
	ACCEPTED: { label: 'Accepted', icon: CheckCircle2, classes: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' },
	PARTIALLY_FULFILLED: { label: 'Partially Fulfilled', icon: Droplet, classes: 'border-amber-400/30 bg-amber-500/10 text-amber-200' },
	FULFILLED: { label: 'Fulfilled', icon: CheckCircle2, classes: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' },
	CANCELLED: { label: 'Cancelled', icon: X, classes: 'border-slate-400/30 bg-slate-500/10 text-slate-300' },
	EXPIRED: { label: 'Expired', icon: Clock3, classes: 'border-slate-400/30 bg-slate-500/10 text-slate-300' },
};

// STATUS_BADGES map defined above

const TIMELINE_STAGES = [
	{ id: 'CREATED', label: 'Request Created' },
	{ id: 'SEARCHING', label: 'Searching for Blood' },
	{ id: 'MATCHING', label: 'Matching Donors & Blood Banks' },
	{ id: 'RESPONSE', label: 'Response Received' },
	{ id: 'CONFIRMED', label: 'Blood Confirmed' },
	{ id: 'FULFILLED', label: 'Request Fulfilled' },
];

function stageIndex(status) {
	switch (status) {
		case 'PENDING': return 0;
		case 'SEARCHING': return 1;
		case 'MATCHING': return 2;
		case 'DONOR_RESPONDED':
		case 'BLOOD_BANK_RESPONDED':
		case 'ACCEPTED': return 3;
		case 'PARTIALLY_FULFILLED': return 4;
		case 'FULFILLED': return 5;
		case 'CANCELLED':
		case 'EXPIRED': return -1;
		default: return 0;
	}
}

function EmergencyBanner() {
	return (
		<section className="glass-card flex flex-col gap-3 rounded-[2rem] border-rose-400/30 bg-gradient-to-br from-rose-500/15 via-red-500/5 to-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
			<div className="flex items-center gap-3">
				<div className="rounded-2xl bg-rose-500/15 p-3 text-rose-200"><Siren className="h-5 w-5" aria-hidden="true" /></div>
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Emergency</p>
					<h2 className="mt-1 text-xl font-semibold text-white">Matching is being prioritized.</h2>
				</div>
			</div>
			<p className="text-sm leading-7 text-slate-200/90">Verified nearby blood banks and compatible donors are being notified first.</p>
		</section>
	);
}

function ProgressTimeline({ status, isEmergency }) {
	const active = stageIndex(status);
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center gap-3">
				<div className="rounded-2xl bg-sky-500/10 p-3 text-sky-200"><Filter className="h-5 w-5" aria-hidden="true" /></div>
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200/80">Request progress</p>
					<h2 className="mt-1 text-2xl font-semibold text-white">Current stage</h2>
				</div>
			</div>
			<ol className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
				{TIMELINE_STAGES.map((stage, idx) => {
					const reached = active >= idx;
					const current = active === idx;
					return (
						<li
							key={stage.id}
							className={`relative flex flex-col gap-2 rounded-2xl border p-4 transition ${
								current
									? isEmergency
										? 'border-rose-400/40 bg-rose-500/15 text-white'
										: 'border-sky-400/40 bg-sky-500/15 text-white'
									: reached
										? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
										: 'border-white/10 bg-slate-950/40 text-slate-300'
							}`}
						>
							<div className="flex items-center gap-2">
								<span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
									current ? 'bg-rose-500 text-white' : reached ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/5 text-slate-400'
								}`}>{idx + 1}</span>
								{current ? <span className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-100">Active</span> : null}
							</div>
							<p className="text-sm font-semibold">{stage.label}</p>
						</li>
					);
				})}
			</ol>
		</section>
	);
}

function MatchingStatusCard({ request, matches, responses }) {
	const banks = matches.filter((m) => (m.responderType || m.type) === 'BLOOD_BANK').length;
	const donors = matches.filter((m) => (m.responderType || m.type) === 'DONOR').length;
	const bankResponses = responses.filter((r) => (r.responderType || r.type) === 'BLOOD_BANK').length;
	const donorResponses = responses.filter((r) => (r.responderType || r.type) === 'DONOR').length;
	const totalResponses = bankResponses + donorResponses;
	const unitsConfirmed = responses.reduce((sum, r) => sum + (Number(r.unitsConfirmed) || Number(r.units) || 0), 0);
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200"><Users className="h-5 w-5" aria-hidden="true" /></div>
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Live matching</p>
						<h2 className="mt-1 text-2xl font-semibold text-white">Matching status</h2>
					</div>
				</div>
				<span className="hidden text-xs text-slate-400 sm:inline">API-driven values</span>
			</div>
			<div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<MetricCard icon={Building2} label="Blood banks searched" value={banks || 0} tone="emerald" />
				<MetricCard icon={User} label="Compatible donors found" value={donors || 0} tone="sky" />
				<MetricCard icon={BellRing} label="Responses received" value={totalResponses} tone="amber" />
				<MetricCard icon={Droplet} label="Units confirmed" value={unitsConfirmed} tone="rose" />
			</div>
			{!isBloodRequestApiConfigured() ? (
				<p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
					<AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Demo values shown because the backend is not connected.
				</p>
			) : null}
		</section>
	);
}

function MetricCard({ icon: Icon, label, value, tone }) {
	const tones = {
		emerald: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
		sky: 'border-sky-400/20 bg-sky-500/10 text-sky-200',
		amber: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
		rose: 'border-rose-400/20 bg-rose-500/10 text-rose-200',
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

function ResponsesLayout({ bankResponses, donorResponses }) {
	return (
		<div className="grid gap-6 xl:grid-cols-2">
			<ResponsesSection
				title="Blood bank responses"
				icon={Building2}
				empty="No blood bank responses yet. We will notify you as soon as a bank responds."
				items={bankResponses}
				renderCard={(r) => <BloodBankResponseCard key={r.id || r._id} response={r} />}
			/>
			<ResponsesSection
				title="Donor responses"
				icon={User}
				empty="No donor responses yet. Compatible donors are being notified."
				items={donorResponses}
				renderCard={(r) => <DonorResponseCard key={r.id || r._id} response={r} />}
			/>
		</div>
	);
}

function ResponsesSection({ title, icon: Icon, empty, items, renderCard }) {
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center gap-3">
				<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200"><Icon className="h-5 w-5" aria-hidden="true" /></div>
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Responses</p>
					<h2 className="mt-1 text-2xl font-semibold text-white">{title}</h2>
				</div>
			</div>
			{items.length === 0 ? (
				<p className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-950/30 px-4 py-6 text-center text-sm text-slate-300">{empty}</p>
			) : (
				<div className="mt-6 space-y-3">
					{items.map(renderCard)}
				</div>
			)}
		</section>
	);
}

function BloodBankResponseCard({ response }) {
	const status = (response.status || 'AWAITING').toUpperCase();
	const tone = RESPONSE_TONES[status] || RESPONSE_TONES.AWAITING;
	return (
		<article className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="text-lg font-semibold text-white">{response.name || response.bloodBankName || 'Blood bank'}</h3>
						{response.verified ? (
							<span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-200">
								<BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified
							</span>
						) : null}
					</div>
					<p className="mt-1 text-sm text-slate-300">{response.location || response.address || '—'}</p>
					<div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
						{response.distanceKm != null ? <span className="inline-flex items-center gap-1"><Navigation2 className="h-3.5 w-3.5 text-rose-200" aria-hidden="true" />{Number(response.distanceKm).toFixed(1)} km</span> : null}
						{response.bloodGroup ? <span className="inline-flex items-center gap-1"><Droplet className="h-3.5 w-3.5 text-rose-200" aria-hidden="true" />{response.bloodGroup}</span> : null}
						{response.unitsAvailable != null ? <span className="inline-flex items-center gap-1"><Droplet className="h-3.5 w-3.5 text-rose-200" aria-hidden="true" />{response.unitsAvailable} units</span> : null}
						{response.respondedAt ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-rose-200" aria-hidden="true" />Responded {response.respondedAt}</span> : null}
					</div>
				</div>
				<span className={`inline-flex items-center gap-1 self-start rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.classes}`}>
					{tone.label}
				</span>
			</div>
			<div className="mt-4 flex flex-wrap gap-3">
				<Link to={`/blood-banks/${encodeURIComponent(response.bloodBankId || response.id || '')}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
					View Blood Bank
				</Link>
				<button type="button" disabled={status === 'ACCEPTED' || status === 'FULFILLED'} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60">
					Accept Response
				</button>
			</div>
		</article>
	);
}

function DonorResponseCard({ response }) {
	const status = (response.status || 'AWAITING').toUpperCase();
	const tone = RESPONSE_TONES[status] || RESPONSE_TONES.AWAITING;
	return (
		<article className="rounded-2xl border border-white/10 bg-slate-950/40 p-5">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<div className="flex flex-wrap items-center gap-2">
						<h3 className="text-lg font-semibold text-white">{response.displayName || response.donorName || 'Donor'}</h3>
						{response.bloodGroup ? <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-white">{response.bloodGroup}</span> : null}
						{response.verified ? (
							<span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-200">
								<BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified
							</span>
						) : null}
					</div>
					<p className="mt-1 text-sm text-slate-300">{response.area || response.approxLocation || 'Approximate area'}</p>
					<div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
						{response.distanceKm != null ? <span className="inline-flex items-center gap-1"><Navigation2 className="h-3.5 w-3.5 text-rose-200" aria-hidden="true" />{Number(response.distanceKm).toFixed(1)} km</span> : null}
						{response.availability ? <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5 text-rose-200" aria-hidden="true" />{response.availability}</span> : null}
					</div>
					<p className="mt-2 inline-flex items-center gap-2 text-xs text-emerald-100">
						<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Private contact details are shared only after consent.
					</p>
				</div>
				<span className={`inline-flex items-center gap-1 self-start rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.classes}`}>
					{tone.label}
				</span>
			</div>
			<div className="mt-4 flex flex-wrap gap-3">
				<Link to={`/donor/${encodeURIComponent(response.donorId || response.id || '')}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
					View Donor
				</Link>
				<button type="button" disabled={status === 'ACCEPTED' || status === 'FULFILLED'} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60">
					Respond
				</button>
			</div>
		</article>
	);
}

const RESPONSE_TONES = {
	AVAILABLE: { label: 'Available', classes: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' },
	PARTIALLY_AVAILABLE: { label: 'Partially Available', classes: 'border-amber-400/30 bg-amber-500/10 text-amber-200' },
	UNAVAILABLE: { label: 'Unavailable', classes: 'border-slate-400/30 bg-slate-500/10 text-slate-300' },
	AWAITING: { label: 'Awaiting Response', classes: 'border-sky-400/30 bg-sky-500/10 text-sky-200' },
	ACCEPTED: { label: 'Accepted', classes: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' },
	FULFILLED: { label: 'Fulfilled', classes: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' },
	REJECTED: { label: 'Rejected', classes: 'border-rose-400/30 bg-rose-500/10 text-rose-200' },
};

function DetailsCard({ request, open, onToggle }) {
	const rows = [
		{ label: 'Patient name', value: request.patientName },
		{ label: 'Blood group', value: request.bloodGroup },
		{ label: 'Units required', value: request.unitsRequired ? `${request.unitsRequired} unit(s)` : '—' },
		{ label: 'Hospital', value: request.hospital },
		{ label: 'Location', value: request.location },
		{ label: 'Required by', value: request.requiredBy },
		{ label: 'Urgency', value: request.urgencyLabel || request.urgency || '—' },
		{ label: 'Reason', value: request.reason || '—' },
		{ label: 'Contact person', value: request.contactName || '—' },
	];
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-3 text-left">
				<div className="flex items-center gap-3">
					<div className="rounded-2xl bg-sky-500/10 p-3 text-sky-200"><Hospital className="h-5 w-5" aria-hidden="true" /></div>
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200/80">Request</p>
						<h2 className="mt-1 text-2xl font-semibold text-white">Request details</h2>
					</div>
				</div>
				{open ? <ChevronUp className="h-5 w-5 text-slate-300" aria-hidden="true" /> : <ChevronDown className="h-5 w-5 text-slate-300" aria-hidden="true" />}
			</button>
			{open ? (
				<>
					<dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{rows.map((row) => (
							<div key={row.label} className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
								<dt className="text-xs uppercase tracking-[0.25em] text-slate-400">{row.label}</dt>
								<dd className="text-sm font-medium text-white">{row.value || '—'}</dd>
							</div>
						))}
					</dl>
					<p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
						<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Sensitive information is only visible to the authenticated requester and authorized parties.
					</p>
				</>
			) : null}
		</section>
	);
}

function TimelineCard({ activity }) {
	const items = Array.isArray(activity) ? activity : [];
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center gap-3">
				<div className="rounded-2xl bg-amber-500/10 p-3 text-amber-200"><Clock3 className="h-5 w-5" aria-hidden="true" /></div>
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200/80">Activity</p>
					<h2 className="mt-1 text-2xl font-semibold text-white">Request timeline</h2>
				</div>
			</div>
			{items.length === 0 ? (
				<p className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-950/30 px-4 py-6 text-center text-sm text-slate-300">No activity yet.</p>
			) : (
				<ol className="mt-6 space-y-3">
					{items.map((item, idx) => {
						const meta = TIMELINE_ICONS[item.type] || TIMELINE_ICONS.default;
						const Icon = meta.icon;
						return (
							<li key={idx} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
								<div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${meta.tone}`}>
									<Icon className="h-5 w-5" aria-hidden="true" />
								</div>
								<div className="flex-1">
									<p className="text-sm font-medium text-white">{item.label || item.title || 'Activity'}</p>
									{item.note ? <p className="text-xs text-slate-400">{item.note}</p> : null}
								</div>
								<span className="text-xs text-slate-400">{item.when || item.time || 'Recently'}</span>
							</li>
						);
					})}
				</ol>
			)}
		</section>
	);
}

const TIMELINE_ICONS = {
	created: { icon: Sparkles, tone: 'border-rose-400/20 bg-rose-500/10 text-rose-200' },
	search: { icon: Search, tone: 'border-sky-400/20 bg-sky-500/10 text-sky-200' },
	match: { icon: Users, tone: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' },
	response: { icon: HeartHandshake, tone: 'border-amber-400/20 bg-amber-500/10 text-amber-200' },
	confirm: { icon: CheckCircle2, tone: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' },
	fulfilled: { icon: Droplet, tone: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' },
	cancel: { icon: X, tone: 'border-slate-400/20 bg-slate-500/10 text-slate-300' },
	default: { icon: Clock3, tone: 'border-white/10 bg-white/5 text-slate-300' },
};

function MapCard({ request, responses }) {
	const tags = ['Hospital / request location'];
	const bankCount = responses.filter((r) => (r.responderType || r.type) === 'BLOOD_BANK').length;
	const donorCount = responses.filter((r) => (r.responderType || r.type) === 'DONOR').length;
	if (bankCount) tags.push(`${bankCount} blood bank${bankCount > 1 ? 's' : ''}`);
	if (donorCount) tags.push(`${donorCount} approximate donor area${donorCount > 1 ? 's' : ''}`);
	return (
		<section>
			<MapPlaceholder
				title="Request map"
				subtitle="Approximate locations only. Donor home addresses are never shown."
				tags={tags}
			/>
		</section>
	);
}

function ActionsCard({ request, status, canCancel, onCancel, onRefresh, refreshing, onSupport }) {
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center gap-3">
				<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200"><Sparkles className="h-5 w-5" aria-hidden="true" /></div>
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Actions</p>
					<h2 className="mt-1 text-2xl font-semibold text-white">Request actions</h2>
				</div>
			</div>
			<div className="mt-6 flex flex-wrap gap-3">
				<button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60">
					<RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh Status
				</button>
				<button type="button" onClick={onSupport} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
					<MessageCircle className="h-4 w-4" aria-hidden="true" /> Contact Support
				</button>
				<Link to="/find-blood" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
					<Building2 className="h-4 w-4" aria-hidden="true" /> Find Blood
				</Link>
				<Link to="/find-donor" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
					<User className="h-4 w-4" aria-hidden="true" /> Find Donor
				</Link>
				{canCancel ? (
					<button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20">
						<Trash2 className="h-4 w-4" aria-hidden="true" /> Cancel Request
					</button>
				) : null}
			</div>
			<p className="mt-4 text-xs text-slate-400">Actions are shown based on the current request status. Cancellation is disabled once a request is fulfilled or already cancelled.</p>
		</section>
	);
}

function CancelModal({ onClose, onConfirm, loading, error }) {
	return (
		<div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
			<div className="glass-card w-full max-w-lg rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-start gap-3">
					<div className="rounded-2xl bg-rose-500/15 p-3 text-rose-200"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></div>
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Confirm</p>
						<h3 id="cancel-modal-title" className="mt-1 text-2xl font-semibold text-white">Cancel this blood request?</h3>
						<p className="mt-2 text-sm leading-7 text-slate-300">Are you sure you want to cancel this blood request? This action cannot be undone, and any pending matches will be released.</p>
					</div>
				</div>
				{error ? <p className="mt-3 text-sm text-rose-200" role="alert">{error}</p> : null}
				<div className="mt-6 flex flex-wrap justify-end gap-3">
					<button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
						Keep Request
					</button>
					<button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60">
						{loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
						Cancel Request
					</button>
				</div>
			</div>
		</div>
	);
}

function StateCard({ icon, title, description, primary }) {
	return (
		<div className="glass-card rounded-[2rem] p-8 text-center sm:p-10">
			<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-200">{icon}</div>
			<h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">{title}</h1>
			<p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
			<div className="mt-6 flex flex-wrap justify-center gap-3">{primary}</div>
		</div>
	);
}

function TrackingSkeleton() {
	return (
		<div className="min-h-screen overflow-x-hidden bg-blood-radial text-slate-100">
			<div className="section-shell py-8 sm:py-10 lg:py-12">
				<div className="h-4 w-72 animate-pulse rounded-full bg-white/10" />
				<div className="mt-6 h-10 w-44 animate-pulse rounded-full bg-white/10" />
				<div className="mt-6 glass-card h-56 animate-pulse rounded-[2rem]" />
				<div className="mt-6 glass-card h-40 animate-pulse rounded-[2rem]" />
				<div className="mt-6 grid gap-6 xl:grid-cols-2">
					<div className="glass-card h-64 animate-pulse rounded-[2rem]" />
					<div className="glass-card h-64 animate-pulse rounded-[2rem]" />
				</div>
			</div>
		</div>
	);
}

function normalizeRequest(raw) {
	const id = raw._id || raw.id;
	const hospital = raw.hospital?.name || raw.hospitalName || raw.hospital || '—';
	const location = [raw.location?.area, raw.location?.city].filter(Boolean).join(', ') || raw.location || '—';
	const requiredBy = [raw.requiredDate, raw.requiredTime].filter(Boolean).join(' ') || raw.requiredBy || '';
	return {
		id,
		bloodGroup: raw.bloodGroup,
		unitsRequired: raw.unitsRequired || 1,
		urgency: raw.urgency || 'NORMAL',
		urgencyLabel: raw.urgency === 'EMERGENCY' ? 'Emergency' : raw.urgency === 'URGENT' ? 'Urgent' : 'Normal',
		status: (raw.status || 'PENDING').toUpperCase(),
		hospital,
		location,
		requiredBy,
		patientName: raw.patient?.name || raw.patientName,
		contactName: raw.contact?.name,
		reason: raw.reason,
	};
}

function buildDemoRequest(id) {
	const KNOWN = ['BLD-2026-00125', 'EM-DEMO-1'];
	if (id && !KNOWN.includes(String(id)) && !String(id).startsWith('EM-') && !String(id).startsWith('LR-')) {
		// Unknown id; treat as not found in local mode
		return null;
	}
	const isEmergency = String(id || '').startsWith('EM-');
	return {
		id: id || 'BLD-2026-00125',
		bloodGroup: 'O+',
		unitsRequired: 2,
		urgency: isEmergency ? 'EMERGENCY' : 'URGENT',
		urgencyLabel: isEmergency ? 'Emergency' : 'Urgent',
		status: 'MATCHING',
		hospital: 'Example General Hospital',
		location: 'Anantapur',
		requiredBy: 'Today 18:30',
		patientName: 'Patient A',
		contactName: 'Contact Person',
		reason: 'Accident',
		demoMatches: [
			{ id: 'm1', responderType: 'BLOOD_BANK', name: 'City Central Blood Bank', bloodGroup: 'O+', unitsAvailable: 8, distanceKm: 2.4, verified: true },
			{ id: 'm2', responderType: 'BLOOD_BANK', name: 'Lifeline Blood Center', bloodGroup: 'O+', unitsAvailable: 4, distanceKm: 5.1, verified: true },
			{ id: 'm3', responderType: 'BLOOD_BANK', name: 'MetroCare Blood Bank', bloodGroup: 'O+', unitsAvailable: 0, distanceKm: 6.8, verified: false },
			{ id: 'm4', responderType: 'BLOOD_BANK', name: 'Hope Regional Blood Bank', bloodGroup: 'O+', unitsAvailable: 3, distanceKm: 9.2, verified: true },
			{ id: 'm5', responderType: 'BLOOD_BANK', name: 'Sunrise Blood Bank', bloodGroup: 'O+', unitsAvailable: 1, distanceKm: 11.0, verified: true },
			{ id: 'm6', responderType: 'BLOOD_BANK', name: 'CareFirst Blood Center', bloodGroup: 'O+', unitsAvailable: 6, distanceKm: 12.4, verified: true },
			{ id: 'm7', responderType: 'BLOOD_BANK', name: 'City Central Annex', bloodGroup: 'O+', unitsAvailable: 2, distanceKm: 14.0, verified: true },
			{ id: 'm8', responderType: 'BLOOD_BANK', name: 'Community Blood Center', bloodGroup: 'O+', unitsAvailable: 5, distanceKm: 15.6, verified: false },
			{ id: 'm9', responderType: 'BLOOD_BANK', name: 'Downtown Donor Center', bloodGroup: 'O+', unitsAvailable: 7, distanceKm: 16.1, verified: true },
			{ id: 'm10', responderType: 'BLOOD_BANK', name: 'East Side Blood Bank', bloodGroup: 'O+', unitsAvailable: 3, distanceKm: 17.3, verified: true },
			{ id: 'm11', responderType: 'BLOOD_BANK', name: 'Westside Hospital Bank', bloodGroup: 'O+', unitsAvailable: 4, distanceKm: 18.5, verified: true },
			{ id: 'm12', responderType: 'BLOOD_BANK', name: 'Northpoint Blood Bank', bloodGroup: 'O+', unitsAvailable: 2, distanceKm: 19.4, verified: true },
			{ id: 'd1', responderType: 'DONOR', displayName: 'Rahul', bloodGroup: 'O+', distanceKm: 2.4, verified: true, availability: 'Available Now' },
			{ id: 'd2', responderType: 'DONOR', displayName: 'Anita', bloodGroup: 'O+', distanceKm: 3.6, verified: true, availability: 'Available Soon' },
			{ id: 'd3', responderType: 'DONOR', displayName: 'Suresh', bloodGroup: 'O+', distanceKm: 4.1, verified: false, availability: 'Available Now' },
			{ id: 'd4', responderType: 'DONOR', displayName: 'Priya', bloodGroup: 'O+', distanceKm: 5.0, verified: true, availability: 'Available Now' },
			{ id: 'd5', responderType: 'DONOR', displayName: 'Vikram', bloodGroup: 'O+', distanceKm: 5.5, verified: true, availability: 'Available Now' },
			{ id: 'd6', responderType: 'DONOR', displayName: 'Pooja', bloodGroup: 'O+', distanceKm: 6.2, verified: true, availability: 'Available Soon' },
			{ id: 'd7', responderType: 'DONOR', displayName: 'Amit', bloodGroup: 'O+', distanceKm: 7.0, verified: false, availability: 'Available Now' },
			{ id: 'd8', responderType: 'DONOR', displayName: 'Neha', bloodGroup: 'O+', distanceKm: 7.8, verified: true, availability: 'Available Now' },
		],
		demoResponses: [
			{ id: 'r1', responderType: 'BLOOD_BANK', name: 'City Central Blood Bank', bloodGroup: 'O+', unitsAvailable: 8, distanceKm: 2.4, verified: true, status: 'AVAILABLE', respondedAt: '10:24 AM' },
			{ id: 'r2', responderType: 'BLOOD_BANK', name: 'Lifeline Blood Center', bloodGroup: 'O+', unitsAvailable: 4, distanceKm: 5.1, verified: true, status: 'PARTIALLY_AVAILABLE', respondedAt: '10:25 AM' },
			{ id: 'r3', responderType: 'BLOOD_BANK', name: 'Hope Regional Blood Bank', bloodGroup: 'O+', unitsAvailable: 3, distanceKm: 9.2, verified: true, status: 'AWAITING' },
			{ id: 'rd1', responderType: 'DONOR', displayName: 'Rahul', bloodGroup: 'O+', distanceKm: 2.4, verified: true, availability: 'Available Now', status: 'AVAILABLE' },
			{ id: 'rd2', responderType: 'DONOR', displayName: 'Priya', bloodGroup: 'O+', distanceKm: 5.0, verified: true, availability: 'Available Now', status: 'AVAILABLE', unitsConfirmed: 1 },
			{ id: 'rd3', responderType: 'DONOR', displayName: 'Suresh', bloodGroup: 'O+', distanceKm: 4.1, verified: false, availability: 'Available Now', status: 'AWAITING' },
		],
		demoActivity: [
			{ type: 'created', label: 'Request created', when: '10:20 AM' },
			{ type: 'search', label: 'Searching nearby blood banks', when: '10:21 AM' },
			{ type: 'match', label: '12 blood banks and 8 compatible donors found', when: '10:22 AM' },
			{ type: 'response', label: 'City Central Blood Bank responded (8 units available)', when: '10:24 AM' },
			{ type: 'response', label: 'Donor Priya responded (1 unit confirmed)', when: '10:26 AM' },
			{ type: 'confirm', label: '1 of 2 units confirmed', when: '10:27 AM' },
		],
	};
}
