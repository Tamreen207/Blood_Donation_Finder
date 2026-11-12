import { useEffect, useMemo, useState } from 'react';
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	BadgeCheck,
	Building2,
	CalendarDays,
	CheckCircle2,
	Clock3,
	Droplets,
	Filter,
	FlaskConical,
	Globe2,
	HeartPulse,
	LoaderCircle,
	Mail,
	MapPin,
	Navigation2,
	ParkingCircle,
	Phone,
	RefreshCcw,
	ShieldCheck,
	Sparkles,
	Star,
	Syringe,
	Users,
	Warehouse,
	X,
} from 'lucide-react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import MapPlaceholder from '../components/MapPlaceholder';
import {
	fetchBloodBankDetails,
	fetchBloodBankInventory,
	fetchBloodBankLocation,
	fetchBloodBankReviews,
	fetchBloodBankServices,
	isBloodBankApiConfigured,
	submitBloodRequest,
} from '../services/bloodBankService';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const sidebarItems = [
	{ label: 'Dashboard', to: '/dashboard', icon: Building2 },
	{ label: 'Find Blood', to: '/find-blood', icon: HeartPulse },
	{ label: 'Find Donor', to: '/find-donor', icon: Users },
	{ label: 'Blood Banks', to: '/blood-banks', icon: Building2, active: true },
	{ label: 'My Requests', to: '/dashboard', icon: Sparkles },
	{ label: 'Donation History', to: '/dashboard', icon: Sparkles },
	{ label: 'Notifications', to: '/dashboard', icon: Sparkles },
	{ label: 'Profile', to: '/dashboard', icon: BadgeCheck },
	{ label: 'Settings', to: '/dashboard', icon: Sparkles },
	{ label: 'Logout', to: '/login', icon: Sparkles },
];

const demoBanks = {
	'BB-1001': {
		id: 'BB-1001',
		name: 'LifeCare Blood Bank',
		verified: true,
		status: 'Open',
		rating: 4.8,
		reviewCount: 128,
		address: '12 Health Avenue, City Center',
		distance: '1.8 km',
		logo: 'LC',
		phone: '+1 (555) 200-1122',
		email: 'support@lifecareblood.org',
		workingHours: 'Mon-Sun · 24/7',
		emergencyContact: '+1 (555) 200-1199',
		website: 'www.lifecareblood.org',
		userLocation: 'Health District, City Center',
		bankLocation: '12 Health Avenue, City Center',
		mapNote: 'OpenStreetMap / Mapbox / Google Maps integration ready.',
		coordinates: { latitude: 17.385, longitude: 78.4867 },
		inventory: [
			{ group: 'A+', units: 6, status: 'Available', updated: '10 minutes ago', max: 10 },
			{ group: 'A-', units: 2, status: 'Low Stock', updated: '20 minutes ago', max: 10 },
			{ group: 'B+', units: 7, status: 'Available', updated: '30 minutes ago', max: 10 },
			{ group: 'B-', units: 0, status: 'Out of Stock', updated: '45 minutes ago', max: 10 },
			{ group: 'AB+', units: 4, status: 'Available', updated: '15 minutes ago', max: 10 },
			{ group: 'AB-', units: 1, status: 'Low Stock', updated: '25 minutes ago', max: 10 },
			{ group: 'O+', units: 8, status: 'Available', updated: '10 minutes ago', max: 10 },
			{ group: 'O-', units: 2, status: 'Low Stock', updated: '35 minutes ago', max: 10 },
		],
		services: [
			{ title: 'Blood Donation', description: 'Book donation appointments and donor intake.', icon: Droplets },
			{ title: 'Blood Collection', description: 'On-site collection and blood drive coordination.', icon: Syringe },
			{ title: 'Blood Testing', description: 'Screening for compatibility and safety checks.', icon: FlaskConical },
			{ title: 'Blood Storage', description: 'Cold-chain storage with stock monitoring.', icon: Warehouse },
			{ title: 'Emergency Blood Supply', description: 'Rapid dispatch for urgent cases.', icon: HeartPulse },
			{ title: 'Component Separation', description: 'Packed cells, plasma, and platelets support.', icon: CheckCircle2 },
		],
		facilities: [
			{ label: '24/7 Emergency Service', icon: AlertTriangle },
			{ label: 'Parking', icon: ParkingCircle },
			{ label: 'Wheelchair Accessible', icon: BadgeCheck },
			{ label: 'Online Blood Requests', icon: Globe2 },
			{ label: 'Cold Storage', icon: Warehouse },
			{ label: 'Medical Staff', icon: ShieldCheck },
		],
		recentUpdates: [
			{ group: 'O+', units: 12, updated: '10 minutes ago' },
			{ group: 'A+', units: 8, updated: '20 minutes ago' },
			{ group: 'B+', units: 4, updated: '30 minutes ago' },
		],
		reviews: [
			{ name: 'Priya S.', rating: 5, time: '2 weeks ago', title: 'Fast, clear coordination', body: 'The team responded quickly and the inventory information was accurate when we needed it most.' },
			{ name: 'Arun K.', rating: 5, time: '1 month ago', title: 'Professional staff', body: 'Staff were organized, helpful, and gave us the exact guidance we needed for an urgent request.' },
			{ name: 'Meera T.', rating: 4, time: '3 months ago', title: 'Reliable updates', body: 'The stock view and contact details made it easier to plan the next step without delay.' },
		],
	},
	'BB-1002': {
		id: 'BB-1002',
		name: 'Central City Blood Bank',
		verified: true,
		status: 'Open',
		rating: 4.6,
		reviewCount: 96,
		address: '88 Care Street, Downtown',
		distance: '3.4 km',
		logo: 'CC',
		phone: '+1 (555) 200-2244',
		email: 'info@centralcityblood.org',
		workingHours: 'Mon-Sat · 8:00 AM - 8:00 PM',
		emergencyContact: '+1 (555) 200-2299',
		website: 'www.centralcityblood.org',
		userLocation: 'Health District, City Center',
		bankLocation: '88 Care Street, Downtown',
		mapNote: 'Map integration ready for future provider connection.',
		coordinates: { latitude: 17.391, longitude: 78.498 },
		inventory: [
			{ group: 'A+', units: 3, status: 'Low Stock', updated: '12 minutes ago', max: 10 },
			{ group: 'A-', units: 5, status: 'Available', updated: '18 minutes ago', max: 10 },
			{ group: 'B+', units: 6, status: 'Available', updated: '28 minutes ago', max: 10 },
			{ group: 'B-', units: 2, status: 'Low Stock', updated: '35 minutes ago', max: 10 },
			{ group: 'AB+', units: 4, status: 'Available', updated: '16 minutes ago', max: 10 },
			{ group: 'AB-', units: 0, status: 'Out of Stock', updated: '45 minutes ago', max: 10 },
			{ group: 'O+', units: 9, status: 'Available', updated: '9 minutes ago', max: 10 },
			{ group: 'O-', units: 4, status: 'Available', updated: '22 minutes ago', max: 10 },
		],
		services: [
			{ title: 'Blood Donation', description: 'Scheduled donor intake and registration.', icon: Droplets },
			{ title: 'Blood Collection', description: 'Community drives and clinic collections.', icon: Syringe },
			{ title: 'Blood Testing', description: 'Compatibility screening and safety testing.', icon: FlaskConical },
			{ title: 'Blood Storage', description: 'Monitored inventory in cold storage.', icon: Warehouse },
			{ title: 'Emergency Blood Supply', description: 'Priority dispatch for urgent cases.', icon: HeartPulse },
			{ title: 'Component Separation', description: 'Separated components for targeted treatment.', icon: CheckCircle2 },
		],
		facilities: [
			{ label: '24/7 Emergency Service', icon: AlertTriangle },
			{ label: 'Parking', icon: ParkingCircle },
			{ label: 'Wheelchair Accessible', icon: BadgeCheck },
			{ label: 'Online Blood Requests', icon: Globe2 },
			{ label: 'Cold Storage', icon: Warehouse },
			{ label: 'Medical Staff', icon: ShieldCheck },
		],
		recentUpdates: [
			{ group: 'O+', units: 11, updated: '8 minutes ago' },
			{ group: 'A+', units: 6, updated: '19 minutes ago' },
			{ group: 'B+', units: 5, updated: '31 minutes ago' },
		],
		reviews: [
			{ name: 'Ravi P.', rating: 5, time: '1 week ago', title: 'Quick response', body: 'They confirmed the available stock immediately and kept us updated until pickup.' },
			{ name: 'Anita M.', rating: 4, time: '5 weeks ago', title: 'Helpful staff', body: 'The bank was easy to reach, and the staff explained the availability very clearly.' },
			{ name: 'Suresh V.', rating: 4, time: '2 months ago', title: 'Reliable details', body: 'The contact information and stock status matched what we saw on arrival.' },
		],
	},
	'BB-1003': {
		id: 'BB-1003',
		name: 'Hope Memorial Blood Center',
		verified: true,
		status: 'Closed',
		rating: 4.4,
		reviewCount: 74,
		address: '41 Unity Road, North District',
		distance: '5.7 km',
		logo: 'HM',
		phone: '+1 (555) 200-3399',
		email: 'support@hopememorial.org',
		workingHours: 'Mon-Fri · 9:00 AM - 6:00 PM',
		emergencyContact: '+1 (555) 200-3390',
		website: 'www.hopememorial.org',
		userLocation: 'Health District, City Center',
		bankLocation: '41 Unity Road, North District',
		mapNote: 'Map integration ready for future provider connection.',
		coordinates: { latitude: 17.403, longitude: 78.509 },
		inventory: [
			{ group: 'A+', units: 5, status: 'Available', updated: '14 minutes ago', max: 10 },
			{ group: 'A-', units: 1, status: 'Low Stock', updated: '25 minutes ago', max: 10 },
			{ group: 'B+', units: 4, status: 'Available', updated: '31 minutes ago', max: 10 },
			{ group: 'B-', units: 0, status: 'Out of Stock', updated: '44 minutes ago', max: 10 },
			{ group: 'AB+', units: 2, status: 'Low Stock', updated: '37 minutes ago', max: 10 },
			{ group: 'AB-', units: 0, status: 'Out of Stock', updated: '50 minutes ago', max: 10 },
			{ group: 'O+', units: 7, status: 'Available', updated: '12 minutes ago', max: 10 },
			{ group: 'O-', units: 2, status: 'Low Stock', updated: '28 minutes ago', max: 10 },
		],
		services: [
			{ title: 'Blood Donation', description: 'Scheduled donation intake.', icon: Droplets },
			{ title: 'Blood Collection', description: 'Local collection coordination.', icon: Syringe },
			{ title: 'Blood Testing', description: 'Standard screening workflow.', icon: FlaskConical },
			{ title: 'Blood Storage', description: 'Monitored cold-chain storage.', icon: Warehouse },
			{ title: 'Emergency Blood Supply', description: 'Urgent dispatch support.', icon: HeartPulse },
			{ title: 'Component Separation', description: 'Component processing support.', icon: CheckCircle2 },
		],
		facilities: [
			{ label: '24/7 Emergency Service', icon: AlertTriangle },
			{ label: 'Parking', icon: ParkingCircle },
			{ label: 'Wheelchair Accessible', icon: BadgeCheck },
			{ label: 'Online Blood Requests', icon: Globe2 },
			{ label: 'Cold Storage', icon: Warehouse },
			{ label: 'Medical Staff', icon: ShieldCheck },
		],
		recentUpdates: [
			{ group: 'O+', units: 9, updated: '11 minutes ago' },
			{ group: 'A+', units: 5, updated: '23 minutes ago' },
			{ group: 'B+', units: 3, updated: '35 minutes ago' },
		],
		reviews: [
			{ name: 'Neha R.', rating: 4, time: '3 weeks ago', title: 'Good support', body: 'Clear updates helped us plan a transfer even though the bank was closing soon.' },
			{ name: 'Vikram D.', rating: 4, time: '2 months ago', title: 'Dependable information', body: 'The inventory listing was accurate and the contact number was answered promptly.' },
			{ name: 'Farah K.', rating: 5, time: '4 months ago', title: 'Solid emergency workflow', body: 'They coordinated quickly with nearby resources when stock was limited.' },
		],
	},
};

function BloodBankDetailsPage() {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const location = useLocation();
	const initialGroup = searchParams.get('group') || location.state?.bloodGroup || 'O+';
	const [bank, setBank] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [notFound, setNotFound] = useState(false);
	const [inventoryFilter, setInventoryFilter] = useState('All');
	const [availableOnly, setAvailableOnly] = useState(false);
	const [requestOpen, setRequestOpen] = useState(false);
	const [requestSubmitting, setRequestSubmitting] = useState(false);
	const [requestNotice, setRequestNotice] = useState('');
	const [reviewComposerOpen, setReviewComposerOpen] = useState(false);
	const [reviewNotice, setReviewNotice] = useState('');
	const [requestForm, setRequestForm] = useState({
		bloodGroup: initialGroup,
		unitsRequired: '2',
		patientName: '',
		hospitalName: '',
		hospitalLocation: '',
		requiredDate: '',
		contactNumber: '',
		additionalMessage: '',
	});

	useEffect(() => {
		loadBank();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	async function loadBank() {
		setLoading(true);
		setError('');
		setNotFound(false);

		try {
			const demoBank = demoBanks[id];
			const [details, inventory, services, reviews, locationData] = await Promise.all([
				fetchBloodBankDetails(id),
				fetchBloodBankInventory(id),
				fetchBloodBankServices(id),
				fetchBloodBankReviews(id),
				fetchBloodBankLocation(id),
			]);

			const resolvedBank = details ?? demoBank;
			if (!resolvedBank) {
				setNotFound(true);
				return;
			}

			setBank({
				...resolvedBank,
				inventory: Array.isArray(inventory) && inventory.length > 0 ? inventory : resolvedBank.inventory,
				services: Array.isArray(services) && services.length > 0 ? services : resolvedBank.services,
				reviews: Array.isArray(reviews) && reviews.length > 0 ? reviews : resolvedBank.reviews,
				location: locationData ?? resolvedBank.location,
				demoMode: !isBloodBankApiConfigured(),
			});
			setRequestForm((current) => ({ ...current, bloodGroup: initialGroup }));
			setInventoryFilter('All');
		} catch (loadError) {
			if (loadError?.code === 'NOT_FOUND' || loadError?.status === 404) {
				const demoBank = demoBanks[id];
				if (demoBank) {
					setBank({ ...demoBank, demoMode: !isBloodBankApiConfigured() });
				} else {
					setNotFound(true);
				}
				return;
			}

			if (!isBloodBankApiConfigured() && demoBanks[id]) {
				setBank({ ...demoBanks[id], demoMode: true });
				return;
			}

			setError(loadError instanceof Error ? loadError.message : 'Blood bank information is currently unavailable.');
		} finally {
			setLoading(false);
		}
	}

	const filteredInventory = useMemo(() => {
		if (!bank?.inventory) {
			return [];
		}

		return bank.inventory.filter((item) => {
			const groupMatches = inventoryFilter === 'All' || item.group === inventoryFilter;
			const availabilityMatches = !availableOnly || item.status === 'Available';
			return groupMatches && availabilityMatches;
		});
	}, [availableOnly, bank, inventoryFilter]);

	const mapHref = useMemo(() => buildDirectionsHref(bank), [bank]);

	if (loading) {
		return <BloodBankDetailsSkeleton />;
	}

	if (notFound) {
		return <StateCard title="Blood bank not found." description="The blood bank ID you selected is invalid." primary={<Link to="/blood-banks" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">Back to Blood Banks</Link>} />;
	}

	if (error) {
		return <StateCard title="Blood bank information is currently unavailable." description={error} primary={<button type="button" onClick={loadBank} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">Try Again</button>} secondary={<Link to="/blood-banks" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Back to Blood Banks</Link>} />;
	}

	if (!bank) {
		return null;
	}

	return (
		<div className="min-h-screen overflow-x-hidden bg-blood-radial text-slate-100">
			<div className="flex min-h-screen">
				<aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-slate-950/95 backdrop-blur-xl lg:flex lg:flex-col">
					<div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
						<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-glow shadow-rose-500/30">
							<span className="text-lg font-bold text-white">L</span>
						</span>
						<div>
							<p className="text-lg font-semibold leading-none text-white">LifeLink</p>
							<p className="text-xs text-slate-400">Blood Bank Details</p>
						</div>
					</div>
					<nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
						{sidebarItems.map((item) => {
							const Icon = item.icon;
							return (
								<Link key={item.label} to={item.to} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${item.active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
									<Icon className="h-5 w-5" aria-hidden="true" />
									<span>{item.label}</span>
								</Link>
							);
						})}
					</nav>
					<div className="border-t border-white/10 px-6 py-5">
						<div className="glass-card rounded-3xl p-4">
							<p className="text-sm font-medium text-white">Need urgent help?</p>
							<p className="mt-1 text-sm text-slate-400">Use an emergency request when the inventory is not enough.</p>
							<Link to="/emergency-request" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
								<AlertTriangle className="h-4 w-4" aria-hidden="true" />
								Emergency Request
							</Link>
						</div>
					</div>
				</aside>

				<main className="flex-1 lg:pl-72">
					<div className="section-shell py-6 sm:py-8 lg:py-10">
						<div className="space-y-6">
							<header className="glass-card rounded-[2rem] p-6 sm:p-8">
								<div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
									<Link to="/dashboard" className="transition hover:text-white">Dashboard</Link>
									<span className="text-slate-500">→</span>
									<Link to="/blood-banks" className="transition hover:text-white">Blood Banks</Link>
									<span className="text-slate-500">→</span>
									<span className="text-white">Blood Bank Details</span>
								</div>
								<div className="mt-5 flex flex-wrap items-center justify-between gap-4">
									<div>
										<Link to="/blood-banks" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
											<ArrowLeft className="h-4 w-4" aria-hidden="true" />
											Back to Blood Banks
										</Link>
										<div className="mt-4 flex flex-wrap items-center gap-3">
											<h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{bank.name}</h1>
											{bank.verified ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Verified</span> : null}
											<span className={`rounded-full border px-3 py-1 text-xs font-semibold ${bank.status === 'Open' ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200' : 'border-rose-400/20 bg-rose-500/10 text-rose-200'}`}>{bank.status}</span>
										</div>
										<p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">Complete blood availability, services, and contact details for this blood bank. Inventory highlights reflect the blood group you searched for when arriving from Find Blood.</p>
									</div>
									<div className="flex flex-wrap items-center gap-3">
										<div className="rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
											<p className="text-xs uppercase tracking-[0.25em] text-rose-200/70">Rating</p>
											<div className="mt-1 flex items-center gap-2 text-white">
												<Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
												<span className="font-semibold">{bank.rating.toFixed(1)}</span>
												<span className="text-slate-400">({bank.reviewCount} reviews)</span>
											</div>
										</div>
										<div className="rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
											<p className="text-xs uppercase tracking-[0.25em] text-rose-200/70">Distance</p>
											<p className="mt-1 font-semibold text-white">{bank.distance} from your location</p>
										</div>
									</div>
								</div>
							</header>

							<section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
								<article className="glass-card rounded-[2rem] p-6 sm:p-8">
									<div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
										<div className="flex items-start gap-4">
											<div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 text-xl font-bold text-white shadow-glow shadow-rose-500/20">{bank.logo}</div>
											<div>
												<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Blood Bank Header</p>
												<h2 className="mt-2 text-2xl font-semibold text-white">{bank.name}</h2>
												<div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
													<span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-rose-200" aria-hidden="true" />{bank.address}</span>
													<span className="inline-flex items-center gap-2"><Navigation2 className="h-4 w-4 text-rose-200" aria-hidden="true" />{bank.distance}</span>
													<span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-rose-200" aria-hidden="true" />{bank.workingHours}</span>
												</div>
											</div>
										</div>
										<div className="flex flex-wrap gap-3">
											<button type="button" onClick={() => setRequestOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
												<ArrowRight className="h-4 w-4" aria-hidden="true" />
												Request Blood
											</button>
											<a href={`tel:${bank.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
												<Phone className="h-4 w-4" aria-hidden="true" />
												Call
											</a>
											<a href={mapHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
												<Navigation2 className="h-4 w-4" aria-hidden="true" />
												Get Directions
											</a>
										</div>
									</div>
									{bank.demoMode ? (
										<div className="mt-6 rounded-3xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
											Demo data is shown because the backend is not connected yet.
										</div>
									) : null}
								</article>

								<aside className="glass-card rounded-[2rem] p-6 sm:p-8">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Contact Information</p>
											<h3 className="mt-2 text-2xl font-semibold text-white">Reach the blood bank</h3>
										</div>
										<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><Phone className="h-5 w-5" aria-hidden="true" /></div>
									</div>
									<div className="mt-6 space-y-4 text-sm text-slate-300">
										<ContactLine icon={Phone} label="Phone" value={bank.phone} href={`tel:${bank.phone.replace(/[^\d+]/g, '')}`} />
										<ContactLine icon={Mail} label="Email" value={bank.email} href={`mailto:${bank.email}`} />
										<ContactLine icon={MapPin} label="Address" value={bank.address} />
										<ContactLine icon={Clock3} label="Working hours" value={bank.workingHours} />
										<ContactLine icon={AlertTriangle} label="Emergency contact" value={bank.emergencyContact} href={`tel:${bank.emergencyContact.replace(/[^\d+]/g, '')}`} />
										{bank.website ? <ContactLine icon={Globe2} label="Website" value={bank.website} href={bank.website.startsWith('http') ? bank.website : `https://${bank.website}`} /> : null}
									</div>
								</aside>
							</section>

							<section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
								<article className="glass-card rounded-[2rem] p-6 sm:p-8">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div>
											<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Current Blood Availability</p>
											<h3 className="mt-2 text-2xl font-semibold text-white">Inventory overview</h3>
										</div>
										<div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">Highlighting {initialGroup}</div>
									</div>

									<div className="mt-6 flex flex-wrap items-center gap-3">
										<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/40 p-1">
											{['All', ...bloodGroups].map((group) => (
												<button key={group} type="button" onClick={() => setInventoryFilter(group)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${inventoryFilter === group ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}>
													{group}
												</button>
											))}
										</div>
										<button type="button" role="switch" aria-checked={availableOnly} onClick={() => setAvailableOnly((current) => !current)} className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold transition ${availableOnly ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
											<span className={`flex h-5 w-10 items-center rounded-full p-0.5 transition ${availableOnly ? 'bg-emerald-400/30' : 'bg-white/10'}`}>
												<span className={`h-4 w-4 rounded-full bg-white transition ${availableOnly ? 'translate-x-5' : 'translate-x-0'}`} />
											</span>
											Available Only
										</button>
									</div>

									<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
										{filteredInventory.map((item) => (
											<InventoryCard key={item.group} item={item} highlighted={item.group === initialGroup} />
										))}
									</div>
									{filteredInventory.length === 0 ? <EmptySubstate title="No matching inventory found." description="Change the selected blood group or show all groups to see more results." /> : null}
								</article>

								<article className="glass-card rounded-[2rem] p-6 sm:p-8">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Location / Map</p>
											<h3 className="mt-2 text-2xl font-semibold text-white">Blood bank location</h3>
										</div>
										<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><MapPin className="h-5 w-5" aria-hidden="true" /></div>
									</div>
									<div className="mt-6 grid gap-4 sm:grid-cols-3">
										<SummaryStat label="Blood bank location" value={bank.bankLocation} />
										<SummaryStat label="User location" value={bank.userLocation} />
										<SummaryStat label="Distance" value={bank.distance} />
									</div>
									<div className="mt-6 flex flex-wrap gap-3">
										<a href={mapHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5">
											<Navigation2 className="h-4 w-4" aria-hidden="true" />
											Directions
										</a>
										<button type="button" onClick={() => setRequestOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
											<RequestBloodIcon />
											Request Blood
										</button>
									</div>
									<div className="mt-6">
										<MapPlaceholder title="Blood bank map" subtitle={bank.mapNote} />
									</div>
								</article>
							</section>

							<section className="grid gap-6 xl:grid-cols-2">
								<article className="glass-card rounded-[2rem] p-6 sm:p-8">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Services Available</p>
											<h3 className="mt-2 text-2xl font-semibold text-white">What this blood bank provides</h3>
										</div>
										<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><Droplets className="h-5 w-5" aria-hidden="true" /></div>
									</div>
									<div className="mt-6 grid gap-4 sm:grid-cols-2">
										{bank.services.map((service) => {
											const Icon = service.icon;
											return (
												<div key={service.title} className="rounded-3xl border border-white/10 bg-slate-950/40 p-5 transition hover:-translate-y-1 hover:border-white/20">
													<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-rose-200">
														<Icon className="h-5 w-5" aria-hidden="true" />
													</div>
													<h4 className="mt-4 text-lg font-semibold text-white">{service.title}</h4>
													<p className="mt-2 text-sm leading-6 text-slate-300">{service.description}</p>
												</div>
											);
										})}
									</div>
								</article>

								<article className="glass-card rounded-[2rem] p-6 sm:p-8">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Facilities</p>
											<h3 className="mt-2 text-2xl font-semibold text-white">On-site support and amenities</h3>
										</div>
										<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></div>
									</div>
									<div className="mt-6 grid gap-3 sm:grid-cols-2">
										{bank.facilities.map((facility) => {
											const Icon = facility.icon;
											return (
												<div key={facility.label} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-300 transition hover:bg-white/5">
													<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-rose-200"><Icon className="h-5 w-5" aria-hidden="true" /></span>
													<span>{facility.label}</span>
												</div>
											);
										})}
									</div>
								</article>
							</section>

							<section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
								<article className="glass-card rounded-[2rem] p-6 sm:p-8">
									<div className="flex items-center justify-between gap-3">
										<div>
											<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Recent Updates</p>
											<h3 className="mt-2 text-2xl font-semibold text-white">Latest inventory changes</h3>
										</div>
										{bank.demoMode ? <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-100">Demo Data</span> : null}
									</div>
									<div className="mt-6 space-y-3">
										{bank.recentUpdates.map((update) => (
											<div key={`${update.group}-${update.updated}`} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
												<div className="flex items-center justify-between gap-3">
													<div className="flex items-center gap-3">
														<span className="rounded-full bg-white/5 px-3 py-1 text-sm font-semibold text-white">{update.group}</span>
														<span className="text-sm text-slate-300">{update.units} units available</span>
													</div>
													<span className="text-xs text-slate-400">Updated {update.updated}</span>
												</div>
											</div>
										))}
									</div>
								</article>

								<article className="glass-card rounded-[2rem] p-6 sm:p-8" id="reviews">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div>
											<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Reviews</p>
											<h3 className="mt-2 text-2xl font-semibold text-white">What people are saying</h3>
										</div>
										<button type="button" onClick={() => setReviewComposerOpen((current) => !current)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
											Write a Review
										</button>
									</div>
									<div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
										<div className="rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-5">
											<p className="text-sm uppercase tracking-[0.25em] text-slate-400">Rating summary</p>
											<div className="mt-4 flex items-end gap-3">
												<span className="text-4xl font-semibold text-white">{bank.rating.toFixed(1)}</span>
												<div className="pb-1 text-sm text-slate-300">/ 5</div>
											</div>
											<div className="mt-4 flex items-center gap-1 text-amber-400">
												{Array.from({ length: 5 }).map((_, index) => (
													<Star key={index} className={`h-4 w-4 ${index < Math.round(bank.rating) ? 'fill-amber-400' : 'text-slate-600'}`} aria-hidden="true" />
												))}
											</div>
											<p className="mt-4 text-sm text-slate-300">Based on {bank.reviewCount} reviews.</p>
											{bank.demoMode ? <p className="mt-3 text-xs uppercase tracking-[0.25em] text-amber-100/80">Sample reviews shown in demo mode</p> : null}
										</div>
										<div className="space-y-4">
											{bank.reviews.map((review) => (
												<div key={`${review.name}-${review.time}`} className="rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-5">
													<div className="flex items-start justify-between gap-3">
														<div>
															<div className="flex items-center gap-2">
																<h4 className="text-lg font-semibold text-white">{review.name}</h4>
																<span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">Sample</span>
															</div>
															<p className="mt-1 text-sm text-slate-400">{review.time}</p>
														</div>
														<div className="flex items-center gap-1 text-amber-400">
															<Star className="h-4 w-4 fill-amber-400" aria-hidden="true" />
															<span className="text-sm font-semibold text-white">{review.rating}</span>
														</div>
													</div>
													<h5 className="mt-4 text-base font-semibold text-white">{review.title}</h5>
													<p className="mt-2 text-sm leading-6 text-slate-300">{review.body}</p>
												</div>
											))}
										</div>
									</div>
									{reviewComposerOpen ? <ReviewComposer bankName={bank.name} notice={reviewNotice} onClose={() => setReviewComposerOpen(false)} onNotice={setReviewNotice} /> : null}
								</article>
							</section>

							<section className="glass-card overflow-hidden rounded-[2rem] border-rose-400/20 bg-gradient-to-br from-rose-500/15 via-red-500/10 to-slate-900 p-6 sm:p-8">
								<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
									<div>
										<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Need Blood Immediately?</p>
										<h3 className="mt-2 text-2xl font-semibold text-white">Create an emergency request and notify nearby matching blood resources.</h3>
										<p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/90">Use emergency routing when inventory is limited or when time is critical. The request will surface nearby donors and blood banks with the fastest possible response.</p>
									</div>
									<Link to="/emergency-request" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-rose-100">
										Emergency Request
									</Link>
								</div>
							</section>
						</div>
					</div>
				</main>
			</div>

			{requestOpen ? (
				<RequestBloodModal
					bank={bank}
					requestForm={requestForm}
					setRequestForm={setRequestForm}
					onClose={() => {
						setRequestOpen(false);
						setRequestNotice('');
					}}
					onSubmit={async (payload) => {
						setRequestSubmitting(true);
						setRequestNotice('');
						try {
							await submitBloodRequest(payload);
							setRequestNotice('Blood request submitted successfully.');
							setRequestOpen(false);
						} catch (submitError) {
							setRequestNotice(submitError instanceof Error ? submitError.message : 'Unable to submit blood request.');
						}
						setRequestSubmitting(false);
					}}
					submitting={requestSubmitting}
					notice={requestNotice}
				/>
			) : null}

			<div className="fixed inset-x-4 bottom-4 z-50 lg:hidden">
				<button type="button" onClick={() => setRequestOpen(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-4 text-sm font-semibold text-white shadow-2xl shadow-rose-500/30">
					<ArrowRight className="h-4 w-4" aria-hidden="true" />
					Request Blood
				</button>
			</div>
		</div>
	);
}

function buildDirectionsHref(bank) {
	if (!bank) {
		return '#';
	}

	const coordinates = bank.coordinates;
	if (coordinates?.latitude && coordinates?.longitude) {
		return `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`;
	}

	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bank.bankLocation ?? bank.address ?? bank.name)}`;
}

function RequestBloodIcon() {
	return <Sparkles className="h-4 w-4" aria-hidden="true" />;
}

function ContactLine({ icon: Icon, label, value, href }) {
	const content = (
		<>
			<span className="inline-flex items-center gap-2 text-slate-400"><Icon className="h-4 w-4 text-rose-200" aria-hidden="true" />{label}</span>
			<span className="block break-words text-white">{value}</span>
		</>
	);

	if (href) {
		return (
			<a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="block rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 transition hover:bg-white/5">
				{content}
			</a>
		);
	}

	return <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">{content}</div>;
}

function SummaryStat({ label, value }) {
	return (
		<div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
			<p className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</p>
			<p className="mt-3 break-words text-sm font-semibold leading-6 text-white">{value}</p>
		</div>
	);
}

function InventoryCard({ item, highlighted }) {
	const progress = item.max ? Math.min(100, Math.round((item.units / item.max) * 100)) : 0;
	const statusClasses =
		item.status === 'Available'
			? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
			: item.status === 'Low Stock'
				? 'border-amber-400/20 bg-amber-500/10 text-amber-100'
				: 'border-rose-400/20 bg-rose-500/10 text-rose-200';

	return (
		<div className={`rounded-[1.75rem] border p-5 transition hover:-translate-y-1 ${highlighted ? 'border-rose-400/40 bg-rose-500/10' : 'border-white/10 bg-slate-950/40'}`}>
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-lg font-semibold text-white">{item.group}</p>
					<p className="mt-1 text-sm text-slate-400">Updated {item.updated}</p>
				</div>
				<span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses}`}>{item.status}</span>
			</div>
			<div className="mt-4 flex items-end justify-between gap-3">
				<div>
					<p className="text-sm text-slate-400">Units available</p>
					<p className="mt-1 text-3xl font-semibold text-white">{item.units}</p>
				</div>
				<div className="text-right text-xs text-slate-400">Stock indicator</div>
			</div>
			<div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
				<div className={`h-full rounded-full ${item.status === 'Available' ? 'bg-emerald-400' : item.status === 'Low Stock' ? 'bg-amber-400' : 'bg-rose-400'}`} style={{ width: `${progress}%` }} />
			</div>
		</div>
	);
}

function StateCard({ title, description, primary, secondary }) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-blood-radial px-4 py-12 text-slate-100">
			<div className="glass-card w-full max-w-2xl rounded-[2rem] p-8 text-center">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-200">
					<AlertTriangle className="h-8 w-8" aria-hidden="true" />
				</div>
				<h1 className="mt-6 text-2xl font-semibold text-white">{title}</h1>
				<p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
				<div className="mt-6 flex flex-wrap justify-center gap-3">
					{primary}
					{secondary}
				</div>
			</div>
		</div>
	);
}

function EmptySubstate({ title, description }) {
	return (
		<div className="rounded-[1.75rem] border border-dashed border-white/15 bg-slate-950/30 p-6 text-center">
			<p className="text-lg font-semibold text-white">{title}</p>
			<p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
		</div>
	);
}

function ReviewComposer({ bankName, notice, onClose, onNotice }) {
	const [reviewForm, setReviewForm] = useState({ name: '', rating: '5', comment: '' });
	const [fieldError, setFieldError] = useState('');

	function handleSubmit(event) {
		event.preventDefault();
		setFieldError('');
		if (!reviewForm.name || !reviewForm.comment) {
			setFieldError('Please add your name and a review comment.');
			return;
		}

		onNotice('Review submission is not connected yet. Your draft is ready to share once the backend is available.');
	}

	return (
		<div className="mt-6 rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-5">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-sm uppercase tracking-[0.25em] text-rose-200/80">Write a Review</p>
					<h4 className="mt-2 text-xl font-semibold text-white">Share feedback for {bankName}</h4>
				</div>
				<button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10" aria-label="Close review composer">
					<X className="h-4 w-4" aria-hidden="true" />
				</button>
			</div>
			<form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
				<label className="block sm:col-span-1">
					<span className="mb-2 block text-sm font-medium text-slate-200">Your Name</span>
					<input value={reviewForm.name} onChange={(event) => setReviewForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Enter your name" />
				</label>
				<label className="block sm:col-span-1">
					<span className="mb-2 block text-sm font-medium text-slate-200">Rating</span>
					<select value={reviewForm.rating} onChange={(event) => setReviewForm((current) => ({ ...current, rating: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none">
						{['5', '4', '3', '2', '1'].map((value) => <option key={value} value={value}>{value} stars</option>)}
					</select>
				</label>
				<label className="block sm:col-span-2">
					<span className="mb-2 block text-sm font-medium text-slate-200">Comment</span>
					<textarea value={reviewForm.comment} onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))} rows={4} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="What was your experience?" />
				</label>
				{fieldError ? <p className="sm:col-span-2 text-sm text-rose-200">{fieldError}</p> : null}
				{notice ? <p className="sm:col-span-2 text-sm text-amber-100">{notice}</p> : null}
				<div className="sm:col-span-2 flex flex-wrap gap-3">
					<button type="submit" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">
						<RefreshCcw className="h-4 w-4" aria-hidden="true" />
						Publish Review
					</button>
					<button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}

function RequestBloodModal({ bank, requestForm, setRequestForm, onClose, onSubmit, submitting, notice }) {
	const [formError, setFormError] = useState('');

	function updateField(field, value) {
		setRequestForm((current) => ({ ...current, [field]: value }));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setFormError('');

		const requiredFields = [
			['bloodGroup', 'Blood Group'],
			['unitsRequired', 'Units Required'],
			['patientName', 'Patient Name'],
			['hospitalName', 'Hospital Name'],
			['hospitalLocation', 'Hospital Location'],
			['requiredDate', 'Required Date'],
			['contactNumber', 'Contact Number'],
		];

		const missingField = requiredFields.find(([field]) => !requestForm[field]?.toString().trim());
		if (missingField) {
			setFormError(`${missingField[1]} is required.`);
			return;
		}

		await onSubmit({
			bloodBankId: bank.id,
			bloodBankName: bank.name,
			...requestForm,
			unitsRequired: Number(requestForm.unitsRequired),
		});
	}

	return (
		<div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md">
			<div className="glass-card w-full max-w-3xl overflow-hidden rounded-[2rem]">
				<div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
					<div>
						<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Request Blood</p>
						<h3 className="mt-2 text-2xl font-semibold text-white">Submit a blood request</h3>
					</div>
					<button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10" aria-label="Close request modal">
						<X className="h-5 w-5" aria-hidden="true" />
					</button>
				</div>
				<form onSubmit={handleSubmit} className="grid gap-4 px-6 py-6 sm:grid-cols-2">
					<Field label="Blood Group">
						<select value={requestForm.bloodGroup} onChange={(event) => updateField('bloodGroup', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none">
							{bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
						</select>
					</Field>
					<Field label="Units Required">
						<select value={requestForm.unitsRequired} onChange={(event) => updateField('unitsRequired', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none">
							{['1', '2', '3', '4', '5+'].map((unit) => <option key={unit} value={unit}>{unit}</option>)}
						</select>
					</Field>
					<Field label="Patient Name"><input value={requestForm.patientName} onChange={(event) => updateField('patientName', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Patient name" /></Field>
					<Field label="Hospital Name"><input value={requestForm.hospitalName} onChange={(event) => updateField('hospitalName', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Hospital name" /></Field>
					<Field label="Hospital Location"><input value={requestForm.hospitalLocation} onChange={(event) => updateField('hospitalLocation', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Hospital location" /></Field>
					<Field label="Required Date"><input type="date" value={requestForm.requiredDate} onChange={(event) => updateField('requiredDate', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none" /></Field>
					<Field label="Contact Number"><input value={requestForm.contactNumber} onChange={(event) => updateField('contactNumber', event.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Contact number" /></Field>
					<Field label="Additional Message" fullWidth>
						<textarea value={requestForm.additionalMessage} onChange={(event) => updateField('additionalMessage', event.target.value)} rows={4} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none placeholder:text-slate-500" placeholder="Optional details for the request" />
					</Field>
					{formError ? <p className="sm:col-span-2 text-sm text-rose-200">{formError}</p> : null}
					{notice ? <p className="sm:col-span-2 text-sm text-amber-100">{notice}</p> : null}
					<div className="sm:col-span-2 flex flex-wrap gap-3 pt-2">
						<button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60">
							{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
							Submit Blood Request
						</button>
						<button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function Field({ label, children, fullWidth = false }) {
	return (
		<label className={fullWidth ? 'block sm:col-span-2' : 'block'}>
			<span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
			{children}
		</label>
	);
}

function BloodBankDetailsSkeleton() {
	return (
		<div className="min-h-screen bg-blood-radial px-4 py-10 text-slate-100">
			<div className="section-shell space-y-6 animate-pulse">
				<div className="glass-card rounded-[2rem] p-6 sm:p-8">
					<div className="h-4 w-56 rounded-full bg-white/10" />
					<div className="mt-6 h-10 w-80 rounded-full bg-white/10" />
					<div className="mt-4 h-5 w-2/3 rounded-full bg-white/10" />
				</div>
				<div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
					<div className="glass-card rounded-[2rem] p-6 sm:p-8">
						<div className="h-20 rounded-3xl bg-white/10" />
						<div className="mt-6 grid gap-3 sm:grid-cols-3">
							<div className="h-20 rounded-3xl bg-white/10" />
							<div className="h-20 rounded-3xl bg-white/10" />
							<div className="h-20 rounded-3xl bg-white/10" />
						</div>
					</div>
					<div className="glass-card rounded-[2rem] p-6 sm:p-8">
						<div className="h-8 w-1/2 rounded-full bg-white/10" />
						<div className="mt-6 space-y-3">
							<div className="h-16 rounded-2xl bg-white/10" />
							<div className="h-16 rounded-2xl bg-white/10" />
							<div className="h-16 rounded-2xl bg-white/10" />
						</div>
					</div>
				</div>
				<div className="grid gap-6 xl:grid-cols-2">
					<div className="glass-card rounded-[2rem] p-6 sm:p-8">
						<div className="h-8 w-60 rounded-full bg-white/10" />
						<div className="mt-6 grid gap-4 sm:grid-cols-2">
							{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-28 rounded-[1.75rem] bg-white/10" />)}
						</div>
					</div>
					<div className="glass-card rounded-[2rem] p-6 sm:p-8">
						<div className="h-8 w-44 rounded-full bg-white/10" />
						<div className="mt-6 h-80 rounded-[1.75rem] bg-white/10" />
					</div>
				</div>
				<div className="glass-card rounded-[2rem] p-6 sm:p-8">
					<div className="h-8 w-52 rounded-full bg-white/10" />
					<div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
						{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-24 rounded-3xl bg-white/10" />)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default BloodBankDetailsPage;