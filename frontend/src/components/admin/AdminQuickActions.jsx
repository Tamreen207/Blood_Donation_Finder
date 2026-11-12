import { useNavigate } from 'react-router-dom';
import { Users, Hospital, ClipboardList, Bell, Settings, BarChart3, RefreshCw } from 'lucide-react';

const ACTIONS = [
	{ key: 'users', label: 'Manage Users', to: '/admin/users', icon: Users, tone: 'bg-rose-600 text-white' },
	{ key: 'banks', label: 'Manage Blood Banks', to: '/admin/blood-banks', icon: Hospital, tone: 'bg-white text-slate-800 ring-1 ring-slate-300' },
	{ key: 'requests', label: 'Manage Requests', to: '/admin/requests', icon: ClipboardList, tone: 'bg-white text-slate-800 ring-1 ring-slate-300' },
	{ key: 'analytics', label: 'View Analytics', to: '/admin/dashboard', icon: BarChart3, tone: 'bg-white text-slate-800 ring-1 ring-slate-300' },
	{ key: 'notifications', label: 'Notifications', to: '/notifications', icon: Bell, tone: 'bg-white text-slate-800 ring-1 ring-slate-300' },
	{ key: 'settings', label: 'Settings', to: '/settings', icon: Settings, tone: 'bg-white text-slate-800 ring-1 ring-slate-300' },
];

export default function AdminQuickActions({ onRefresh, refreshing }) {
	const navigate = useNavigate();
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Quick actions">
			<header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-base font-semibold text-slate-900">Quick Actions</h2>
					<p className="text-sm text-slate-500">Common administrative tasks</p>
				</div>
				{onRefresh && (
					<button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
						<RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" /> {refreshing ? 'Refreshing…' : 'Refresh'}
					</button>
				)}
			</header>
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{ACTIONS.map((a) => {
					const Icon = a.icon;
					return (
						<button key={a.key} type="button" onClick={() => navigate(a.to)} className={`inline-flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${a.tone}`}>
							<span className="inline-flex items-center gap-2"><Icon className="h-4 w-4" aria-hidden="true" />{a.label}</span>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
						</button>
					);
				})}
			</div>
		</section>
	);
}
