import { useNavigate } from 'react-router-dom';

const URGENCY_META = {
	CRITICAL: { label: 'Critical', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
	HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
	MEDIUM: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
	LOW: { label: 'Low', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
};

function Row({ item, onView, onRespond }) {
	const urgency = URGENCY_META[item.urgency] || URGENCY_META.MEDIUM;
	return (
		<li className="rounded-xl border border-rose-200 bg-rose-50/30 p-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap items-center gap-2">
					<span className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1 text-sm font-bold text-rose-700 ring-1 ring-rose-200">{item.bloodGroup}</span>
					<span className="rounded-md bg-white px-2 py-1 text-xs font-mono text-slate-700 ring-1 ring-slate-200">{item.id}</span>
					<span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${urgency.bg} ${urgency.text} ring-1 ${urgency.ring}`}>
						{urgency.label}
					</span>
					<span className="text-sm text-slate-700">{item.units ?? 0} units</span>
					<span className="text-sm text-slate-500">• {item.location || '—'}</span>
				</div>
				<div className="flex items-center gap-2 text-xs text-slate-500">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
					{item.receivedAt || '—'}
				</div>
			</div>
			<div className="mt-3 flex flex-wrap items-center justify-between gap-2">
				<span className="text-xs text-slate-500">Status: <span className="font-medium text-slate-700">{item.status || 'Pending'}</span></span>
				<div className="flex flex-wrap gap-2">
					<button type="button" onClick={() => onView?.(item)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">View Request</button>
					<button type="button" onClick={() => onRespond?.(item)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700">Respond</button>
				</div>
			</div>
		</li>
	);
}

export default function EmergencyRequests({ items = [], onView, onRespond }) {
	const navigate = useNavigate();
	return (
		<section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
			<header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-rose-700 inline-flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
						Emergency Blood Requests
					</h2>
					<p className="text-sm text-slate-500">High-priority cases requiring immediate response</p>
				</div>
				<button type="button" onClick={() => navigate('/blood-bank/requests?type=emergency')} className="text-sm font-semibold text-rose-700 hover:underline">View all</button>
			</header>

			{items.length === 0 ? (
				<div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
					<p className="text-sm font-semibold text-slate-700">No active emergency requests</p>
					<p className="mt-1 text-xs text-slate-500">There are currently no emergency blood requests requiring action.</p>
				</div>
			) : (
				<ul role="list" className="mt-4 space-y-3">
					{items.map((item) => (
						<Row key={item.id} item={item} onView={onView} onRespond={onRespond} />
					))}
				</ul>
			)}
		</section>
	);
}
