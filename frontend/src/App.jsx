import { useState } from 'react';
import {
	AlertTriangle,
	ArrowRight,
	BadgeCheck,
	Building2,
	Clock3,
	Droplets,
	Facebook,
	Globe2,
	HeartPulse,
	HelpCircle,
	Instagram,
	LayoutGrid,
	Linkedin,
	LogIn,
	Mail,
	Menu,
	MapPin,
	MessageSquareQuote,
	Phone,
	Search,
	ShieldCheck,
	Sparkles,
	Twitter,
	UserPlus,
	Users,
	X,
} from 'lucide-react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FindBloodPage from './pages/FindBloodPage';
import BloodBanksPage from './pages/BloodBanksPage';
import BloodBankDetailsPage from './pages/BloodBankDetailsPage';
import FindDonorPage from './pages/FindDonorPage';
import DonorProfilePage from './pages/DonorProfilePage';
import CreateBloodRequestPage from './pages/CreateBloodRequestPage';
import EmergencyRequestPage from './pages/EmergencyRequestPage';
import RequestTrackingPage from './pages/RequestTrackingPage';
import DonationHistoryPage from './pages/DonationHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import UserProfilePage from './pages/UserProfilePage';
import SettingsPage from './pages/SettingsPage';
import BloodBankDashboard from './pages/BloodBankDashboard';
import BloodBankRequests from './pages/BloodBankRequests';
import BloodBankDonations from './pages/BloodBankDonations';
import BloodBankProfile from './pages/BloodBankProfile';
import AdminDashboard from './pages/AdminDashboard';

const navItems = [
	{ label: 'Home', to: '/' },
	{ label: 'Find Blood', to: '/find-blood' },
	{ label: 'Find Donor', to: '/find-donor' },
	{ label: 'Blood Banks', to: '/blood-banks' },
];

const stats = [
	{ value: '24/7', label: 'Emergency Support', icon: Clock3 },
	{ value: 'Live', label: 'Request Tracking', icon: HeartPulse },
	{ value: 'Secure', label: 'Role-based Access', icon: ShieldCheck },
	{ value: 'Nearby', label: 'Location-aware Search', icon: Building2 },
];

const steps = [
	{ title: 'Search', description: 'Enter blood group and location to find nearby matches.', icon: Search },
	{ title: 'Find a Match', description: 'Compare compatible donors and blood banks.', icon: BadgeCheck },
	{ title: 'Request Blood', description: 'Submit a request with hospital and urgency details.', icon: LayoutGrid },
	{ title: 'Coordinate', description: 'Track responses and coordinate fulfillment.', icon: HeartPulse },
];

const features = [
	{ title: 'Find Blood', description: 'Search compatible blood from registered sources.', icon: Search },
	{ title: 'Find Donors', description: 'Discover nearby available donors by blood group.', icon: Users },
	{ title: 'Locate Blood Banks', description: 'View registered blood banks and inventory status.', icon: Building2 },
	{ title: 'Emergency Requests', description: 'Raise urgent requests for faster visibility.', icon: AlertTriangle },
	{ title: 'Track Requests', description: 'Monitor request status and responses.', icon: Clock3 },
	{ title: 'Donation History', description: 'View donation and request activity records.', icon: HeartPulse },
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const testimonials = [
	{ quote: 'The request flow helps connect patients with nearby donors and blood banks quickly.', name: 'Patient Support User', role: 'Seeker' },
	{ quote: 'Donor availability and request visibility make coordination straightforward.', name: 'Registered Donor', role: 'Donor' },
	{ quote: 'Inventory and request tools help manage responses in one place.', name: 'Blood Bank Staff', role: 'Blood Bank' },
];

const quickLinks = [
	{ label: 'Home', to: '/' },
	{ label: 'Find Blood', to: '/find-blood' },
	{ label: 'Find Donor', to: '/find-donor' },
	{ label: 'Blood Banks', to: '/blood-banks' },
];

const services = [
	{ label: 'Emergency Request', to: '/emergency-request' },
	{ label: 'Create Request', to: '/request-blood' },
	{ label: 'Login', to: '/login' },
	{ label: 'Register', to: '/register' },
];

function App() {
	return (
		<Routes>
			<Route path="/" element={<LandingPage />} />
			<Route path="/find-blood" element={<FindBloodPage />} />
			<Route path="/find-donor" element={<FindDonorPage />} />
			<Route path="/donor/:id" element={<DonorProfilePage />} />
			<Route path="/request-blood" element={<CreateBloodRequestPage />} />
			<Route path="/blood-banks" element={<BloodBanksPage />} />
			<Route path="/blood-banks/:id" element={<BloodBankDetailsPage />} />
			<Route path="/about" element={<PlaceholderPage title="About" />} />
			<Route path="/contact" element={<PlaceholderPage title="Contact" />} />
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route path="/forgot-password" element={<PlaceholderPage title="Forgot Password" message="Password reset is not yet configured. Please contact support or sign in with your existing credentials." />} />
			<Route path="/dashboard" element={<DashboardPage />} />
			<Route path="/emergency-request" element={<EmergencyRequestPage />} />
			<Route path="/request-tracking/:id" element={<RequestTrackingPage />} />
			<Route path="/donation-history" element={<DonationHistoryPage />} />
			<Route path="/donation-history/:id" element={<DonationHistoryPage />} />
			<Route path="/notifications" element={<NotificationsPage />} />
			<Route path="/profile" element={<UserProfilePage />} />
			<Route path="/settings" element={<SettingsPage />} />
			<Route path="/blood-bank/dashboard" element={<BloodBankDashboard />} />
			<Route path="/blood-bank/requests" element={<BloodBankRequests />} />
			<Route path="/blood-bank/donations" element={<BloodBankDonations />} />
			<Route path="/blood-bank/profile" element={<BloodBankProfile />} />
			<Route path="/admin/dashboard" element={<AdminDashboard />} />
			<Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
		</Routes>
	);
}

function LandingPage() {
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<div className="min-h-screen overflow-x-hidden bg-blood-radial text-slate-100">
			<header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
				<div className="section-shell flex items-center justify-between py-4">
					<Link to="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
						<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-glow shadow-rose-500/30">
							<Droplets className="h-6 w-6 text-white" aria-hidden="true" />
						</span>
						<span className="text-xl font-semibold tracking-tight text-white">LifeLink</span>
					</Link>

					<nav className="hidden items-center gap-1 lg:flex">
						{navItems.map((item) => (
							<NavLink
								key={item.to}
								to={item.to}
								className={({ isActive }) =>
									[
										'rounded-full px-4 py-2 text-sm font-medium transition-colors',
										isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
									].join(' ')
								}
							>
								{item.label}
							</NavLink>
						))}
					</nav>

					<div className="hidden items-center gap-3 lg:flex">
						<Link
							to="/login"
							className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5"
						>
							<LogIn className="h-4 w-4" aria-hidden="true" />
							Login
						</Link>
						<Link
							to="/register"
							className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-rose-100"
						>
							<UserPlus className="h-4 w-4" aria-hidden="true" />
							Register
						</Link>
					</div>

					<button
						type="button"
						className="inline-flex items-center justify-center rounded-full border border-white/10 p-2 text-white lg:hidden"
						onClick={() => setMenuOpen((open) => !open)}
						aria-label="Toggle navigation menu"
						aria-expanded={menuOpen}
					>
						{menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
					</button>
				</div>

				{menuOpen ? (
					<div className="border-t border-white/10 bg-slate-950/95 lg:hidden">
						<div className="section-shell flex flex-col gap-2 py-4">
							{navItems.map((item) => (
								<NavLink
									key={item.to}
									to={item.to}
									onClick={() => setMenuOpen(false)}
									className={({ isActive }) =>
										[
											'rounded-2xl px-4 py-3 text-sm font-medium',
											isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
										].join(' ')
									}
								>
									{item.label}
								</NavLink>
							))}
							<div className="mt-2 grid grid-cols-2 gap-3">
								<Link
									to="/login"
									onClick={() => setMenuOpen(false)}
									className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-200"
								>
									<LogIn className="h-4 w-4" aria-hidden="true" />
									Login
								</Link>
								<Link
									to="/register"
									onClick={() => setMenuOpen(false)}
									className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
								>
									<UserPlus className="h-4 w-4" aria-hidden="true" />
									Register
								</Link>
							</div>
						</div>
					</div>
				) : null}
			</header>

			<main>
				<section className="relative overflow-hidden border-b border-white/10">
					<div className="section-shell grid gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
						<div className="relative z-10">
							<div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100">
								<AlertTriangle className="h-4 w-4" aria-hidden="true" />
								Emergency blood support available
							</div>

							<h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl xl:text-7xl">
								Find Blood. Save Lives.
							</h1>

							<p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
								Connect with nearby blood donors and blood banks quickly when every second matters.
							</p>

							<div className="mt-8 flex flex-col gap-4 sm:flex-row">
								<Link
									to="/login"
									className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-500/30"
								>
									Find Blood
									<ArrowRight className="h-4 w-4" aria-hidden="true" />
								</Link>
							</div>

							<div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-300">
								<span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
									<ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
									Verified blood bank listings
								</span>
								<span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
									<Clock3 className="h-4 w-4 text-sky-400" aria-hidden="true" />
									Live request tracking
								</span>
								<span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2">
									<Globe2 className="h-4 w-4 text-rose-300" aria-hidden="true" />
									Location-aware matching
								</span>
							</div>
						</div>

						<div className="relative">
							<div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-rose-500/20 blur-3xl" aria-hidden="true" />
							<div className="absolute bottom-0 right-6 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" aria-hidden="true" />

							<div className="glass-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
								<div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-red-400 to-amber-400" />
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-200/80">Emergency dashboard</p>
										<h2 className="mt-2 text-2xl font-semibold text-white">Rapid blood support network</h2>
									</div>
									<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200">
										<HeartPulse className="h-6 w-6" aria-hidden="true" />
									</div>
								</div>

								<div className="mt-8 grid gap-4 sm:grid-cols-2">
									<div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
										<div className="flex items-center gap-3">
											<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-200">
												<Droplets className="h-6 w-6" aria-hidden="true" />
											</div>
											<div>
												<p className="text-sm text-slate-400">Priority match</p>
												<p className="text-lg font-semibold text-white">O- donor nearby</p>
											</div>
										</div>
										<p className="mt-4 text-sm leading-6 text-slate-300">
											Compatible response path prepared for urgent requests.
										</p>
									</div>

									<div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
										<div className="flex items-center gap-3">
											<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-200">
												<MapPin className="h-6 w-6" aria-hidden="true" />
											</div>
											<div>
												<p className="text-sm text-slate-400">Nearest bank</p>
												<p className="text-lg font-semibold text-white">2.4 km away</p>
											</div>
										</div>
										<p className="mt-4 text-sm leading-6 text-slate-300">
											Blood bank location and availability surfaced instantly.
										</p>
									</div>
								</div>

								<div className="mt-4 grid gap-4 sm:grid-cols-[1fr_0.9fr]">
									<div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-slate-300">Support level</span>
											<span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">Stable</span>
										</div>
										<div className="mt-4 h-3 rounded-full bg-white/10">
											<div className="h-3 w-[82%] rounded-full bg-gradient-to-r from-rose-500 to-amber-400" />
										</div>
										<p className="mt-4 text-sm text-slate-300">Donor coverage remains strong across active regions.</p>
									</div>

									<div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
										<div className="flex items-center gap-3">
											<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
												<BadgeCheck className="h-6 w-6" aria-hidden="true" />
											</div>
											<div>
												<p className="text-sm text-slate-400">Response status</p>
												<p className="text-lg font-semibold text-white">3 donors notified</p>
											</div>
										</div>
										<p className="mt-4 text-sm leading-6 text-slate-300">
											Notifications prepared with short routing to the request.
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="section-shell py-16 lg:py-20">
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{stats.map((item) => {
							const Icon = item.icon;
							return (
								<article key={item.label} className="glass-card rounded-3xl p-6">
									<div className="flex items-center justify-between">
										<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
											<Icon className="h-6 w-6" aria-hidden="true" />
										</div>
										<Sparkles className="h-5 w-5 text-slate-500" aria-hidden="true" />
									</div>
									<p className="mt-6 text-3xl font-semibold text-white">{item.value}</p>
									<p className="mt-2 text-sm text-slate-300">{item.label}</p>
								</article>
							);
						})}
					</div>
				</section>

				<section className="section-shell py-16 lg:py-20">
					<div className="max-w-2xl">
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">How it works</p>
						<h2 className="section-title mt-4">A clear process for urgent and everyday support</h2>
						<p className="section-subtitle">LifeLink keeps the flow simple so donors, patients, and blood banks can connect without friction.</p>
					</div>

					<div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
						{steps.map((step, index) => {
							const Icon = step.icon;
							return (
								<article key={step.title} className="glass-card rounded-[1.75rem] p-6 transition hover:-translate-y-1 hover:border-white/20">
									<div className="flex items-center justify-between">
										<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300">
											<Icon className="h-6 w-6" aria-hidden="true" />
										</div>
										<span className="text-sm font-semibold text-slate-500">0{index + 1}</span>
									</div>
									<h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
									<p className="mt-3 text-sm leading-6 text-slate-300">{step.description}</p>
								</article>
							);
						})}
					</div>
				</section>

				<section className="section-shell py-16 lg:py-20">
					<div className="max-w-2xl">
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">Platform features</p>
						<h2 className="section-title mt-4">Everything needed to coordinate blood support</h2>
						<p className="section-subtitle">The platform emphasizes fast search, clear request handling, and dependable tracking for every role involved.</p>
					</div>

					<div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
						{features.map((feature) => {
							const Icon = feature.icon;
							return (
								<article key={feature.title} className="glass-card rounded-[1.75rem] p-6 transition hover:-translate-y-1 hover:border-white/20">
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-rose-200">
										<Icon className="h-6 w-6" aria-hidden="true" />
									</div>
									<h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
									<p className="mt-3 text-sm leading-6 text-slate-300">{feature.description}</p>
								</article>
							);
						})}
					</div>
				</section>

				<section className="section-shell py-16 lg:py-20">
					<div className="glass-card overflow-hidden rounded-[2rem] border-rose-400/20 bg-gradient-to-br from-rose-500/20 via-red-500/10 to-slate-900 p-8 sm:p-10 lg:p-12">
						<div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">Emergency response</p>
								<h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
									Need Blood Urgently?
								</h2>
								<p className="mt-4 max-w-2xl text-base leading-7 text-slate-200/90 sm:text-lg">
									Find compatible blood donors and nearby blood banks immediately.
								</p>
								<div className="mt-8">
									<Link
										to="/emergency-request"
										className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-rose-100"
									>
										Request Blood Now
										<ArrowRight className="h-4 w-4" aria-hidden="true" />
									</Link>
								</div>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
									<ShieldCheck className="h-6 w-6 text-emerald-300" aria-hidden="true" />
									<p className="mt-4 text-lg font-semibold text-white">Verified support</p>
									<p className="mt-2 text-sm leading-6 text-slate-300">Trusted routing to donors and banks.</p>
								</div>
								<div className="rounded-3xl border border-white/10 bg-slate-950/50 p-5">
									<Clock3 className="h-6 w-6 text-sky-300" aria-hidden="true" />
									<p className="mt-4 text-lg font-semibold text-white">Fast response</p>
									<p className="mt-2 text-sm leading-6 text-slate-300">Built for immediate action.</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="section-shell py-16 lg:py-20">
					<div className="glass-card grid gap-8 rounded-[2rem] p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">Donor call to action</p>
							<h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Become a Blood Donor</h2>
							<p className="mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
								Your one donation can help save multiple lives.
							</p>
							<div className="mt-8">
								<Link
									to="/login"
									className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
								>
									Find Blood
									<ArrowRight className="h-4 w-4" aria-hidden="true" />
								</Link>
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							{bloodGroups.map((group, index) => (
								<div
									key={group}
									className={`rounded-3xl border border-white/10 p-6 ${index % 2 === 0 ? 'bg-white/5' : 'bg-slate-950/50'}`}
								>
									<p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-400">Blood group</p>
									<p className="mt-4 text-4xl font-semibold text-white">{group}</p>
									<div className="mt-4 h-2 rounded-full bg-white/10">
										<div className="h-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-400" style={{ width: `${68 + index * 3}%` }} />
									</div>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="section-shell py-16 lg:py-20">
					<div className="max-w-2xl">
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">Testimonials</p>
						<h2 className="section-title mt-4">Stories from people who rely on the network</h2>
						<p className="section-subtitle">These are sample testimonials and do not refer to real people.</p>
					</div>

					<div className="mt-10 grid gap-5 lg:grid-cols-3">
						{testimonials.map((testimonial) => (
							<article key={testimonial.name} className="glass-card rounded-[1.75rem] p-6">
								<MessageSquareQuote className="h-6 w-6 text-rose-300" aria-hidden="true" />
								<p className="mt-5 text-sm leading-7 text-slate-300">{testimonial.quote}</p>
								<div className="mt-6 flex items-center gap-4">
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-sm font-semibold text-rose-100">
										{testimonial.name
											.split(' ')
											.map((part) => part[0])
											.join('')}
									</div>
									<div>
										<p className="font-semibold text-white">{testimonial.name}</p>
										<p className="text-sm text-slate-400">{testimonial.role}</p>
									</div>
								</div>
							</article>
						))}
					</div>
				</section>
			</main>

			<footer className="border-t border-white/10 bg-slate-950/95">
				<div className="section-shell py-14">
					<div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
						<div>
							<div className="flex items-center gap-3">
								<span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600">
									<Droplets className="h-6 w-6 text-white" aria-hidden="true" />
								</span>
								<span className="text-xl font-semibold text-white">LifeLink</span>
							</div>
							<p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
								A modern blood donation and blood bank finder built to connect people, support urgent requests, and save lives.
							</p>
							<div className="mt-6 flex items-center gap-3 text-slate-400">
								<a href="#" aria-label="Facebook" className="rounded-full border border-white/10 p-2 transition hover:border-white/20 hover:bg-white/5">
									<Facebook className="h-4 w-4" aria-hidden="true" />
								</a>
								<a href="#" aria-label="Twitter" className="rounded-full border border-white/10 p-2 transition hover:border-white/20 hover:bg-white/5">
									<Twitter className="h-4 w-4" aria-hidden="true" />
								</a>
								<a href="#" aria-label="Instagram" className="rounded-full border border-white/10 p-2 transition hover:border-white/20 hover:bg-white/5">
									<Instagram className="h-4 w-4" aria-hidden="true" />
								</a>
								<a href="#" aria-label="LinkedIn" className="rounded-full border border-white/10 p-2 transition hover:border-white/20 hover:bg-white/5">
									<Linkedin className="h-4 w-4" aria-hidden="true" />
								</a>
							</div>
						</div>

						<div>
							<h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Quick Links</h3>
							<ul className="mt-5 space-y-3 text-sm text-slate-300">
								{quickLinks.map((item) => (
									<li key={item.label}>
										<Link to={item.to} className="inline-flex items-center gap-2 transition hover:text-white">
											<ArrowRight className="h-4 w-4 text-rose-300" aria-hidden="true" />
											{item.label}
										</Link>
									</li>
								))}
							</ul>
						</div>

						<div>
							<h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Services</h3>
							<ul className="mt-5 space-y-3 text-sm text-slate-300">
								{services.map((item) => (
									<li key={item.label}>
										<Link to={item.to} className="inline-flex items-center gap-2 transition hover:text-white">
											<ArrowRight className="h-4 w-4 text-rose-300" aria-hidden="true" />
											{item.label}
										</Link>
									</li>
								))}
							</ul>
						</div>

						<div>
							<h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Contact</h3>
							<div className="mt-5 space-y-4 text-sm text-slate-300">
								<p className="flex items-start gap-3">
									<MapPin className="mt-0.5 h-4 w-4 text-rose-300" aria-hidden="true" />
									24 Hope Avenue, Health District
								</p>
								<p className="flex items-center gap-3">
									<Phone className="h-4 w-4 text-rose-300" aria-hidden="true" />
									+1 (555) 014-0200
								</p>
								<p className="flex items-center gap-3">
									<Mail className="h-4 w-4 text-rose-300" aria-hidden="true" />
									support@lifelink.org
								</p>
							</div>
						</div>
					</div>

					<div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
						<p>Copyright © {new Date().getFullYear()} LifeLink. All rights reserved.</p>
						<p className="inline-flex items-center gap-2">
							<ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
							Designed for urgent blood support and donor coordination
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}

function PlaceholderPage({ title, message }) {
	return (
		<div className="min-h-screen bg-blood-radial px-4 py-16 text-slate-100 sm:px-6 lg:px-8">
			<div className="section-shell flex min-h-[70vh] items-center justify-center">
				<div className="glass-card w-full max-w-2xl rounded-[2rem] p-8 text-center sm:p-10">
					<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-200">
						<HelpCircle className="h-8 w-8" aria-hidden="true" />
					</div>
					<h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
					<p className="mt-4 text-base leading-7 text-slate-300">
						{message || 'This page is not yet available. Please use the main application workflows from the dashboard or home page.'}
					</p>
					<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
						<Link to="/" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-rose-100">
							Back to Home
							<ArrowRight className="h-4 w-4" aria-hidden="true" />
						</Link>
						<Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
							Go to Dashboard
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}

export default App;
