import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
	AlertTriangle,
	Bell,
	Calendar,
	ChevronDown,
	ClipboardList,
	Droplet,
	Heart,
	HeartHandshake,
	Hospital,
	LayoutDashboard,
	LogOut,
	MapPin,
	Menu,
	Search,
	Settings,
	ShieldCheck,
	User,
	UserPlus,
	Users,
	X,
} from 'lucide-react';

export const donorSidebar = [
	{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
	{ label: 'Find Blood', to: '/find-blood', icon: Search },
	{ label: 'Find Donor', to: '/find-donor', icon: UserPlus },
	{ label: 'Blood Banks', to: '/blood-banks', icon: Hospital },
	{ label: 'My Requests', to: '/dashboard', icon: ClipboardList },
	{ label: 'Donation History', to: '/donation-history', icon: Heart },
	{ label: 'Availability', to: '/profile', icon: ShieldCheck },
	{ label: 'Profile', to: '/profile', icon: User },
	{ label: 'Notifications', to: '/notifications', icon: Bell },
	{ label: 'Settings', to: '/settings', icon: Settings },
];

export const seekerSidebar = [
	{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
	{ label: 'Find Blood', to: '/find-blood', icon: Search },
	{ label: 'Find Donor', to: '/find-donor', icon: UserPlus },
	{ label: 'Blood Banks', to: '/blood-banks', icon: Hospital },
	{ label: 'My Requests', to: '/dashboard', icon: ClipboardList },
	{ label: 'Emergency Request', to: '/emergency-request', icon: AlertTriangle },
	{ label: 'Profile', to: '/profile', icon: User },
	{ label: 'Notifications', to: '/notifications', icon: Bell },
	{ label: 'Settings', to: '/settings', icon: Settings },
];

export const bloodBankSidebar = [
	{ label: 'Dashboard', to: '/blood-bank/dashboard', icon: LayoutDashboard },
	{ label: 'Inventory', to: '/blood-bank/inventory', icon: Droplet },
	{ label: 'Blood Requests', to: '/blood-bank/requests', icon: ClipboardList },
	{ label: 'Donations', to: '/blood-bank/donations', icon: Heart },
	{ label: 'Notifications', to: '/notifications', icon: Bell },
	{ label: 'Profile', to: '/blood-bank/profile', icon: User },
	{ label: 'Settings', to: '/settings', icon: Settings },
];

export const adminSidebar = [
	{ label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
	{ label: 'Users', to: '/admin/users', icon: Users },
	{ label: 'Blood Banks', to: '/admin/blood-banks', icon: Hospital },
	{ label: 'Blood Requests', to: '/admin/requests', icon: ClipboardList },
	{ label: 'Notifications', to: '/notifications', icon: Bell },
	{ label: 'Settings', to: '/settings', icon: Settings },
];

export function getSidebarForRole(role) {
	if (role === 'donor') return donorSidebar;
	if (role === 'seeker') return seekerSidebar;
	if (role === 'bloodbank' || role === 'blood_bank') return bloodBankSidebar;
	if (role === 'admin') return adminSidebar;
	return seekerSidebar;
}

export default function DashboardLayout({ user, items, children, pageTitle, pageSubtitle, primaryAction, secondaryAction, unreadNotifications = 0 }) {
	const navigate = useNavigate();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const profileRef = useRef(null);
	const navItems = items || getSidebarForRole(user?.role);

	function handleLogout() {
		try {
			localStorage.removeItem('lifelink_token');
			localStorage.removeItem('lifelink_user');
			try { window.dispatchEvent(new Event('lifelink-auth-changed')); } catch (_) {}
		} catch (_) {}
		setProfileOpen(false);
		navigate('/login');
	}

	function handleProfileNavigate(path) {
		setProfileOpen(false);
		setSidebarOpen(false);
		navigate(path);
	}

	useEffect(() => {
		if (!profileOpen) return undefined;
		function onClick(e) {
			if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
		}
		function onKey(e) { if (e.key === 'Escape') setProfileOpen(false); }
		document.addEventListener('mousedown', onClick);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('mousedown', onClick);
			document.removeEventListener('keydown', onKey);
		};
	}, [profileOpen]);

	return (
		<div className="min-h-screen overflow-x-hidden bg-blood-radial text-slate-100">
			{sidebarOpen ? (
				<button
					type="button"
					aria-label="Close sidebar"
					onClick={() => setSidebarOpen(false)}
					className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden"
				/>
			) : null}

			<aside className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-white/10 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
				<div className="flex h-full flex-col">
					<div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
						<Link to="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
							<span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-glow shadow-rose-500/30">
								<Droplet className="h-5 w-5 text-white" aria-hidden="true" />
							</span>
							<span className="text-lg font-semibold tracking-tight text-white">LifeLink</span>
						</Link>
						<button type="button" onClick={() => setSidebarOpen(false)} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 lg:hidden" aria-label="Close sidebar">
							<X className="h-4 w-4" aria-hidden="true" />
						</button>
					</div>

					<div className="flex-1 overflow-y-auto px-4 py-6">
						<nav aria-label="Dashboard navigation" className="space-y-1">
							{navItems.map((item) => {
								const Icon = item.icon;
								return (
									<NavLink
										key={`${item.label}-${item.to}`}
										to={item.to}
										end={item.to === '/dashboard' || item.to === '/blood-bank/dashboard'}
										onClick={() => setSidebarOpen(false)}
										className={({ isActive }) =>
											[
												'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
												isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
											].join(' ')
										}
									>
										<Icon className="h-4 w-4" aria-hidden="true" />
										{item.label}
									</NavLink>
								);
							})}
						</nav>
					</div>

					<div className="border-t border-white/10 px-4 py-4">
						{user ? (
							<div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/15 text-sm font-semibold text-rose-100">
									{user.name?.[0] || 'U'}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold text-white">{user.name || 'User'}</p>
									<p className="truncate text-xs text-slate-400">{user.email || ''}</p>
								</div>
							</div>
						) : null}
						<button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-rose-200 transition hover:bg-rose-500/10">
							<LogOut className="h-4 w-4" aria-hidden="true" /> Logout
						</button>
					</div>
				</div>
			</aside>

			<div className="flex min-h-screen flex-col lg:pl-72">
				<header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
					<div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
						<div className="flex items-center gap-3">
							<button type="button" onClick={() => setSidebarOpen(true)} className="rounded-full border border-white/10 bg-white/5 p-2 text-white lg:hidden" aria-label="Open sidebar">
								<Menu className="h-5 w-5" aria-hidden="true" />
							</button>
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-200/80">{user?.role || 'user'}</p>
								<h2 className="text-lg font-semibold text-white sm:text-xl">{pageTitle || 'Dashboard'}</h2>
							</div>
						</div>
					<div className="flex items-center gap-2">
						<Link
							to="/notifications"
							className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
							aria-label={`Open notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
						>
							<Bell className="h-5 w-5" aria-hidden="true" />
							{unreadNotifications > 0 ? (
								<span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-lg shadow-rose-500/30">
									{unreadNotifications > 99 ? '99+' : unreadNotifications}
								</span>
							) : null}
						</Link>
						{primaryAction}
						{secondaryAction}
						<div className="relative" ref={profileRef}>
							<button
								type="button"
								onClick={() => setProfileOpen((v) => !v)}
								className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-2 text-white transition hover:bg-white/10"
								aria-haspopup="menu"
								aria-expanded={profileOpen}
								aria-label="Open profile menu"
							>
								<span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-xs font-semibold">
									{(user?.name?.[0] || 'U').toUpperCase()}
								</span>
								<span className="hidden text-left text-xs sm:block">
									<span className="block font-semibold">{user?.name || 'Account'}</span>
								</span>
								<ChevronDown className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />
							</button>
							{profileOpen ? (
								<div role="menu" className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-1 shadow-2xl backdrop-blur-xl">
									<div className="px-3 py-2 text-xs text-slate-400">
										<p className="truncate text-sm font-semibold text-white">{user?.name || 'Account'}</p>
										<p className="truncate text-xs">{user?.email || ''}</p>
									</div>
									<button type="button" role="menuitem" onClick={() => handleProfileNavigate('/profile')} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10">
										<User className="h-4 w-4" aria-hidden="true" /> Profile
									</button>
									<button type="button" role="menuitem" onClick={() => handleProfileNavigate('/settings')} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10">
										<Settings className="h-4 w-4" aria-hidden="true" /> Settings
									</button>
									<button type="button" role="menuitem" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-200 hover:bg-rose-500/10">
										<LogOut className="h-4 w-4" aria-hidden="true" /> Logout
									</button>
								</div>
							) : null}
						</div>
					</div>
					</div>
					{pageSubtitle ? (
						<div className="border-t border-white/10 px-4 py-3 text-sm text-slate-300 sm:px-6">{pageSubtitle}</div>
					) : null}
				</header>

				<main className="flex-1">
					<div className="px-4 py-6 sm:px-6 lg:py-8">{children}</div>
				</main>
			</div>
		</div>
	);
}
