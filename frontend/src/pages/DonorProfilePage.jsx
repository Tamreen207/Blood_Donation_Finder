import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
	AlertTriangle,
	ArrowRight,
	ArrowUpRight,
	BadgeCheck,
	Building2,
	CalendarCheck,
	CalendarClock,
	CheckCircle2,
	Clock3,
	Droplets,
	Heart,
	HeartHandshake,
	History,
	LoaderCircle,
	MapPin,
	MessageSquareQuote,
	Navigation2,
	Phone,
	ShieldCheck,
	Sparkles,
	Star,
	TrendingUp,
	User,
	X,
} from 'lucide-react';
import MapPlaceholder from '../components/MapPlaceholder';
import { fetchDonorDetails, fetchDonorActivity, isDonorApiConfigured } from '../services/donorService';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DEMO_DONORS = buildDemoDonors();

function buildDemoDonors() {
	const base = [
		{ id: 'DN-1001', displayName: 'Rahul', bloodGroup: 'O+', verified: true, distanceKm: 3.2, area: 'North Ward', city: 'Anantapur', availability: 'Available Now', lastDonation: '3 months ago', totalDonations: 12, donorSince: '2024', eligibility: 'Eligible to donate', recentActivity: 'Active 2 hours ago' },
		{ id: 'DN-1002', displayName: 'Anita', bloodGroup: 'A+', verified: true, distanceKm: 4.6, area: 'Downtown', city: 'Anantapur', availability: 'Available Soon', lastDonation: '5 months ago', totalDonations: 7, donorSince: '2024', eligibility: 'Eligible with scheduling', recentActivity: 'Active today' },
		{ id: 'DN-1003', displayName: 'Suresh', bloodGroup: 'B-', verified: true, distanceKm: 6.1, area: 'West End', city: 'Anantapur', availability: 'Unavailable', lastDonation: '4 months ago', totalDonations: 4, donorSince: '2025', eligibility: 'Temporarily paused', recentActivity: 'Active yesterday' },
		{ id: 'DN-1004', displayName: 'Priya', bloodGroup: 'AB+', verified: true, distanceKm: 2.4, area: 'Central Plaza', city: 'Anantapur', availability: 'Available Now', lastDonation: '2 months ago', totalDonations: 18, donorSince: '2023', eligibility: 'Eligible to donate', recentActivity: 'Active 30 min ago' },
		{ id: 'DN-1005', displayName: 'Vikram', bloodGroup: 'O-', verified: false, distanceKm: 7.8, area: 'East Side', city: 'Anantapur', availability: 'Available Now', lastDonation: '6 months ago', totalDonations: 2, donorSince: '2025', eligibility: 'Eligible to donate', recentActivity: 'Active 4 days ago' },
		{ id: 'DN-1006', displayName: 'Pooja', bloodGroup: 'A-', verified: true, distanceKm: 5.5, area: 'South Avenue', city: 'Anantapur', availability: 'Available Now', lastDonation: '4 months ago', totalDonations: 9, donorSince: '2023', eligibility: 'Eligible to donate', recentActivity: 'Active today' },
		{ id: 'DN-1007', displayName: 'Amit', bloodGroup: 'B+', verified: true, distanceKm: 8.2, area: 'Lake District', city: 'Anantapur', availability: 'Available Soon', lastDonation: '7 months ago', totalDonations: 5, donorSince: '2024', eligibility: 'Eligible with scheduling', recentActivity: 'Active 2 days ago' },
		{ id: 'DN-1008', displayName: 'Neha', bloodGroup: 'O+', verified: true, distanceKm: 1.9, area: 'Market Square', city: 'Anantapur', availability: 'Available Now', lastDonation: '1 month ago', totalDonations: 22, donorSince: '2022', eligibility: 'Eligible to donate', recentActivity: 'Active 1 hour ago' },
	];
	return base;
}

const SAMPLE_APPRECIATIONS = [
	{ name: 'Patient Family', message: 'Thank you for your quick response. The donor arrived on time and helped our family through a tough moment.' },
	{ name: 'Care Team', message: 'Reliable, calm, and supportive throughout the coordination process. Highly appreciated.' },
	{ name: 'Community Member', message: 'A real-life example of kindness. This is the second time they have stepped up for a neighbour in need.' },
];

const ACTIVITY_TYPES = {
	donation: { label: 'Donation completed', icon: Heart, tone: 'text-rose-200 bg-rose-500/10 border-rose-400/20' },
	availability: { label: 'Availability updated', icon: Clock3, tone: 'text-sky-200 bg-sky-500/10 border-sky-400/20' },
	verification: { label: 'Profile verified', icon: BadgeCheck, tone: 'text-emerald-200 bg-emerald-500/10 border-emerald-400/20' },
	respond: { label: 'Responded to a request', icon: HeartHandshake, tone: 'text-amber-200 bg-amber-500/10 border-amber-400/20' },
};

function availabilityTone(status) {
	if (status === 'Available Now') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
	if (status === 'Available Soon') return 'border-amber-400/30 bg-amber-500/10 text-amber-200';
	return 'border-slate-400/30 bg-slate-500/10 text-slate-300';
}

function livesHelped(total) {
	return total * 3;
}

function privacySafeDonor(donor) {
	if (!donor) return null;
	return {
		id: donor._id || donor.id,
		displayName: donor.name?.split(' ')[0] || donor.displayName || 'Donor',
		bloodGroup: donor.bloodGroup,
		verified: Boolean(donor.isVerified ?? donor.verified),
		available: donor.isAvailable ?? (donor.availability === 'Available Now'),
		availability: donor.availability || (donor.isAvailable ? 'Available Now' : 'Unavailable'),
		area: donor.location || donor.area || donor.city || 'General area',
		city: donor.city || '',
		distanceKm: donor.distanceKm ?? null,
		totalDonations: donor.totalDonations || 0,
		lastDonation: donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : donor.lastDonation || 'Not recorded',
		donorSince: donor.donorSince || (donor.createdAt ? new Date(donor.createdAt).getFullYear() : '2024'),
		eligibility: donor.eligibility || (donor.isAvailable ? 'Eligible to receive requests' : 'Temporarily paused'),
		recentActivity: donor.recentActivity || 'Active recently',
	};
}

function findDemoDonor(id) {
	return DEMO_DONORS.find((d) => d.id === id) || null;
}

export default function DonorProfilePage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [donor, setDonor] = useState(null);
	const [activity, setActivity] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [notFound, setNotFound] = useState(false);
	const [contactOpen, setContactOpen] = useState(false);

	async function load() {
		setLoading(true);
		setError('');
		setNotFound(false);
		try {
			const apiConfigured = isDonorApiConfigured();
			let resolved = null;
			if (apiConfigured) {
				const data = await fetchDonorDetails(id);
				if (data && data.success && data.data) {
					resolved = privacySafeDonor({ ...data.data, _id: data.data._id || id, name: data.data.user?.name || data.data.displayName });
				}
			}
			if (!resolved) {
				const demo = findDemoDonor(id);
				if (demo) resolved = privacySafeDonor(demo);
			}
			if (!resolved) {
				setNotFound(true);
			} else {
				setDonor(resolved);
				if (apiConfigured) {
					try {
						const act = await fetchDonorActivity(id);
						if (act && act.success && Array.isArray(act.data)) setActivity(act.data);
					} catch (_) {
						setActivity(buildDemoActivity(resolved));
					}
				} else {
					setActivity(buildDemoActivity(resolved));
				}
			}
		} catch (err) {
			if (err?.status === 404 || err?.code === 'NOT_FOUND') setNotFound(true);
			else setError('Unable to load donor information right now.');
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	if (loading) return <DonorProfileSkeleton />;

	if (notFound) {
		return (
			<PageShell>
				<StateCard
					icon={<User className="h-8 w-8" aria-hidden="true" />}
					title="Donor not found"
					description="The donor profile you are looking for may have been removed or is no longer available."
					primary={
						<Link to="/find-donor" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-rose-100">
							<ArrowRight className="h-4 w-4" aria-hidden="true" />
							Back to Find Donors
						</Link>
					}
				/>
			</PageShell>
		);
	}

	if (error && !donor) {
		return (
			<PageShell>
				<StateCard
					icon={<AlertTriangle className="h-8 w-8" aria-hidden="true" />}
					title="Unable to load donor information"
					description="Please try again in a moment. If the issue continues, return to the search page."
					primary={
						<>
							<button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">
								Try Again
							</button>
							<Link to="/find-donor" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white">
								Back to Find Donors
							</Link>
						</>
					}
				/>
			</PageShell>
		);
	}

	return (
		<PageShell>
			<Breadcrumbs donorName={donor.displayName} />
			<BackBar />

			<ProfileHeader donor={donor} onContact={() => setContactOpen(true)} />

			<div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
				<div className="space-y-6">
					<StatsCard donor={donor} />
					<EligibilityCard donor={donor} />
					<ActivityCard activity={activity} />
					<AppreciationCard />
				</div>
				<div className="space-y-6">
					<AvailabilityCard donor={donor} />
					<ActionsCard onContact={() => setContactOpen(true)} donor={donor} />
					<PrivacyCard />
					<EmergencyCard />
				</div>
			</div>

			<div className="mt-6">
				<MapPlaceholder
					title="Approximate donor area"
					subtitle="Exact donor locations are never displayed. The map shows an approximate area only."
					tags={['Donor approximate area', `${donor.distanceKm ? `${donor.distanceKm.toFixed(1)} km from your location` : 'Distance on request'}`, 'Privacy protected']}
				/>
			</div>

			{contactOpen ? <ContactModal donor={donor} onClose={() => setContactOpen(false)} /> : null}
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

function Breadcrumbs({ donorName }) {
	return (
		<nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-400">
			<Link to="/dashboard" className="transition hover:text-white">Dashboard</Link>
			<span aria-hidden="true">/</span>
			<Link to="/find-donor" className="transition hover:text-white">Find Donor</Link>
			<span aria-hidden="true">/</span>
			<span className="text-slate-200" aria-current="page">Donor Profile{donorName ? ` · ${donorName}` : ''}</span>
		</nav>
	);
}

function BackBar() {
	return (
		<div className="mb-6 flex items-center justify-between">
			<Link to="/find-donor" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10">
				<ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" />
				Back to Find Donors
			</Link>
			<span className="hidden text-xs text-slate-400 sm:inline">Donor ID: {window.location.pathname.split('/').pop()}</span>
		</div>
	);
}

function ProfileHeader({ donor, onContact }) {
	const initial = donor.displayName?.[0] || 'D';
	return (
		<section className="glass-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
			<div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-red-400 to-amber-400" aria-hidden="true" />
			<div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
				<div className="flex flex-col gap-5 sm:flex-row sm:items-center">
					<div className="relative">
						<div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 text-2xl font-bold text-white shadow-lg shadow-rose-500/30" aria-hidden="true">
							{initial}
						</div>
						<span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-950 bg-emerald-500 text-white" aria-hidden="true">
							<BadgeCheck className="h-4 w-4" />
						</span>
					</div>
					<div>
						<div className="flex flex-wrap items-center gap-3">
							<h1 className="text-3xl font-semibold text-white sm:text-4xl">{donor.displayName}</h1>
							<span className="rounded-full bg-white/5 px-3 py-1 text-sm font-semibold text-white">{donor.bloodGroup}</span>
							{donor.verified ? (
								<span
									className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200"
									title="Identity and donor information verified by the platform."
								>
									<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Verified Donor
								</span>
							) : (
								<span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
									<AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Unverified
								</span>
							)}
						</div>
						<p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-300">
							<span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-rose-300" aria-hidden="true" />{donor.area}{donor.city ? `, ${donor.city}` : ''}</span>
							{donor.distanceKm != null ? (
								<span className="inline-flex items-center gap-2"><Navigation2 className="h-4 w-4 text-sky-300" aria-hidden="true" />{donor.distanceKm.toFixed(1)} km away</span>
							) : null}
						</p>
						<p className="mt-3 inline-flex items-center gap-2">
							<span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${availabilityTone(donor.availability)}`}>
								<span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
								{donor.availability}
							</span>
						</p>
					</div>
				</div>
				<div className="flex flex-wrap gap-3">
					<button
						type="button"
						onClick={onContact}
						className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
					>
						<Phone className="h-4 w-4" aria-hidden="true" /> Contact Donor
					</button>
					<Link
						to="/request-blood"
						state={{ donor: { id: donor.id, name: donor.displayName, bloodGroup: donor.bloodGroup, distance: donor.distanceKm, area: donor.area } }}
						className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:-translate-y-0.5"
					>
						<Droplets className="h-4 w-4" aria-hidden="true" /> Request Blood
					</Link>
				</div>
			</div>
		</section>
	);
}

function StatsCard({ donor }) {
	const stats = useMemo(() => {
		const total = donor.totalDonations || 0;
		return [
			{ label: 'Total Donations', value: String(total), icon: Heart, accent: 'text-rose-200' },
			{ label: 'Lives Helped', value: String(livesHelped(total)), icon: HeartHandshake, accent: 'text-emerald-200' },
			{ label: 'Last Donation', value: donor.lastDonation || 'Not recorded', icon: CalendarClock, accent: 'text-amber-200' },
			{ label: 'Donor Since', value: String(donor.donorSince || '—'), icon: CalendarCheck, accent: 'text-sky-200' },
		];
	}, [donor]);
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Donation summary</p>
					<h2 className="mt-2 text-2xl font-semibold text-white">Impact at a glance</h2>
				</div>
				<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><TrendingUp className="h-5 w-5" aria-hidden="true" /></div>
			</div>
			<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{stats.map((s) => {
					const Icon = s.icon;
					return (
						<div key={s.label} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
							<div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 ${s.accent}`}>
								<Icon className="h-5 w-5" aria-hidden="true" />
							</div>
							<p className="mt-4 text-2xl font-semibold text-white">{s.value}</p>
							<p className="mt-1 text-sm text-slate-400">{s.label}</p>
						</div>
					);
				})}
			</div>
		</section>
	);
}

function EligibilityCard({ donor }) {
	const items = [
		{ label: `${donor.bloodGroup} blood group available`, ok: true },
		{ label: 'Donor currently active', ok: Boolean(donor.available) },
		{ label: 'Eligible to receive requests', ok: donor.availability !== 'Unavailable' },
	];
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Eligibility</p>
					<h2 className="mt-2 text-2xl font-semibold text-white">Donor Eligibility</h2>
				</div>
				<div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-200"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></div>
			</div>
			<ul className="mt-6 space-y-3">
				{items.map((item) => (
					<li key={item.label} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
						<CheckCircle2 className={`h-5 w-5 ${item.ok ? 'text-emerald-300' : 'text-slate-500'}`} aria-hidden="true" />
						<span>{item.label}</span>
					</li>
				))}
			</ul>
			<p className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
				Eligibility information shown here is based on platform data. Final donation eligibility must be confirmed by the appropriate medical professional before donation.
			</p>
		</section>
	);
}

function AvailabilityCard({ donor }) {
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Availability</p>
					<h2 className="mt-2 text-2xl font-semibold text-white">Available for blood requests</h2>
				</div>
				<div className="rounded-2xl bg-sky-500/10 p-3 text-sky-200"><Clock3 className="h-5 w-5" aria-hidden="true" /></div>
			</div>
			<p className="mt-4 inline-flex items-center gap-2">
				<span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${availabilityTone(donor.availability)}`}>
					<span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
					{donor.availability}
				</span>
			</p>
			<dl className="mt-6 grid gap-3 text-sm">
				<div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
					<dt className="text-slate-400">Last active</dt>
					<dd className="font-medium text-white">{donor.recentActivity || 'Recently'}</dd>
				</div>
				<div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
					<dt className="text-slate-400">Eligibility</dt>
					<dd className="font-medium text-white">{donor.eligibility}</dd>
				</div>
			</dl>
		</section>
	);
}

function ActionsCard({ onContact, donor }) {
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Take action</p>
					<h2 className="mt-2 text-2xl font-semibold text-white">Coordinate safely</h2>
				</div>
				<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200"><Heart className="h-5 w-5" aria-hidden="true" /></div>
			</div>
			<p className="mt-4 text-sm leading-7 text-slate-300">
				Use the secure request flow to reach this donor. Private contact details are only shared after consent.
			</p>
			<div className="mt-5 flex flex-col gap-3">
				<Link
					to="/request-blood"
					state={{ donor: { id: donor.id, name: donor.displayName, bloodGroup: donor.bloodGroup, distance: donor.distanceKm, area: donor.area } }}
					className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:-translate-y-0.5"
				>
					<Droplets className="h-4 w-4" aria-hidden="true" /> Request Blood
				</Link>
				<button
					type="button"
					onClick={onContact}
					className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
				>
					<Phone className="h-4 w-4" aria-hidden="true" /> Contact Donor
				</button>
			</div>
		</section>
	);
}

function PrivacyCard() {
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center gap-3">
				<div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-200"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></div>
				<h2 className="text-xl font-semibold text-white">Your privacy is protected</h2>
			</div>
			<p className="mt-4 text-sm leading-7 text-slate-300">
				LifeLink does not publicly display exact donor addresses or private contact information. Contact details are shared only through appropriate request and consent workflows.
			</p>
		</section>
	);
}

function EmergencyCard() {
	return (
		<section className="glass-card overflow-hidden rounded-[2rem] border-rose-400/20 bg-gradient-to-br from-rose-500/20 via-red-500/10 to-slate-900 p-6 sm:p-8">
			<div className="flex items-center gap-3">
				<div className="rounded-2xl bg-rose-500/15 p-3 text-rose-200"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></div>
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Emergency</p>
					<h2 className="mt-1 text-xl font-semibold text-white">Need blood urgently?</h2>
				</div>
			</div>
			<p className="mt-4 text-sm leading-7 text-slate-200/90">
				Create an emergency request to notify matching donors and nearby blood banks.
			</p>
			<Link
				to="/emergency-request"
				state={{ bloodGroup: 'O+' }}
				className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-rose-100"
			>
				Create Emergency Request
				<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
			</Link>
		</section>
	);
}

function ActivityCard({ activity }) {
	const items = (activity && activity.length ? activity : []).slice(0, 6);
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Recent activity</p>
					<h2 className="mt-2 text-2xl font-semibold text-white">Donor activity</h2>
				</div>
				<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><History className="h-5 w-5" aria-hidden="true" /></div>
			</div>
			{items.length === 0 ? (
				<p className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-950/30 px-4 py-6 text-center text-sm text-slate-300">
					No recent activity available right now.
				</p>
			) : (
				<ul className="mt-6 space-y-3">
					{items.map((item, idx) => {
						const meta = ACTIVITY_TYPES[item.type] || ACTIVITY_TYPES.availability;
						const Icon = meta.icon;
						return (
							<li key={idx} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
								<div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${meta.tone}`}>
									<Icon className="h-5 w-5" aria-hidden="true" />
								</div>
								<div className="flex-1">
									<p className="text-sm font-medium text-white">{meta.label}</p>
									{item.note ? <p className="text-xs text-slate-400">{item.note}</p> : null}
								</div>
								<span className="text-xs text-slate-400">{item.when || 'Recently'}</span>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}

function AppreciationCard() {
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Community</p>
					<h2 className="mt-2 text-2xl font-semibold text-white">Community appreciation</h2>
				</div>
				<div className="rounded-2xl bg-amber-500/10 p-3 text-amber-200"><Star className="h-5 w-5" aria-hidden="true" /></div>
			</div>
			<p className="mt-2 text-xs text-slate-400">Sample appreciation messages shown for demo purposes. Real reviews will appear here when available.</p>
			<div className="mt-6 grid gap-4 md:grid-cols-3">
				{SAMPLE_APPRECIATIONS.map((t, idx) => (
					<article key={idx} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
						<MessageSquareQuote className="h-5 w-5 text-rose-300" aria-hidden="true" />
						<p className="mt-4 text-sm leading-7 text-slate-200">{t.message}</p>
						<p className="mt-4 text-sm font-semibold text-white">— {t.name}</p>
					</article>
				))}
			</div>
		</section>
	);
}

function ContactModal({ donor, onClose }) {
	const [submitting, setSubmitting] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState('');
	const [form, setForm] = useState({
		patientName: '',
		bloodGroup: donor.bloodGroup || 'O+',
		unitsRequired: 1,
		hospital: '',
		hospitalLocation: '',
		requiredDate: '',
		message: '',
	});

	function update(key, value) {
		setForm((current) => ({ ...current, [key]: value }));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setError('');
		if (!form.patientName.trim()) return setError('Patient name is required.');
		if (!form.hospital.trim()) return setError('Hospital name is required.');
		setSubmitting(true);
		try {
			// POST /api/blood-requests (handled by future Request Blood page; here we just simulate consent)
			await new Promise((r) => setTimeout(r, 500));
			setSent(true);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
			<div className="glass-card w-full max-w-2xl rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Send blood request</p>
						<h3 id="contact-modal-title" className="mt-2 text-2xl font-semibold text-white">Request contact with {donor.displayName}</h3>
					</div>
					<button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10" aria-label="Close contact form">
						<X className="h-5 w-5" aria-hidden="true" />
					</button>
				</div>

				<div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-xs text-slate-300">
					Your contact details stay private. The donor reviews and approves before any private information is shared.
				</div>

				{sent ? (
					<div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-100">
						<p className="font-semibold text-white">Request sent</p>
						<p className="mt-1">The donor will be notified. You will be contacted through the platform once they approve.</p>
						<button type="button" onClick={onClose} className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
							Close
						</button>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="mt-6 space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<FormField label="Patient name">
								<input className="field-input" value={form.patientName} onChange={(e) => update('patientName', e.target.value)} placeholder="Patient name" required />
							</FormField>
							<FormField label="Blood group">
								<select className="field-input" value={form.bloodGroup} onChange={(e) => update('bloodGroup', e.target.value)}>
									{BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
								</select>
							</FormField>
							<FormField label="Units required">
								<input className="field-input" type="number" min={1} max={10} value={form.unitsRequired} onChange={(e) => update('unitsRequired', Number(e.target.value))} />
							</FormField>
							<FormField label="Required date">
								<input className="field-input" type="date" value={form.requiredDate} onChange={(e) => update('requiredDate', e.target.value)} />
							</FormField>
							<FormField label="Hospital">
								<input className="field-input" value={form.hospital} onChange={(e) => update('hospital', e.target.value)} placeholder="Hospital name" required />
							</FormField>
							<FormField label="Hospital location">
								<input className="field-input" value={form.hospitalLocation} onChange={(e) => update('hospitalLocation', e.target.value)} placeholder="City, area" />
							</FormField>
						</div>
						<FormField label="Message">
							<textarea className="field-input min-h-[100px]" value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Share any important context for the donor" />
						</FormField>
						{error ? <p className="text-sm text-rose-200">{error}</p> : null}
						<div className="flex flex-wrap gap-3 pt-2">
							<button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60">
								{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <HeartHandshake className="h-4 w-4" aria-hidden="true" />}
								Send Request
							</button>
							<button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
								Cancel
							</button>
						</div>
					</form>
				)}
			</div>
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

function buildDemoActivity(donor) {
	const list = [
		{ type: 'donation', when: '3 months ago' },
		{ type: 'verification', when: 'Last month' },
		{ type: 'availability', when: '2 days ago' },
	];
	if (donor.totalDonations > 1) list.unshift({ type: 'donation', when: 'Last year' });
	list.push({ type: 'respond', when: 'Recently' });
	return list;
}

function DonorProfileSkeleton() {
	return (
		<div className="min-h-screen overflow-x-hidden bg-blood-radial text-slate-100">
			<div className="section-shell py-8 sm:py-10 lg:py-12">
				<div className="h-4 w-64 animate-pulse rounded-full bg-white/10" />
				<div className="mt-6 h-10 w-40 animate-pulse rounded-full bg-white/10" />
				<div className="mt-6 glass-card rounded-[2rem] p-6 sm:p-8">
					<div className="flex items-start gap-5">
						<div className="h-20 w-20 animate-pulse rounded-3xl bg-white/10" />
						<div className="flex-1 space-y-3">
							<div className="h-6 w-1/3 animate-pulse rounded-full bg-white/10" />
							<div className="h-4 w-1/2 animate-pulse rounded-full bg-white/10" />
							<div className="h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
						</div>
					</div>
				</div>
				<div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
					<div className="space-y-6">
						<div className="glass-card h-44 animate-pulse rounded-[2rem]" />
						<div className="glass-card h-64 animate-pulse rounded-[2rem]" />
					</div>
					<div className="space-y-6">
						<div className="glass-card h-40 animate-pulse rounded-[2rem]" />
						<div className="glass-card h-56 animate-pulse rounded-[2rem]" />
					</div>
				</div>
			</div>
		</div>
	);
}
