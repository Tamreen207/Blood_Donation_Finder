const ACTIVITY_META = {
	REQUEST_RECEIVED: { label: 'Request received', icon: '📥', tone: 'text-sky-700 bg-sky-50 ring-sky-200' },
	REQUEST_ACCEPTED: { label: 'Request accepted', icon: '✅', tone: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
	INVENTORY_UPDATED: { label: 'Inventory updated', icon: '📦', tone: 'text-indigo-700 bg-indigo-50 ring-indigo-200' },
	DONATION_RECORDED: { label: 'Donation recorded', icon: '🩸', tone: 'text-rose-700 bg-rose-50 ring-rose-200' },
	EMERGENCY_REQUEST: { label: 'Emergency request', icon: '🚨', tone: 'text-rose-700 bg-rose-50 ring-rose-200' },
	STATUS_CHANGED: { label: 'Stock status changed', icon: '🔄', tone: 'text-amber-700 bg-amber-50 ring-amber-200' },
	REQUEST_FULFILLED: { label: 'Request fulfilled', icon: '🏁', tone: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
};

export default function RecentActivity({ items = [] }) {
	if (!items.length) {
		return (
			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<header>
					<h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
					<p className="text-sm text-slate-500">No recent activity to display.</p>
				</header>
			</section>
		);
	}
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header>
				<h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
				<p className="text-sm text-slate-500">Latest events from your blood bank</p>
			</header>
			<ol className="mt-4 space-y-3" role="list">
				{items.map((item, idx) => {
					const meta = ACTIVITY_META[item.type] || { label: item.type || 'Event', icon: '•', tone: 'text-slate-700 bg-slate-50 ring-slate-200' };
					return (
						<li key={idx} className="flex items-start gap-3">
							<span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ring-1 ${meta.tone}`} aria-hidden="true">{meta.icon}</span>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-slate-800">{item.title || meta.label}</p>
								{item.description && <p className="text-xs text-slate-500 truncate">{item.description}</p>}
							</div>
							<span className="shrink-0 text-xs text-slate-500">{item.timeAgo || ''}</span>
						</li>
					);
				})}
			</ol>
		</section>
	);
}
