import { useEffect, useMemo, useState } from 'react';
import {
	AlertTriangle,
	ArrowRight,
	ArrowUpDown,
	Building2,
	Filter,
	LayoutDashboard,
	LoaderCircle,
	MapPin,
	Navigation2,
	Phone,
	Search,
	ShieldCheck,
	Sparkles,
	UserRound,
	Users,
	X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MapPlaceholder from '../components/MapPlaceholder';
import { fetchBloodInventoryAvailability, fetchNearbyBloodBanks, fetchNearbyDonors, searchBloodAvailability } from '../services/bloodSearchService';
import { getBrowserLocation } from '../services/locationService';
import { demoBloodBanks, demoDonors } from '../data/bloodSearchDemoData';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const radii = ['5 km', '10 km', '25 km', '50 km', '100 km'];
const unitOptions = ['1', '2', '3', '4', '5+'];
const availabilityOptions = ['Available Now', 'All'];
const sortOptions = ['Nearest', 'Blood Availability', 'Recently Updated'];

const sidebarItems = [
	{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
	{ label: 'Find Blood', to: '/find-blood', icon: Search, active: true },
	{ label: 'Find Donor', to: '/find-donor', icon: Users },
	{ label: 'Blood Banks', to: '/blood-banks', icon: Building2 },
	{ label: 'My Requests', to: '/dashboard', icon: Sparkles },
	{ label: 'Donation History', to: '/dashboard', icon: Sparkles },
	{ label: 'Notifications', to: '/dashboard', icon: Sparkles },
	{ label: 'Profile', to: '/dashboard', icon: UserRound },
	{ label: 'Settings', to: '/dashboard', icon: Sparkles },
	{ label: 'Logout', to: '/login', icon: Sparkles },
];

const defaultFilters = {
	bloodGroup: 'O+',
	location: '',
	radius: '10 km',
	units: '2',
	availability: 'Available Now',
	sortBy: 'Nearest',
	verifiedOnly: true,
	bloodBankName: '',
};

// Blood compatibility rules (recipient can receive from these donor blood groups)
const compatibility = {
	'O-': ['O-'],
	'O+': ['O-', 'O+'],
	'A-': ['O-', 'A-'],
	'A+': ['O-', 'O+', 'A-', 'A+'],
	'B-': ['O-', 'B-'],
	'B+': ['O-', 'O+', 'B-', 'B+'],
	'AB-': ['O-', 'A-', 'B-', 'AB-'],
	'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

function parseRadiusKm(r) {
	if (!r) return 10;
	if (typeof r === 'number') return r;
	const m = String(r).match(/(\d+)/);
	return m ? parseInt(m[1], 10) : 10;
}

function canReceive(recipient, donor) {
	if (!recipient || !donor) return false;
	const allowed = compatibility[recipient] || [];
	return allowed.includes(donor);
}

function getRequiredUnits(units) {
	if (!units) return 0;
	if (units === '5+') return 5; // require at least 5 for 5+
	const n = parseInt(units, 10);
	if (isNaN(n)) return 0;
	return n;
}

function FindBloodPage() {
	const [search, setSearch] = useState(defaultFilters);
	const [results, setResults] = useState([]);
	const [donors, setDonors] = useState([]);
	const [location, setLocation] = useState({ latitude: null, longitude: null, label: 'Health District, City Center' });
	const [locationStatus, setLocationStatus] = useState('Using manual location');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [noResultsMode, setNoResultsMode] = useState(false);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [queryInput, setQueryInput] = useState('');
	const [dataSource, setDataSource] = useState('live'); // 'live' | 'demo'
	const [lastSearchParams, setLastSearchParams] = useState(null);

	useEffect(() => {
		// Initial load - try backend first, fallback to demo if needed
		performSearch({ ...defaultFilters, location: '' }, { isUserAction: false });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function getDemoResults(filters) {
		const radiusKm = parseRadiusKm(filters.radius);
		const required = getRequiredUnits(filters.units);
		const banks = demoBloodBanks
			.filter((bank) => {
				if (radiusKm && typeof bank.distance === 'number' && bank.distance > radiusKm) return false;
				if (filters.bloodBankName && bank.name && !bank.name.toLowerCase().includes(filters.bloodBankName.toLowerCase())) return false;
				return true;
			})
			.map((bank) => ({ ...bank, source: 'demo', isDemo: true }));
		
		const demoDonorsList = demoDonors
			.filter((d) => {
				if (radiusKm && typeof d.distance === 'number' && d.distance > radiusKm) return false;
				if (filters.verifiedOnly && !d.verified) return false;
				// Apply compatibility
				if (!canReceive(filters.bloodGroup, d.bloodGroup)) return false;
				return true;
			})
			.map((d) => ({ ...d, source: 'demo', isDemo: true }));
		
		return { banks, donors: demoDonorsList };
	}

	const [viewDemo, setViewDemo] = useState(false);

	async function performSearch(nextFilters, options = {}) {
		const { isUserAction = true } = options;
		try {
			const { isUserAction = true } = options;
			if (typeof window !== 'undefined') {
				try {
					window.history.pushState({}, '', window.location.pathname);
				} catch (_) {}
			}
			setLoading(true);
			setError('');
			setNoResultsMode(false);
			setLastSearchParams(nextFilters);
			setViewDemo(false);

			const searchPayload = {
				bloodGroup: nextFilters.bloodGroup,
				location: nextFilters.location || location.label,
				latitude: location.latitude,
				longitude: location.longitude,
				radius: nextFilters.radius,
				units: nextFilters.units,
				availability: nextFilters.availability,
			};

			// Always try to fetch live blood banks directly first
			try {
				const listData = await fetchNearbyBloodBanks({ ...searchPayload, radius: searchPayload.radius || '1000 km' });
				if (Array.isArray(listData) && listData.length > 0) {
					const mapped = listData.map((b) => ({
						id: b._id || b.id,
						name: b.name,
						address: b.address || b.city || '',
						distance: b.distance != null ? `${typeof b.distance === 'number' ? b.distance.toFixed(1) : b.distance} km` : (b.distanceLabel || '—'),
						distanceLabel: b.distanceLabel || (b.distance != null ? `${typeof b.distance === 'number' ? b.distance.toFixed(1) : b.distance} km` : undefined),
						phone: b.phone || '',
						status: b.isActive ? 'Open' : (b.status || 'Open'),
						updated: b.updated || 'Recently',
						isDemo: false,
						source: 'live',
						availability: (b.inventory || []).reduce ? ((b.inventory || []).reduce((acc, inv) => {
							acc[inv.bloodGroup] = { label: (inv.unitsAvailable > 0) ? (inv.unitsAvailable < 3 ? 'Low Stock' : 'Available') : 'Not Available', units: inv.unitsAvailable };
							return acc;
						}, {}) || b.availability || {}) : (b.availability || {}),
					}));
					setResults(mapped);
					setDonors([]);
					setSearch(nextFilters);
					setQueryInput(nextFilters.location || '');
					setError('');
					setDataSource('live');
					setNoResultsMode(false);
					setLoading(false);
					return;
				}
			} catch (_) {}

			// Try the existing service as fallback
			try {
				const [bloodResponse, donorResponse] = await Promise.allSettled([
					searchBloodAvailability(searchPayload),
					fetchNearbyDonors(searchPayload),
				]);

				let liveBanks = [];
				let liveDonors = [];
				let backendSucceeded = false;

				if (bloodResponse.status === 'fulfilled') {
					const data = bloodResponse.value;
					if (Array.isArray(data?.results) && data.results.length > 0) {
						liveBanks = data.results.map((b) => ({ ...b, source: 'live', isDemo: false }));
						backendSucceeded = true;
					} else if (Array.isArray(data) && data.length > 0) {
						liveBanks = data.map((b) => ({ ...b, source: 'live', isDemo: false }));
						backendSucceeded = true;
					}
				}

				if (donorResponse.status === 'fulfilled') {
					const data = donorResponse.value;
					if (Array.isArray(data) && data.length > 0) {
						liveDonors = data.map((d) => ({ ...d, source: 'live', isDemo: false }));
						backendSucceeded = true;
					} else if (Array.isArray(data?.results) && data.results.length > 0) {
						liveDonors = data.results.map((d) => ({ ...d, source: 'live', isDemo: false }));
						backendSucceeded = true;
					}
				}

				if (backendSucceeded && (liveBanks.length > 0 || liveDonors.length > 0)) {
					setResults(liveBanks);
					setDonors(liveDonors);
					setSearch(nextFilters);
					setQueryInput(nextFilters.location || queryInput);
					setDataSource('live');
					setError('');
					if (isUserAction && liveBanks.length === 0 && liveDonors.length === 0) {
						setNoResultsMode(true);
					}
					setLoading(false);
					return;
				}
			} catch (_) {}

			// If no live results, still don't auto-fallback to demo; show results if any empty or allow user to view demo
			setError('');
			setResults([]);
			setDonors([]);
			setSearch(nextFilters);
			setQueryInput(nextFilters.location || '');
			setDataSource('live');
			setNoResultsMode(true);
		} catch (err) {
			// Try to load from list as last resort
			try {
				const list = await fetchNearbyBloodBanks({ ...searchPayload });
				if (Array.isArray(list) && list.length > 0) {
					const mapped = list.map((b) => ({
						id: b._id || b.id,
						name: b.name,
						address: b.address || b.city || '',
						distance: b.distance != null ? `${typeof b.distance === 'number' ? b.distance.toFixed(1) : b.distance} km` : '—',
						distanceLabel: b.distance != null ? `${typeof b.distance === 'number' ? b.distance.toFixed(1) : b.distance} km` : undefined,
						phone: b.phone || '',
						status: b.isActive ? 'Open' : 'Closed',
						updated: 'Recently',
						isDemo: false,
						source: 'live',
						availability: (b.inventory || []).reduce((acc, inv) => {
							acc[inv.bloodGroup] = { label: inv.unitsAvailable > 0 ? (inv.unitsAvailable < 3 ? 'Low Stock' : 'Available') : 'Not Available', units: inv.unitsAvailable };
							return acc;
						}, {}) || {},
					}));
					setResults(mapped);
					setDonors([]);
					setSearch(nextFilters);
					setQueryInput(nextFilters.location || '');
					setError('');
					setDataSource('live');
					setNoResultsMode(mapped.length === 0);
					return;
				}
			} catch (_) {}
			setError('Unable to retrieve live blood availability. Please try again or view demo data.');
			setResults([]);
			setDonors([]);
			setSearch(nextFilters);
			setQueryInput(nextFilters.location || '');
			setDataSource('live');
			setNoResultsMode(true);
		} finally {
			setLoading(false);
		}
	}

	function handleClearFilters() {
		setSearch({ ...defaultFilters, location: '' });
		setQueryInput('');
		setLocation({ latitude: null, longitude: null, label: 'Health District, City Center' });
		setLocationStatus('Using manual location');
		setError('');
		setDataSource('live');
		setViewDemo(false);
		performSearch({ ...defaultFilters, location: '' }, { isUserAction: true });
		return false;
	}

	async function handleSearch(event) {
		if (event && typeof event.preventDefault === 'function') {
			event.preventDefault();
		}
		if (event && typeof event.stopPropagation === 'function') {
			event.stopPropagation();
		}
		setError('');
		setNoResultsMode(false);
		await performSearch({ ...search, location: queryInput }, { isUserAction: true });
	}

	function handleApplyFilters() {
		performSearch({ ...search, location: queryInput }, { isUserAction: true });
		return false;
	}

	function loadDemoData() {
		const demo = getDemoResults(lastSearchParams || search);
		setResults(demo.banks);
		setDonors(demo.donors);
		setDataSource('demo');
		setError('');
		setNoResultsMode(false);
		setViewDemo(true);
	}

	async function handleUseLocation() {
		setLoading(true);
		setError('');
		setLocationStatus('Requesting your location...');
		try {
			const currentLocation = await getBrowserLocation();
			setLocation({ ...currentLocation, label: currentLocation?.city ? `Current location - ${currentLocation.city}` : 'Current location' });
			setLocationStatus(currentLocation?.city ? `Using browser location (${currentLocation.city})` : 'Using browser location');
			await performSearch({ ...search, location: currentLocation?.city || 'Current location' }, { isUserAction: true });
		} catch (locationError) {
			setLocationStatus(locationError instanceof Error ? locationError.message : 'Location unavailable or permission denied. Please enter location manually.');
		} finally {
			setLoading(false);
		}
	}

	const filteredAndSortedResults = useMemo(() => {
		if (noResultsMode) return [];
		let items = [...results];

		// Filter by blood group availability - don't show bank as having if below required units or not available
		const required = getRequiredUnits(search.units);
		items = items.filter((result) => {
			const availability = result.availability?.[search.bloodGroup];
			if (search.availability === 'Available Now') {
				if (!availability) return false;
				if (availability.label === 'Not Available') return false;
				if (required > 0 && typeof availability.units === 'number' && availability.units < required) return false;
			} else if (search.availability === 'All') {
				// Still apply required units check if specified
				if (required > 0 && availability && typeof availability.units === 'number' && availability.units < required && availability.label !== 'Unknown') {
					// For unknown, don't filter out - show as unknown
					if (availability.units !== undefined) return false;
				}
			}
			if (search.bloodBankName && result.name && !result.name.toLowerCase().includes(search.bloodBankName.toLowerCase())) return false;
			if (search.verifiedOnly && result.verified === false && result.type !== 'donor') {
				// Only apply strict filter if data supports it; be lenient
			}
			return true;
		});

		if (search.sortBy === 'Nearest') {
			return [...items].sort((a, b) => {
				const da = typeof a.distance === 'number' ? a.distance : parseFloat(a.distance) || 9999;
				const db = typeof b.distance === 'number' ? b.distance : parseFloat(b.distance) || 9999;
				return da - db;
			});
		}
		if (search.sortBy === 'Recently Updated') {
			return [...items].sort((a, b) => (a.updatedAt && b.updatedAt ? new Date(b.updatedAt) - new Date(a.updatedAt) : (a.updated < b.updated ? 1 : -1)));
		}
		if (search.sortBy === 'Blood Availability') {
			return [...items].sort((a, b) => {
				const ua = a.availability?.[search.bloodGroup]?.units ?? -1;
				const ub = b.availability?.[search.bloodGroup]?.units ?? -1;
				return ub - ua;
			});
		}
		return items;
	}, [noResultsMode, results, search.availability, search.bloodGroup, search.sortBy, search.units, search.bloodBankName, search.verifiedOnly]);

	const compatibleDonors = useMemo(() => {
		if (!donors) return [];
		const radiusKm = parseRadiusKm(search.radius);
		return donors
			.filter((d) => {
				if (radiusKm && typeof d.distance === 'number' && d.distance > radiusKm) return false;
				if (search.verifiedOnly && d.verified === false) return false;
				if (!canReceive(search.bloodGroup, d.bloodGroup)) return false;
				return true;
			})
			.sort((a, b) => {
				const da = typeof a.distance === 'number' ? a.distance : parseFloat(a.distance) || 9999;
				const db = typeof b.distance === 'number' ? b.distance : parseFloat(b.distance) || 9999;
				return da - db;
			});
	}, [donors, search.bloodGroup, search.radius, search.verifiedOnly]);

	const totalResults = filteredAndSortedResults.length + compatibleDonors.length;

	return (
		<div className="min-h-screen overflow-x-hidden bg-blood-radial text-slate-100">
			<div className="flex min-h-screen">
				<div className={`fixed inset-0 z-40 bg-slate-950/70 lg:hidden ${filtersOpen ? 'block' : 'hidden'}`} onClick={() => setFiltersOpen(false)} />
				<aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${filtersOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
					<div className="flex h-full flex-col">
						<div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
							<Link to="/" className="flex items-center gap-3">
								<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-glow shadow-rose-500/30">
									<span className="text-lg font-bold text-white">L</span>
								</span>
								<div>
									<p className="text-lg font-semibold leading-none text-white">LifeLink</p>
									<p className="text-xs text-slate-400">Find Blood</p>
								</div>
							</Link>
							<button type="button" className="rounded-full border border-white/10 p-2 text-slate-200 lg:hidden" onClick={() => setFiltersOpen(false)} aria-label="Close sidebar">
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
								<p className="mt-1 text-sm text-slate-400">Create an emergency request if nothing matches.</p>
								<Link to="/emergency-request" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
									<AlertTriangle className="h-4 w-4" aria-hidden="true" />
									Emergency Request
								</Link>
							</div>
						</div>
					</div>
				</aside>

				<div className="flex min-h-screen flex-1 flex-col lg:pl-72">
					<header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
						<div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
							<div className="flex items-center gap-3">
								<button type="button" className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-slate-100 lg:hidden" onClick={() => setFiltersOpen(true)} aria-label="Open filters">
									<Filter className="h-5 w-5" aria-hidden="true" />
								</button>
								<div>
									<h1 className="text-2xl font-semibold tracking-tight text-white">Find Blood</h1>
									<p className="text-sm text-slate-400">Search for available blood from nearby blood banks and donors.</p>
								</div>
							</div>

							<div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:flex">
								<MapPin className="h-4 w-4 text-rose-300" aria-hidden="true" />
								{location.label}
							</div>
						</div>
					</header>

					<main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
						<section className="glass-card rounded-[2rem] p-6 sm:p-8">
							<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
								<div>
									<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Current search location</p>
									<p className="mt-2 text-lg font-semibold text-white">{location.label}</p>
									<p className="mt-1 text-sm text-slate-400">Search radius and matching resources are updated based on your selected filters.</p>
								</div>
								<div className="flex flex-wrap gap-3">
									<div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">{locationStatus}</div>
									{(viewDemo || dataSource === 'demo') && (
										<div className="rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">Demo Data — Not Live Inventory</div>
									)}
									{!(error) && dataSource === 'live' && !viewDemo && (
										<div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">LIVE</div>
									)}
									<Link to="/emergency-request" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
										Emergency Request
									</Link>
								</div>
							</div>
						</section>

						<section className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
							<aside className="glass-card rounded-[2rem] p-6 hidden lg:block">
								<div className="flex items-center justify-between gap-3">
									<div>
										<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Filters</p>
										<h2 className="mt-2 text-2xl font-semibold text-white">Refine results</h2>
									</div>
									<button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300" onClick={() => setFiltersOpen(false)}>
										<X className="h-4 w-4" aria-hidden="true" />
										Close
									</button>
								</div>
								<div className="mt-6 space-y-5">
									<FilterField label="Blood Group">
										<select value={search.bloodGroup} onChange={(e) => setSearch((current) => ({ ...current, bloodGroup: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none">
											{bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
										</select>
									</FilterField>
									<FilterField label="Location">
										<input value={queryInput} onChange={(e) => setQueryInput(e.target.value)} placeholder="City, area, PIN code" className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
									</FilterField>
									<FilterField label="Distance">
										<select value={search.radius} onChange={(e) => setSearch((current) => ({ ...current, radius: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none">
											{radii.map((radius) => <option key={radius} value={radius}>{radius}</option>)}
										</select>
									</FilterField>
									<FilterField label="Required Units">
										<select value={search.units} onChange={(e) => setSearch((current) => ({ ...current, units: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none">
											{unitOptions.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
										</select>
									</FilterField>
									<FilterField label="Availability">
										<select value={search.availability} onChange={(e) => setSearch((current) => ({ ...current, availability: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none">
											{availabilityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
										</select>
									</FilterField>
									<FilterField label="Blood Bank">
										<input value={search.bloodBankName || ''} onChange={(e) => setSearch((current) => ({ ...current, bloodBankName: e.target.value }))} placeholder="Optional blood bank name" className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
									</FilterField>
									<label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
										<input type="checkbox" checked={search.verifiedOnly} onChange={(e) => setSearch((current) => ({ ...current, verifiedOnly: e.target.checked }))} className="h-4 w-4 rounded border-white/20 bg-slate-950 text-rose-500" />
										Verified Donor
									</label>
								</div>
								<div className="mt-6 flex flex-wrap gap-3">
									<button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleApplyFilters(); }} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-60" disabled={loading}>
										{loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
										Apply Filters
									</button>
									<button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClearFilters(); }} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
										Clear Filters
									</button>
								</div>
								<div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
									<div className="flex items-center gap-2 text-rose-200">
										<Navigation2 className="h-4 w-4" aria-hidden="true" />
										Live location support
									</div>
									<p className="mt-3 leading-6">Use manual location entry or browser geolocation. If permission is denied, you can continue with typed location details.</p>
									<button type="button" onClick={handleUseLocation} className="mt-4 inline-flex items-center gap-2 font-semibold text-rose-200 transition hover:text-white">
										Use My Location
									</button>
								</div>
							</aside>

							<div className="space-y-6">
								<section className="glass-card rounded-[2rem] p-6 sm:p-8">
									<form noValidate className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end" onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); handleSearch(e); }}>
										<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
											<FilterField label="Blood Group">
												<select value={search.bloodGroup} onChange={(e) => setSearch((current) => ({ ...current, bloodGroup: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none">
													{bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
												</select>
											</FilterField>
											<FilterField label="Location">
												<input value={queryInput} onChange={(e) => setQueryInput(e.target.value)} placeholder="City, area, PIN code" className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none placeholder:text-slate-500" />
											</FilterField>
											<FilterField label="Search Radius">
												<select value={search.radius} onChange={(e) => setSearch((current) => ({ ...current, radius: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none">
													{radii.map((radius) => <option key={radius} value={radius}>{radius}</option>)}
												</select>
											</FilterField>
											<FilterField label="Required Units">
												<select value={search.units} onChange={(e) => setSearch((current) => ({ ...current, units: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none">
													{unitOptions.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
												</select>
											</FilterField>
											<FilterField label="Availability">
												<select value={search.availability} onChange={(e) => setSearch((current) => ({ ...current, availability: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none">
													{availabilityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
												</select>
											</FilterField>
										</div>
										<div className="flex flex-col gap-3 sm:flex-row xl:flex-col 2xl:flex-row">
											<button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSearch(e); }} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
												{loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
												Search Blood
											</button>
											<button type="button" onClick={handleUseLocation} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
												<Navigation2 className="h-4 w-4" aria-hidden="true" />
												Use My Location
											</button>
										</div>
									</form>
									<div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
										<span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-white">
											<ArrowUpDown className="h-4 w-4 text-rose-200" aria-hidden="true" />
											Sort by:
										</span>
										{sortOptions.map((option) => (
											<button key={option} type="button" onClick={() => setSearch((current) => ({ ...current, sortBy: option }))} className={`rounded-full px-4 py-2 font-medium transition ${search.sortBy === option ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}>
												{option}
											</button>
										))}
										{!loading && (filteredAndSortedResults.length > 0 || compatibleDonors.length > 0) && (
											<span className="ml-auto text-slate-300">{totalResults} matching result{totalResults === 1 ? '' : 's'}</span>
										)}
									</div>
								</section>

								{loading ? (
									<section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-6">
										<div className="text-sm text-slate-300">Searching nearby blood availability...</div>
										<div className="grid gap-4 lg:grid-cols-2">
											{Array.from({ length: 4 }).map((_, index) => (
												<div key={index} className="animate-pulse rounded-3xl border border-white/10 bg-slate-950/40 p-5">
													<div className="h-5 w-1/2 rounded-full bg-white/10" />
													<div className="mt-4 h-4 w-3/4 rounded-full bg-white/10" />
													<div className="mt-3 h-4 w-1/3 rounded-full bg-white/10" />
													<div className="mt-5 grid grid-cols-4 gap-2">
														{Array.from({ length: 8 }).map((__, bloodIndex) => <div key={bloodIndex} className="h-8 rounded-full bg-white/10" />)}
													</div>
												</div>
											))}
										</div>
									</section>
								) : error ? (
									<StatusCard
										title="Unable to retrieve blood availability"
										description={error}
										primaryAction={<button type="button" onClick={() => performSearch(lastSearchParams || search, { isUserAction: true })} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">Retry</button>}
										secondaryAction={<button type="button" onClick={loadDemoData} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">View Demo Records (Separate)</button>}
									/>
								) : viewDemo || dataSource === 'demo' ? (
									<>
										<div className="rounded-[2rem] border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
											Demo Data — Not Live Inventory (clearly labeled). Live inventory not shown.
										</div>
										{(filteredAndSortedResults.length === 0 && compatibleDonors.length === 0) ? (
											<EmptyState 
												onRadius={() => { 
													const newSearch = { ...search, radius: '100 km' };
													setSearch(newSearch); 
													performSearch(newSearch, { isUserAction: true }); 
												}} 
												onGroup={() => { 
													const newSearch = { ...search, bloodGroup: 'O+' };
													setSearch(newSearch); 
													performSearch(newSearch, { isUserAction: true }); 
												}} 
												onLocation={() => { 
													setQueryInput(''); 
													const newSearch = { ...search, location: '' };
													setSearch(newSearch); 
													performSearch(newSearch, { isUserAction: true }); 
												}} 
											/>
										) : (
											<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
												<div className="space-y-6">
													{filteredAndSortedResults.map((bank) => (
														<BloodBankCard key={bank.id} bank={bank} selectedGroup={search.bloodGroup} requiredUnits={getRequiredUnits(search.units)} />
													))}
													{compatibleDonors.length > 0 && <DonorSection donors={compatibleDonors} />}
												</div>
												<div className="space-y-6">
													<EmergencyCard />
													<MapPlaceholder title="Blood search map" subtitle="Demo data only." />
												</div>
											</div>
										)}
									</>
								) : (
									<div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
										<div className="space-y-6">
											{filteredAndSortedResults.map((bank) => (
												<BloodBankCard key={bank.id} bank={bank} selectedGroup={search.bloodGroup} requiredUnits={getRequiredUnits(search.units)} />
											))}
											{compatibleDonors.length > 0 && <DonorSection donors={compatibleDonors} />}
										</div>
										<div className="space-y-6">
											<EmergencyCard />
											<MapPlaceholder title="Blood search map" subtitle="Show the current location, nearby blood bank markers, and donor markers here." />
										</div>
									</div>
								)}
							</div>
						</section>
					</main>
				</div>
			</div>
		</div>
	);
}

function FilterField({ label, children }) {
	return (
		<label className="block">
			<span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
			{children}
		</label>
	);
}

function BloodBankCard({ bank, selectedGroup, requiredUnits }) {
	const availability = bank.availability?.[selectedGroup] ?? { label: 'Not Available', units: 0 };
	const unitsUnknown = availability.units === undefined || availability.units === null;
	const enough = !unitsUnknown && typeof availability.units === 'number' ? availability.units >= (requiredUnits || 0) : false;
	const isDemo = bank.isDemo || bank.source === 'demo';

	return (
		<article className="glass-card rounded-[2rem] p-6 sm:p-7 transition hover:-translate-y-1">
			<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
				<div className="flex-1">
					<div className="flex flex-wrap items-center gap-3">
						<h2 className="text-2xl font-semibold text-white">{bank.name}</h2>
						<span className={`rounded-full border px-3 py-1 text-xs font-semibold ${bank.status === 'Open' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-rose-400/20 bg-rose-500/10 text-rose-200'}`}>{bank.status || (bank.isActive ? 'Open' : 'Status unknown')}</span>
						{isDemo ? (
							<span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">DEMO DATA</span>
						) : (
							<span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">LIVE</span>
						)}
						{bank.verified && (
							<span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">Verified</span>
						)}
					</div>
					<p className="mt-2 text-sm text-slate-300">{bank.address || bank.city || ''}</p>
					<div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
						{bank.distanceLabel && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-rose-200" aria-hidden="true" />{bank.distanceLabel}</span>}
						{bank.distance && !bank.distanceLabel && <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-rose-200" aria-hidden="true" />{typeof bank.distance === 'number' ? bank.distance.toFixed(1) + ' km' : bank.distance}</span>}
						{bank.phone && <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-rose-200" aria-hidden="true" />{bank.phone}</span>}
						{bank.updated && <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-rose-200" aria-hidden="true" />Updated {bank.updated}</span>}
					</div>
				</div>
				<div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300 lg:min-w-[420px]">
					<div className="flex items-center gap-2 text-white">
						<ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />Blood availability ({selectedGroup})
					</div>
					<div className="mt-3">
						<div className={`rounded-2xl border px-4 py-3 ${selectedGroup === selectedGroup ? 'border-rose-400/40 bg-rose-500/10 text-white' : 'border-white/10 bg-white/5'}`}>
							<div className="flex items-center justify-between">
								<span className="text-lg font-semibold">{selectedGroup}</span>
								<span className="text-lg font-semibold">{unitsUnknown ? 'Unknown' : availability.units}</span>
							</div>
							<p className={`mt-2 text-xs font-semibold ${availability.label === 'Available' ? 'text-emerald-300' : availability.label === 'Low Stock' ? 'text-amber-300' : availability.label === 'Not Available' ? 'text-slate-400' : 'text-slate-300'}`}>
								{availability.label === 'Not Available' ? 'Not Available' : unitsUnknown ? 'Units unknown' : availability.label}
							</p>
							{requiredUnits > 0 && !unitsUnknown && (
								<p className={`mt-1 text-xs ${enough ? 'text-emerald-300' : 'text-rose-300'}`}>
									{enough ? `Sufficient for ${requiredUnits} unit${requiredUnits === 1 ? '' : 's'}` : `Not enough for ${requiredUnits} unit${requiredUnits === 1 ? '' : 's'} (need ${requiredUnits}, have ${availability.units})`}
								</p>
							)}
						</div>
					</div>
					<div className="mt-4 flex flex-wrap gap-3">
						<Link to={`/blood-banks/${bank.id}?group=${selectedGroup}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">View Details</Link>
						<Link to="/request-blood" state={{ bloodGroup: selectedGroup, bloodBank: bank.name, units: requiredUnits || 2, location: bank.address }} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white">Request Blood</Link>
						{bank.phone && <a href={`tel:${String(bank.phone).replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5">Call</a>}
					</div>
				</div>
			</div>
		</article>
	);
}

function DonorSection({ donors }) {
	return (
		<article className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Compatible Donors Nearby</p>
					<h3 className="mt-2 text-2xl font-semibold text-white">Nearby donor matches</h3>
				</div>
				<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><UserRound className="h-5 w-5" aria-hidden="true" /></div>
			</div>
			<div className="mt-6 space-y-4">
				{donors.map((donor) => (
					<div key={donor.id || donor.name} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
						<div className="flex items-start justify-between gap-3">
							<div>
								<div className="flex flex-wrap items-center gap-2">
									<h4 className="text-lg font-semibold text-white">{donor.displayName || donor.name}</h4>
									{donor.verified && <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">Verified</span>}
									{(donor.isDemo || donor.source === 'demo') && <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">DEMO DATA</span>}
								</div>
								<p className="mt-1 text-sm text-slate-400">{donor.location || donor.city || donor.area || ''}</p>
							</div>
							<span className="rounded-full bg-white/5 px-3 py-1 text-sm font-semibold text-white">{donor.bloodGroup}</span>
						</div>
						<div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
							<span>Distance: {donor.distanceLabel || (typeof donor.distance === 'number' ? donor.distance.toFixed(1) + ' km' : donor.distance || '—')}</span>
							<span>Availability: {donor.availability || (donor.available ? 'Available' : 'Unknown')}</span>
							{donor.lastDonation && <span>Last donation: {donor.lastDonationDate ? new Date(donor.lastDonationDate).toLocaleDateString() : donor.lastDonation}</span>}
						</div>
						<div className="mt-4 flex flex-wrap gap-3">
							<button type="button" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white" disabled={donor.contactHidden}>Contact Donor</button>
							<button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">View Details</button>
						</div>
						{donor.contactHidden && <p className="mt-2 text-xs text-slate-400">Contact details not shown for demo records.</p>}
					</div>
				))}
			</div>
		</article>
	);
}

function EmergencyCard() {
	return (
		<article className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Emergency Request</p>
					<h3 className="mt-2 text-2xl font-semibold text-white">Can't find the blood you need?</h3>
					<p className="mt-3 text-sm leading-7 text-slate-300">Create an emergency blood request. Requests are handled through the existing Emergency Request flow.</p>
				</div>
				<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></div>
			</div>
			<Link to="/emergency-request" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-rose-100">
				Emergency Request
			</Link>
		</article>
	);
}

function StatusCard({ title, description, primaryAction, secondaryAction }) {
	return (
		<section className="glass-card rounded-[2rem] p-8 text-center">
			<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-200">
				<AlertTriangle className="h-8 w-8" aria-hidden="true" />
			</div>
			<h2 className="mt-6 text-2xl font-semibold text-white">{title}</h2>
			<p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
			<div className="mt-6 flex flex-wrap justify-center gap-3">
				{primaryAction}
				{secondaryAction}
			</div>
		</section>
	);
}

function EmptyState({ onRadius, onGroup, onLocation }) {
	return (
		<section className="glass-card rounded-[2rem] p-8 text-center">
			<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 text-rose-200">
				<Sparkles className="h-8 w-8" aria-hidden="true" />
			</div>
			<h2 className="mt-6 text-2xl font-semibold text-white">No matching blood resources found.</h2>
			<p className="mt-3 text-sm leading-7 text-slate-300">Try changing your blood group, location, or search radius. Or create an emergency request.</p>
			<div className="mt-6 flex flex-wrap justify-center gap-3">
				<button type="button" onClick={onRadius} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Expand Search Radius</button>
				<button type="button" onClick={onGroup} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Change Blood Group</button>
				<button type="button" onClick={onLocation} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Search Another Location</button>
				<Link to="/emergency-request" className="rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">Create Emergency Request</Link>
			</div>
		</section>
	);
}

export default FindBloodPage;
