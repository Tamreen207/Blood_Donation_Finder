import { useNavigate } from 'react-router-dom';

const SEVERITY_META = {
	EMERGENCY: { label: 'Emergency', tone: 'bg-rose-50 text-rose-700 ring-rose-200' },
	INVENTORY: { label: 'Inventory', tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
	REQUEST: { label: 'Request', tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
	DONATION: { label: 'Donation', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
	INFO: { label: 'Info', tone: 'bg-slate-50 text-slate-700 ring-slate-200' },
};

export default function RecentNotifications({ items = [] }) {
	const navigate = useNavigate();
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">Recent Notifications</h2>
					<p className="text-sm text-slate-500">Latest updates for your blood bank</p>
				</div>
				<button type="button" onClick={() => navigate('/notifications')} className="text-sm font-semibold text-rose-700 hover:underline">View all notifications</button>
			</header>

			{items.length === 0 ? (
				<p className="mt-4 text-sm text-slate-500">No new notifications.</p>
			) : (
				<ul className="mt-4 space-y-2" role="list">
					{items.slice(0, 5).map((n, idx) => {
						const meta = SEVERITY_META[n.severity] || SEVERITY_META.INFO;
						return (
							<li key={idx} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3">
								<span className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${meta.tone}`}>{meta.label}</span>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-slate-800 truncate">{n.title || 'Notification'}</p>
									{n.description && <p className="text-xs text-slate-500 truncate">{n.description}</p>}
								</div>
								<span className="shrink-0 text-xs text-slate-500">{n.timeAgo || ''}</span>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
