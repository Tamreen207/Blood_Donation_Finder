function formatTime(iso) {
	if (!iso) return '';
	try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
	catch (_) { return ''; }
}

const META = {
	SCHEDULED: { label: 'Donation scheduled', dot: 'bg-sky-500' },
	CHECKED_IN: { label: 'Donor checked in', dot: 'bg-indigo-500' },
	SCREENING_STARTED: { label: 'Screening started', dot: 'bg-violet-500' },
	APPROVED: { label: 'Donation approved', dot: 'bg-emerald-500' },
	COLLECTED: { label: 'Blood collected', dot: 'bg-emerald-600' },
	INVENTORY_UPDATED: { label: 'Inventory updated', dot: 'bg-emerald-700' },
	REJECTED: { label: 'Donation rejected', dot: 'bg-rose-500' },
	DEFERRED: { label: 'Donation deferred', dot: 'bg-orange-500' },
	CANCELLED: { label: 'Donation cancelled', dot: 'bg-slate-500' },
};

export default function DonationActivityTimeline({ events = [] }) {
	if (!events.length) {
		return <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No activity recorded yet.</p>;
	}
	return (
		<ol className="relative space-y-3 pl-5" role="list">
			<span className="absolute left-1.5 top-1 bottom-1 w-px bg-slate-200" aria-hidden="true" />
			{events.map((e, idx) => {
				const meta = META[e.type] || { label: e.label || e.type, dot: 'bg-slate-400' };
				return (
					<li key={idx} className="relative">
						<span className={`absolute -left-3.5 top-1.5 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white ${meta.dot}`} aria-hidden="true" />
						<p className="text-sm font-medium text-slate-800">{meta.label}</p>
						<p className="text-xs text-slate-500">{formatTime(e.at)}</p>
					</li>
				);
			})}
		</ol>
	);
}
