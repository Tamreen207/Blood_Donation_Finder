import { useEffect, useMemo, useState } from 'react';
import {
	AlertTriangle,
	ArrowRight,
	BadgeCheck,
	Building2,
	CalendarClock,
	CheckCircle2,
	ChevronDown,
	Clock3,
	Filter,
	LayoutDashboard,
	LoaderCircle,
	MapPin,
	Navigation2,
	Phone,
	RefreshCcw,
	Search,
	ShieldCheck,
	Sparkles,
	Star,
	Target,
	Users,
	X,
} from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import MapPlaceholder from '../components/MapPlaceholder';
import { getBrowserLocation } from '../services/locationService';
import { fetchNearbyDonors, isDonorApiConfigured, searchDonors } from '../services/donorService';
import { getCompatibleDonorGroups } from '../utils/bloodCompatibility';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const searchRadiusOptions = ['5 km', '10 km', '25 km', '50 km', '100 km'];
const availabilityOptions = ['Available Now', 'Available This Week', 'All'];
const distanceOptions = ['5 km', '10 km', '25 km', '50 km', '100 km'];
const lastDonationOptions = ['Any', 'Within 3 months', 'Within 6 months', 'Within 12 months'];
const sortOptions = ['Nearest', 'Recently Active', 'Recently Verified'];

const sidebarItems = [
	{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
	{ label: 'Find Blood', to: '/find-blood', icon: Search },
	{ label: 'Find Donor', to: '/find-donor', icon: Users, active: true },
	{ label: 'Blood Banks', to: '/blood-banks', icon: Building2 },
	{ label: 'My Requests', to: '/dashboard', icon: Sparkles },
	{ label: 'Donation History', to: '/dashboard', icon: Sparkles },
	{ label: 'Notifications', to: '/dashboard', icon: Sparkles },
	{ label: 'Profile', to: '/dashboard', icon: BadgeCheck },
	{ label: 'Settings', to: '/dashboard', icon: Sparkles },
	{ label: 'Logout', to: '/login', icon: Sparkles },
];

const demoDonors = [
	{
		id: 'DN-1001',
		displayName: 'Rahul',
		bloodGroup: 'O+',
		verified: true,
		distanceKm: 3.2,
		area: 'North Ward',
		availability: 'Available Now',
		lastDonation: '3 months ago',
		eligibility: 'Eligible to donate',
		recentActivity: 'Active 2 hours ago',
		verifiedAt: 'Verified this month',
		lastVerified: '2 weeks ago',
		approxLocation: 'North Ward area',
		phone: '+1 (555) 301-1101',
		email: 'rahul@example.com',
		contactAllowed: true,
	},
	{
		id: 'DN-1002',
		displayName: 'Anita',
		bloodGroup: 'A+',
		verified: true,
		distanceKm: 4.6,
		area: 'Downtown',
		availability: 'Available Soon',
		lastDonation: '5 months ago',
		eligibility: 'Eligible with scheduling',
		recentActivity: 'Active today',
		verifiedAt: 'Verified last week',
		lastVerified: '1 week ago',
		approxLocation: 'Downtown area',
		phone: '+1 (555) 301-2202',
		email: 'anita@example.com',
		contactAllowed: true,
	},
	{
		id: 'DN-1003',
		displayName: 'Suresh',
		bloodGroup: 'B-',
		verified: true,
		distanceKm: 6.1,
		area: 'West End',
		availability: 'Unavailable',
		lastDonation: '4 months ago',
		eligibility: 'Temporarily paused',
		recentActivity: 'Active yesterday',
		verifiedAt: 'Verified 3 weeks ago',
		lastVerified: '3 weeks ago',
		approxLocation: 'West End area',
		phone: '+1 (555) 301-3303',
		email: 'suresh@example.com',
		contactAllowed: false,
	},
	{
		id: 'DN-1004',
		displayName: 'Meera',
		bloodGroup: 'AB+',
		verified: true,
		distanceKm: 8.4,
		area: 'Central Park',
		availability: 'Available Now',
		lastDonation: '6 months ago',
		eligibility: 'Eligible to donate',
		recentActivity: 'Active 30 minutes ago',
		verifiedAt: 'Verified this month',
		lastVerified: '2 weeks ago',
		approxLocation: 'Central Park area',
		phone: '+1 (555) 301-4404',
		email: 'meera@example.com',
		contactAllowed: true,
	},
];

const demoLocationLabel = 'Health District, City Center';

function createDefaultSearchForm(initialBloodGroup = 'O+') {
	return {
		bloodGroup: initialBloodGroup,
		location: '',
		radius: '10 km',
		availability: 'Available Now',
	};
}

function createDefaultFilterForm(initialBloodGroup = 'O+') {
	return {
		bloodGroup: initialBloodGroup,
		distance: '25 km',
		availability: 'Available Now',
		verifiedOnly: true,
		lastDonation: 'Any',
		location: '',
	};
}

function normalizeDonor(record, index = 0) {
	if (!record) {
		return null;
	}

	return {
		id: record.id ?? record._id ?? `donor-${index}`,
		displayName: record.displayName ?? record.firstName ?? record.name ?? record.publicName ?? `Donor ${index + 1}`,
		bloodGroup: record.bloodGroup ?? record.group ?? 'O+',
		verified: Boolean(record.verified ?? record.isVerified ?? true),
		distanceKm: Number(record.distanceKm ?? record.distance ?? record.miles ?? 0),
		area: record.area ?? record.location ?? record.city ?? 'Nearby area',
		availability: record.availability ?? record.status ?? 'Available Now',
		lastDonation: record.lastDonation ?? record.lastDonationDate ?? 'Recently',
		eligibility: record.eligibility ?? record.eligibilityStatus ?? 'Eligible to donate',
		recentActivity: record.recentActivity ?? record.activeAt ?? 'Recently active',
		verifiedAt: record.verifiedAt ?? record.lastVerified ?? 'Verified by platform',
		approxLocation: record.approxLocation ?? record.neighborhood ?? record.area ?? 'Approximate area',
		phone: record.phone ?? record.contactPhone ?? '+1 (555) 000-0000',
		email: record.email ?? record.contactEmail ?? 'contact@lifelink.example',
		contactAllowed: Boolean(record.contactAllowed ?? record.canContact ?? true),
		lat: record.latitude ?? record.lat ?? null,
		lng: record.longitude ?? record.lng ?? null,
	};
}

function getAvailabilityTone(availability) {
	if (availability === 'Available Now') {
		return 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200';
	}

	if (availability === 'Available Soon') {
		return 'border-amber-400/20 bg-amber-500/10 text-amber-100';
	}

	return 'border-rose-400/20 bg-rose-500/10 text-rose-200';
}

function matchesLastDonation(record, filterValue) {
	if (filterValue === 'Any') {
		return true;
	}

	const months = Number.parseInt((record.lastDonation ?? '').match(/\d+/)?.[0] ?? '0', 10);
	if (filterValue === 'Within 3 months') {
		return months > 0 && months <= 3;
	}
	if (filterValue === 'Within 6 months') {
		return months > 0 && months <= 6;
	}
	return months > 0 && months <= 12;
}

function buildSearchState(searchForm, filterForm, locationData) {
	return {
		bloodGroup: filterForm.bloodGroup || searchForm.bloodGroup,
		location: filterForm.location || searchForm.location || locationData.label,
		latitude: locationData.latitude,
		longitude: locationData.longitude,
		radius: filterForm.distance || searchForm.radius,
		availability: filterForm.availability || searchForm.availability,
		verified: filterForm.verifiedOnly,
	};
}

function FindDonorPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const location = useLocation();
	const initialBloodGroup = searchParams.get('bloodGroup') || location.state?.bloodGroup || 'O+';
	const [searchForm, setSearchForm] = useState(createDefaultSearchForm(initialBloodGroup));
	const [filterForm, setFilterForm] = useState(createDefaultFilterForm(initialBloodGroup));
	const [appliedFilterForm, setAppliedFilterForm] = useState(createDefaultFilterForm(initialBloodGroup));
	const [selectedDonor, setSelectedDonor] = useState(null);
	const [contactDonor, setContactDonor] = useState(null);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [loading, setLoading] = useState(true);
	const [searching, setSearching] = useState(false);
	const [error, setError] = useState('');
	const [noResults, setNoResults] = useState(false);
	const [results, setResults] = useState(demoDonors);
	const [locationData, setLocationData] = useState({ latitude: null, longitude: null, label: demoLocationLabel });
	const [locationStatus, setLocationStatus] = useState('Using manual location');
	const [demoMode, setDemoMode] = useState(!isDonorApiConfigured());
	const [profileNotice, setProfileNotice] = useState('');
	const [contactNotice, setContactNotice] = useState('');
	const [sortBy, setSortBy] = useState('Nearest');

	useEffect(() => {
		loadDonors(buildSearchState(searchForm, appliedFilterForm, locationData), false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function loadDonors(payload, fromAction = true) {
		setSearching(true);
		setLoading(true);
		setError('');
		setNoResults(false);

		try {
			const [searchResponse, nearbyResponse] = await Promise.all([
				searchDonors(payload),
				fetchNearbyDonors(payload),
			]);

			const combined = [
				...(Array.isArray(searchResponse?.results) ? searchResponse.results : []),
				...(Array.isArray(nearbyResponse?.results) ? nearbyResponse.results : []),
			];
			const normalized = combined.map((record, index) => normalizeDonor(record, index)).filter(Boolean);
			const nextResults = normalized.length > 0 ? dedupeDonors(normalized) : demoDonors;

			setResults(nextResults);
			setDemoMode(!isDonorApiConfigured());
			if (fromAction && nextResults.length === 0) {
				setNoResults(true);
			}
		} catch (requestError) {
			if (!isDonorApiConfigured()) {
				setResults(demoDonors);
				setDemoMode(true);
			} else {
				setError('Unable to find donors right now.');
				setResults([]);
			}
		}
		finally {
			setLoading(false);
			setSearching(false);
		}
	}

	function handleSearchSubmit(event) {
		event.preventDefault();
		loadDonors(buildSearchState(searchForm, appliedFilterForm, locationData), true);
	}

	function handleApplyFilters() {
		setAppliedFilterForm(filterForm);
		loadDonors(buildSearchState(searchForm, filterForm, locationData), true);
		setFiltersOpen(false);
	}

	function handleClearFilters() {
		const cleared = createDefaultFilterForm(searchForm.bloodGroup);
		setFilterForm(cleared);
		setAppliedFilterForm(cleared);
		loadDonors(buildSearchState(searchForm, cleared, locationData), true);
	}

	async function handleUseLocation() {
		setError('');
		setLocationStatus('Requesting browser location...');
		try {
			const currentLocation = await getBrowserLocation();
			const nextLocation = { ...currentLocation, label: 'Current location' };
			setLocationData(nextLocation);
			setLocationStatus('Using browser location');
			setSearchForm((current) => ({ ...current, location: 'Current location' }));
			setFilterForm((current) => ({ ...current, location: 'Current location' }));
			setAppliedFilterForm((current) => ({ ...current, location: 'Current location' }));
			loadDonors(buildSearchState({ ...searchForm, location: 'Current location' }, appliedFilterForm, nextLocation), true);
		} catch (locationError) {
			setLocationStatus(locationError instanceof Error ? locationError.message : 'Location access was not allowed. Please enter your location manually.');
		}
	}

	const compatibleGroups = useMemo(() => getCompatibleDonorGroups(searchForm.bloodGroup), [searchForm.bloodGroup]);

	const filteredResults = useMemo(() => {
		const items = results.filter((donor) => {
			const bloodGroupMatches = filterForm.bloodGroup === 'All' || donor.bloodGroup === filterForm.bloodGroup;
			const distanceLimit = Number.parseInt(filterForm.distance, 10);
			const distanceMatches = Number.isNaN(distanceLimit) ? true : donor.distanceKm <= distanceLimit;
			const availabilityMatches = filterForm.availability === 'All' || donor.availability === filterForm.availability;
			const verifiedMatches = !filterForm.verifiedOnly || donor.verified;
			const locationMatches = !filterForm.location || donor.area.toLowerCase().includes(filterForm.location.toLowerCase());
			const lastDonationMatches = matchesLastDonation(donor, filterForm.lastDonation);
			return bloodGroupMatches && distanceMatches && availabilityMatches && verifiedMatches && locationMatches && lastDonationMatches;
		});

		if (sortBy === 'Nearest') {
			return [...items].sort((a, b) => a.distanceKm - b.distanceKm);
		}

		if (sortBy === 'Recently Active') {
			return [...items].sort((a, b) => compareTextDescending(a.recentActivity, b.recentActivity));
		}

		return [...items].sort((a, b) => compareTextDescending(a.lastVerified, b.lastVerified));
	}, [filterForm, results, sortBy]);

	const mapSubtitle = demoMode
		? 'Approximate donor areas and search radius are shown here. Exact home locations are never exposed.'
		: 'Approximate donor areas, your location, and search radius are ready for mapping integration without exposing private addresses.';

	return (
		<div className="min-h-screen overflow-x-hidden bg-blood-radial text-slate-100">
			<div className="flex min-h-screen">
				<div className={`fixed inset-0 z-40 bg-slate-950/70 lg:hidden ${filtersOpen ? 'block' : 'hidden'}`} onClick={() => setFiltersOpen(false)} />

				<aside className={`fixed inset-y-0 left-0 z-50 w-80 border-r border-white/10 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${filtersOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
					<div className="flex h-full flex-col">
						<div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
							<Link to="/" className="flex items-center gap-3" onClick={() => setFiltersOpen(false)}>
								<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-glow shadow-rose-500/30">
									<span className="text-lg font-bold text-white">L</span>
								</span>
								<div>
									<p className="text-lg font-semibold leading-none text-white">LifeLink</p>
									<p className="text-xs text-slate-400">Find Donor</p>
								</div>
							</Link>
							<button type="button" className="rounded-full border border-white/10 p-2 text-slate-200 lg:hidden" onClick={() => setFiltersOpen(false)} aria-label="Close filters drawer">
								<X className="h-5 w-5" aria-hidden="true" />
							</button>
						</div>

						<nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
							{sidebarItems.map((item) => {
								const Icon = item.icon;
								return (
									<Link key={item.label} to={item.to} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${item.active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`} onClick={() => setFiltersOpen(false)}>
										<Icon className="h-5 w-5" aria-hidden="true" />
										<span>{item.label}</span>
									</Link>
								);
							})}
						</nav>

						<div className="border-t border-white/10 px-6 py-5">
							<div className="glass-card rounded-3xl p-4">
								<p className="text-sm font-medium text-white">Need urgent help?</p>
								<p className="mt-1 text-sm text-slate-400">Create an emergency request when no donor matches fast enough.</p>
								<Link to="/emergency-request" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
									<AlertTriangle className="h-4 w-4" aria-hidden="true" />
									Create Emergency Request
								</Link>
							</div>
						</div>
					</div>
				</aside>

				<main className="flex-1 lg:pl-80">
					<div className="section-shell py-6 sm:py-8 lg:py-10">
						<div className="space-y-6">
							<header className="glass-card rounded-[2rem] p-6 sm:p-8">
								<div className="flex flex-wrap items-center justify-between gap-4">
									<div>
										<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Find a Blood Donor</p>
										<h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Find a Blood Donor</h1>
										<p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">Find available blood donors near you and connect when help is needed.</p>
										<div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
											<ShieldCheck className="h-4 w-4" aria-hidden="true" />
											Verified donors • Privacy protected
										</div>
									</div>
									<button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 lg:hidden" onClick={() => setFiltersOpen(true)}>
										<Filter className="h-4 w-4" aria-hidden="true" />
										Open Filters
									</button>
								</div>
							</header>

							<div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
								<div className="space-y-6">
									<section className="glass-card rounded-[2rem] p-6 sm:p-8">
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Search Panel</p>
												<h2 className="mt-2 text-2xl font-semibold text-white">Search nearby donors</h2>
											</div>
											<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><Search className="h-5 w-5" aria-hidden="true" /></div>
										</div>

										<form onSubmit={handleSearchSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
											<LabelledField label="Blood Group">
												<select value={searchForm.bloodGroup} onChange={(event) => {
													setSearchForm((current) => ({ ...current, bloodGroup: event.target.value }));
													setFilterForm((current) => ({ ...current, bloodGroup: event.target.value }));
												}} className="field-input">
													{bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
												</select>
											</LabelledField>
											<LabelledField label="Location">
												<input value={searchForm.location} onChange={(event) => {
													const value = event.target.value;
													setSearchForm((current) => ({ ...current, location: value }));
													setFilterForm((current) => ({ ...current, location: value }));
												}} className="field-input" placeholder="City, area, PIN code" />
											</LabelledField>
											<LabelledField label="Search Radius">
												<select value={searchForm.radius} onChange={(event) => {
													const value = event.target.value;
													setSearchForm((current) => ({ ...current, radius: value }));
													setFilterForm((current) => ({ ...current, distance: value }));
												}} className="field-input">
													{searchRadiusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
												</select>
											</LabelledField>
											<LabelledField label="Availability">
												<select value={searchForm.availability} onChange={(event) => {
													const value = event.target.value;
													setSearchForm((current) => ({ ...current, availability: value }));
													setFilterForm((current) => ({ ...current, availability: value }));
												}} className="field-input">
													{availabilityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
												</select>
											</LabelledField>
											<div className="sm:col-span-2 flex flex-wrap gap-3">
												<button type="button" onClick={handleUseLocation} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
													<Target className="h-4 w-4" aria-hidden="true" />
													Use My Location
												</button>
												<button type="submit" disabled={searching} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
													{searching ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
													Find Donors
												</button>
											</div>
										</form>
										<div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
											Current search location: <span className="font-semibold text-white">{locationData.label}</span>
											<div className="mt-2 text-slate-400">{locationStatus}</div>
										</div>
										{error ? <div className="mt-4 rounded-3xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div> : null}
									</section>

									<section className="glass-card rounded-[2rem] p-6 sm:p-8">
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Compatible Blood Group Information</p>
												<h2 className="mt-2 text-2xl font-semibold text-white">Compatible donor groups for {searchForm.bloodGroup}</h2>
											</div>
											<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><BadgeCheck className="h-5 w-5" aria-hidden="true" /></div>
										</div>
										<p className="mt-4 text-sm leading-7 text-slate-300">When the recipient blood group is set, LifeLink shows only compatible donor groups. The logic stays reusable and never displays incorrect compatibility information.</p>
										<div className="mt-5 flex flex-wrap gap-3">
											{compatibleGroups.map((group) => <span key={group} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">{group}</span>)}
										</div>
										<p className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
											<ShieldCheck className="h-4 w-4" aria-hidden="true" />
											Identity and donor information verified by the platform.
										</p>
									</section>

									<section className="glass-card rounded-[2rem] p-6 sm:p-8">
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Filters</p>
												<h2 className="mt-2 text-2xl font-semibold text-white">Refine donor matches</h2>
											</div>
											<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><Filter className="h-5 w-5" aria-hidden="true" /></div>
										</div>
										<div className="mt-6 grid gap-4 sm:grid-cols-2">
											<LabelledField label="Blood Group">
												<select value={filterForm.bloodGroup} onChange={(event) => setFilterForm((current) => ({ ...current, bloodGroup: event.target.value }))} className="field-input">
													<option value="All">All</option>
													{bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
												</select>
											</LabelledField>
											<LabelledField label="Distance">
												<select value={filterForm.distance} onChange={(event) => setFilterForm((current) => ({ ...current, distance: event.target.value }))} className="field-input">
													{distanceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
												</select>
											</LabelledField>
											<LabelledField label="Availability">
												<select value={filterForm.availability} onChange={(event) => setFilterForm((current) => ({ ...current, availability: event.target.value }))} className="field-input">
													<option value="All">All</option>
													{availabilityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
												</select>
											</LabelledField>
											<LabelledField label="Last Donation">
												<select value={filterForm.lastDonation} onChange={(event) => setFilterForm((current) => ({ ...current, lastDonation: event.target.value }))} className="field-input">
													{lastDonationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
												</select>
											</LabelledField>
											<LabelledField label="Location">
												<input value={filterForm.location} onChange={(event) => setFilterForm((current) => ({ ...current, location: event.target.value }))} className="field-input" placeholder="Area or city" />
											</LabelledField>
											<div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 sm:col-span-2">
												<div>
													<p className="text-sm font-medium text-white">Verified Only</p>
													<p className="text-xs text-slate-400">Show only donors with verified identity.</p>
												</div>
												<button type="button" role="switch" aria-checked={filterForm.verifiedOnly} onClick={() => setFilterForm((current) => ({ ...current, verifiedOnly: !current.verifiedOnly }))} className={`inline-flex h-7 w-12 items-center rounded-full p-1 transition ${filterForm.verifiedOnly ? 'bg-emerald-400/30' : 'bg-white/10'}`}>
													<span className={`h-5 w-5 rounded-full bg-white transition ${filterForm.verifiedOnly ? 'translate-x-5' : 'translate-x-0'}`} />
												</button>
											</div>
										</div>
										<div className="mt-6 flex flex-wrap gap-3">
											<button type="button" onClick={handleApplyFilters} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">
												<Filter className="h-4 w-4" aria-hidden="true" />
												Apply Filters
											</button>
											<button type="button" onClick={handleClearFilters} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
												<RefreshCcw className="h-4 w-4" aria-hidden="true" />
												Clear Filters
											</button>
										</div>
									</section>

									<section className="glass-card rounded-[2rem] p-6 sm:p-8">
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Privacy Notice</p>
												<h2 className="mt-2 text-2xl font-semibold text-white">Donor privacy matters</h2>
											</div>
											<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></div>
										</div>
										<p className="mt-4 text-sm leading-7 text-slate-300">Exact addresses and private contact information are never publicly displayed. Contact details are shared only after consent is requested and approved.</p>
									</section>
								</div>

								<div className="space-y-6">
									<section className="glass-card rounded-[2rem] p-6 sm:p-8">
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Sorting</p>
												<h2 className="mt-2 text-2xl font-semibold text-white">Sort By</h2>
											</div>
											<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><ChevronDown className="h-5 w-5" aria-hidden="true" /></div>
										</div>
										<select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="field-input mt-5">
											{sortOptions.map((option) => <option key={option} value={option}>{option}</option>)}
										</select>
										<div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
											{loading ? 'Searching for nearby donors...' : `${filteredResults.length} donors match your current filters.`}
										</div>
									</section>

									<section className="glass-card rounded-[2rem] p-6 sm:p-8">
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Map</p>
												<h2 className="mt-2 text-2xl font-semibold text-white">Approximate donor locations</h2>
											</div>
											<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><Navigation2 className="h-5 w-5" aria-hidden="true" /></div>
										</div>
										<div className="mt-6">
											<MapPlaceholder title="Donor location map" subtitle={mapSubtitle} tags={["Your location", "Approximate donor areas", `Radius: ${searchForm.radius}`]} />
										</div>
									</section>

									<section className="glass-card rounded-[2rem] p-6 sm:p-8">
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Emergency CTA</p>
												<h2 className="mt-2 text-2xl font-semibold text-white">Can't find a donor?</h2>
											</div>
											<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></div>
										</div>
										<p className="mt-4 text-sm leading-7 text-slate-300">Create an emergency blood request and notify matching donors and nearby blood banks.</p>
										<Link to="/emergency-request" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-rose-100">
											Create Emergency Request
										</Link>
									</section>

									<section className="glass-card rounded-[2rem] p-6 sm:p-8">
										<div className="flex items-center justify-between gap-3">
											<div>
												<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Search Results</p>
												<h2 className="mt-2 text-2xl font-semibold text-white">Available Donors Nearby</h2>
											</div>
											<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><Users className="h-5 w-5" aria-hidden="true" /></div>
										</div>

										{demoMode ? <p className="mt-4 rounded-3xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">Sample donor data is shown because the backend is not connected yet.</p> : null}
										{loading ? (
											<div className="mt-6 space-y-4">
												<p className="text-sm text-slate-300">Searching for nearby donors...</p>
												{Array.from({ length: 3 }).map((_, index) => <DonorSkeleton key={index} />)}
											</div>
										) : error ? (
											<StateCard
												title="Unable to find donors right now."
												description="Please try again in a moment."
												primary={<button type="button" onClick={() => loadDonors(buildSearchState(searchForm, appliedFilterForm, locationData), true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">Try Again</button>}
											/>
										) : noResults || filteredResults.length === 0 ? (
											<EmptyState
												onRadius={() => setFilterForm((current) => ({ ...current, distance: '100 km' }))}
												onLocation={() => setFilterForm((current) => ({ ...current, location: '' }))}
												onCompatibility={() => setSearchForm((current) => ({ ...current, bloodGroup: compatibleGroups[0] ?? 'O+' }))}
											/>
										) : (
											<div className="mt-6 grid gap-4">
												{filteredResults.map((donor) => (
													<DonorCard key={donor.id} donor={donor} onViewProfile={() => setSelectedDonor(donor)} onContactDonor={() => setContactDonor(donor)} bloodGroup={searchForm.bloodGroup} />
												))}
											</div>
										)}
									</section>
								</div>
							</div>
						</div>
					</div>
				</main>
			</div>

			{selectedDonor ? <DonorProfileDrawer donor={selectedDonor} onClose={() => setSelectedDonor(null)} onContact={() => setContactDonor(selectedDonor)} onRequestBlood={() => setSearchParams({ donorId: selectedDonor.id, bloodGroup: searchForm.bloodGroup })} /> : null}
			{contactDonor ? <ContactConsentModal donor={contactDonor} onClose={() => setContactDonor(null)} onNotice={setContactNotice} notice={contactNotice} /> : null}

			<div className="fixed inset-x-4 bottom-4 z-50 lg:hidden">
				<button type="button" onClick={() => setFiltersOpen(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-4 text-sm font-semibold text-white shadow-2xl shadow-rose-500/30">
					<Filter className="h-4 w-4" aria-hidden="true" />
					Open Filters
				</button>
			</div>
		</div>
	);
}

function dedupeDonors(donors) {
	const seen = new Set();
	return donors.filter((donor) => {
		if (seen.has(donor.id)) {
			return false;
		}
		seen.add(donor.id);
		return true;
	});
}

function compareTextDescending(a = '', b = '') {
	return String(b).localeCompare(String(a));
}

function LabelledField({ label, children }) {
	return (
		<label className="block">
			<span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
			{children}
		</label>
	);
}

function DonorCard({ donor, onViewProfile, onContactDonor, bloodGroup }) {
	const badgeTone = getAvailabilityTone(donor.availability);
	const verifiedLabel = donor.verified ? 'Verified Donor' : 'Unverified Donor';

	return (
		<article className="glass-card rounded-[2rem] p-6 transition hover:-translate-y-1 hover:border-white/20">
			<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
				<div className="space-y-4">
					<div className="flex flex-wrap items-center gap-3">
						<h3 className="text-2xl font-semibold text-white">{donor.displayName}</h3>
						<span className="rounded-full bg-white/5 px-3 py-1 text-sm font-semibold text-white">{donor.bloodGroup}</span>
						<span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200" title="Identity and donor information verified by the platform.">
							<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
							{verifiedLabel}
						</span>
					</div>
					<p className="text-sm text-slate-300">{donor.area}</p>
					<div className="flex flex-wrap gap-3 text-sm text-slate-400">
						<span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-rose-200" aria-hidden="true" />{donor.distanceKm.toFixed(1)} km away</span>
						<span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-rose-200" aria-hidden="true" />{donor.recentActivity}</span>
						<span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4 text-rose-200" aria-hidden="true" />Last donation: {donor.lastDonation}</span>
					</div>
					<div className="flex flex-wrap gap-2 text-xs text-slate-300">
						<span className={`rounded-full border px-3 py-1 font-semibold ${badgeTone}`}>{donor.availability}</span>
						<span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-200">{donor.eligibility}</span>
					</div>
				</div>
				<div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
					<p className="text-xs uppercase tracking-[0.25em] text-rose-200/70">Approximate Location</p>
					<p className="mt-2 font-semibold text-white">{donor.approxLocation}</p>
					<p className="mt-2 text-slate-400">Private contact information stays hidden until consent is approved.</p>
				</div>
			</div>
			<div className="mt-5 flex flex-wrap gap-3">
				<Link to={`/donor/${encodeURIComponent(donor.id)}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
					View Profile
				</Link>
				<button type="button" onClick={onContactDonor} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white">
					Contact Donor
				</button>
				<Link to="/request-blood" state={{ donor: { id: donor.id, name: donor.displayName, bloodGroup: donor.bloodGroup, distance: donor.distanceKm, area: donor.area }, bloodGroup, source: 'find-donor' }} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
					Request Blood
				</Link>
			</div>
		</article>
	);
}

function DonorProfileDrawer({ donor, onClose, onContact, onRequestBlood }) {
	return (
		<div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/80 backdrop-blur-md">
			<div className="h-full w-full max-w-xl overflow-y-auto bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/50">
				<div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
					<div>
						<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">View Profile</p>
						<h3 className="mt-2 text-2xl font-semibold text-white">{donor.displayName}</h3>
					</div>
					<button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10" aria-label="Close donor profile">
						<X className="h-5 w-5" aria-hidden="true" />
					</button>
				</div>
				<div className="mt-6 space-y-4">
					<div className="glass-card rounded-[1.75rem] p-5">
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="text-sm text-slate-400">Blood Group</p>
								<p className="mt-1 text-3xl font-semibold text-white">{donor.bloodGroup}</p>
							</div>
							<span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Verified</span>
						</div>
						<p className="mt-4 text-sm text-slate-300">Identity and donor information verified by the platform.</p>
					</div>
					<div className="glass-card rounded-[1.75rem] p-5">
						<p className="text-sm uppercase tracking-[0.25em] text-slate-400">Public Information</p>
						<div className="mt-4 grid gap-3 text-sm text-slate-300">
							<ProfileLine label="Location area" value={donor.area} />
							<ProfileLine label="Approximate area" value={donor.approxLocation} />
							<ProfileLine label="Distance" value={`${donor.distanceKm.toFixed(1)} km away`} />
							<ProfileLine label="Availability" value={donor.availability} />
							<ProfileLine label="Eligibility" value={donor.eligibility} />
							<ProfileLine label="Last donation" value={donor.lastDonation} />
							<ProfileLine label="Recent activity" value={donor.recentActivity} />
						</div>
					</div>
					<div className="glass-card rounded-[1.75rem] p-5">
						<p className="text-sm uppercase tracking-[0.25em] text-slate-400">Privacy</p>
						<p className="mt-3 text-sm leading-7 text-slate-300">Exact addresses and private contact information are never publicly displayed. Contact is shared only after consent is requested.</p>
					</div>
					<div className="flex flex-wrap gap-3">
						<button type="button" onClick={onContact} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">Contact Donor</button>
						<button type="button" onClick={onRequestBlood} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Request Blood</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function ContactConsentModal({ donor, onClose, onNotice, notice }) {
	const [agreed, setAgreed] = useState(false);
	const [sending, setSending] = useState(false);
	const [fieldError, setFieldError] = useState('');

	async function handleSubmit(event) {
		event.preventDefault();
		setFieldError('');
		if (!agreed) {
			setFieldError('Please confirm that you understand donor privacy before sending a request.');
			return;
		}

		setSending(true);
		await new Promise((resolve) => window.setTimeout(resolve, 250));
		onNotice('Contact request sent. Exact donor contact details remain private until approval is granted.');
		setSending(false);
	}

	return (
		<div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md">
			<div className="glass-card w-full max-w-2xl rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Contact Donor</p>
						<h3 className="mt-2 text-2xl font-semibold text-white">Request consent to contact {donor.displayName}</h3>
					</div>
					<button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10" aria-label="Close contact request">
						<X className="h-5 w-5" aria-hidden="true" />
					</button>
				</div>
				<form onSubmit={handleSubmit} className="mt-6 space-y-4">
					<div className="rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-5 text-sm leading-7 text-slate-300">
						Contact details stay private until the donor approves sharing. This request records your intent and keeps the interaction privacy-safe.
					</div>
					<label className="flex items-start gap-3 rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-200">
						<input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-rose-500 focus:ring-rose-500" />
						<span>I understand that exact contact information is shared only after donor consent is granted.</span>
					</label>
					{fieldError ? <p className="text-sm text-rose-200">{fieldError}</p> : null}
					{notice ? <p className="text-sm text-amber-100">{notice}</p> : null}
					<div className="flex flex-wrap gap-3 pt-2">
						<button type="submit" disabled={sending} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60">
							{sending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Phone className="h-4 w-4" aria-hidden="true" />}
							Send Contact Request
						</button>
						<button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Cancel</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function ProfileLine({ label, value }) {
	return (
		<div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
			<span className="text-slate-400">{label}</span>
			<span className="text-right font-medium text-white">{value}</span>
		</div>
	);
}

function EmptyState({ onRadius, onLocation, onCompatibility }) {
	return (
		<div className="rounded-[1.75rem] border border-dashed border-white/15 bg-slate-950/30 p-6 text-center">
			<p className="text-lg font-semibold text-white">No matching donors found nearby.</p>
			<div className="mt-4 grid gap-3 text-left sm:grid-cols-2">
				<button type="button" onClick={onRadius} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10">Increase search radius</button>
				<button type="button" onClick={onLocation} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10">Try another location</button>
				<button type="button" onClick={onCompatibility} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10">Search compatible blood groups</button>
				<Link to="/emergency-request" className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-100 hover:bg-rose-500/20">Create emergency request</Link>
			</div>
		</div>
	);
}

function DonorSkeleton() {
	return (
		<div className="glass-card rounded-[2rem] p-6 animate-pulse">
			<div className="flex items-start justify-between gap-4">
				<div className="space-y-3">
					<div className="h-6 w-48 rounded-full bg-white/10" />
					<div className="h-4 w-32 rounded-full bg-white/10" />
					<div className="flex flex-wrap gap-2">
						<div className="h-6 w-24 rounded-full bg-white/10" />
						<div className="h-6 w-28 rounded-full bg-white/10" />
					</div>
				</div>
				<div className="h-24 w-44 rounded-[1.75rem] bg-white/10" />
			</div>
			<div className="mt-5 h-4 w-full rounded-full bg-white/10" />
			<div className="mt-3 h-4 w-5/6 rounded-full bg-white/10" />
			<div className="mt-5 flex gap-3">
				<div className="h-10 w-28 rounded-full bg-white/10" />
				<div className="h-10 w-32 rounded-full bg-white/10" />
				<div className="h-10 w-32 rounded-full bg-white/10" />
			</div>
		</div>
	);
}

function StateCard({ title, description, primary }) {
	return (
		<div className="glass-card rounded-[2rem] p-8 text-center">
			<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-200">
				<AlertTriangle className="h-8 w-8" aria-hidden="true" />
			</div>
			<h2 className="mt-6 text-2xl font-semibold text-white">{title}</h2>
			<p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
			<div className="mt-6 flex flex-wrap justify-center gap-3">{primary}</div>
		</div>
	);
}

export default FindDonorPage;

function useNoOp() {
	return null;
}