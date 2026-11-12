function formatTime(iso) {
	if (!iso) return '';
	try {
		const d = new Date(iso);
		return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
	} catch (_) { return ''; }
}

const META = {
	REQUEST_CREATED: { label: 'Request created', dot: 'bg-sky-500' },
	REQUEST_RECEIVED: { label: 'Request received by blood bank', dot: 'bg-indigo-500' },
	REQUEST_ACCEPTED: { label: 'Request accepted', dot: 'bg-emerald-500' },
	PARTIAL_FULFILLMENT: { label: 'Partial fulfillment recorded', dot: 'bg-violet-500' },
	REQUEST_FULFILLED: { label: 'Request fulfilled', dot: 'bg-emerald-600' },
	REQUEST_DECLINED: { label: 'Request declined', dot: 'bg-rose-500' },
};

export default function RequestActivityTimeline({ events = [] }) {
	if (!events.length) {
		return (
			<p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No activity recorded yet.</p>
		);
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
