function timeAgo(iso) {
	if (!iso) return '';
	const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
	if (m < 1) return 'just now';
	if (m < 60) return `${m} min ago`;
	const h = Math.round(m / 60);
	if (h < 24) return `${h} hr ago`;
	return `${Math.round(h / 24)} d ago`;
}

const ICON_MAP = {
	REQUEST_NEW: { label: 'Blood request created', icon: '📥' },
	REQUEST_FULFILLED: { label: 'Request fulfilled', icon: '✅' },
	EMERGENCY: { label: 'Emergency request', icon: '🚨' },
	BLOOD_BANK: { label: 'Blood bank registered', icon: '🏥' },
	DONATION: { label: 'Donation recorded', icon: '🩸' },
	USER: { label: 'New user', icon: '👤' },
};

export default function AdminActivityTimeline({ items = [] }) {
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Recent activity">
			<header className="mb-4">
				<h2 className="text-base font-semibold text-slate-900">System Activity</h2>
				<p className="text-sm text-slate-500">Latest platform events</p>
			</header>
			{items.length === 0 ? (
				<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
					<p className="text-sm font-semibold text-slate-800">No recent activity</p>
				</div>
			) : (
				<ol className="relative space-y-3 pl-5" role="list">
					<span className="absolute left-1.5 top-1 bottom-1 w-px bg-slate-200" aria-hidden="true" />
					{items.slice(0, 10).map((it, idx) => {
						const meta = ICON_MAP[it.type] || { label: it.label || it.type || 'Event', icon: '•' };
						return (
							<li key={idx} className="relative">
								<span className="absolute -left-3.5 top-1.5 inline-block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" aria-hidden="true" />
								<p className="text-sm font-medium text-slate-800">{meta.icon} {it.title || meta.label}{it.entityId ? ` · ${it.entityId}` : ''}</p>
								<p className="text-xs text-slate-500">{timeAgo(it.at || it.createdAt)}</p>
							</li>
						);
					})}
				</ol>
			)}
		</section>
	);
}
