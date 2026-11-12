import { useNavigate } from 'react-router-dom';

const ACTIONS = [
	{ key: 'inventory', label: 'Manage Inventory', to: '/blood-bank/inventory', tone: 'bg-rose-600 text-white' },
	{ key: 'requests', label: 'View Blood Requests', to: '/blood-bank/requests', tone: 'bg-white text-slate-800 ring-1 ring-slate-300' },
	{ key: 'donation', label: 'Record Donation', to: '/blood-bank/donations', tone: 'bg-white text-slate-800 ring-1 ring-slate-300' },
	{ key: 'stock', label: 'Update Blood Stock', to: '/blood-bank/inventory', tone: 'bg-white text-slate-800 ring-1 ring-slate-300' },
	{ key: 'profile', label: 'View Blood Bank Profile', to: '/profile', tone: 'bg-white text-slate-800 ring-1 ring-slate-300' },
	{ key: 'emergency', label: 'Emergency Requests', to: '/blood-bank/requests?type=emergency', tone: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' },
];

export default function QuickActions() {
	const navigate = useNavigate();
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header>
				<h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
				<p className="text-sm text-slate-500">Common tasks for your blood bank</p>
			</header>
			<div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{ACTIONS.map((a) => (
					<button
						key={a.key}
						type="button"
						onClick={() => navigate(a.to)}
						className={`inline-flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${a.tone}`}
					>
						<span>{a.label}</span>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
					</button>
				))}
			</div>
		</section>
	);
}
