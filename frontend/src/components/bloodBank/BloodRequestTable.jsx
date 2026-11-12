const URGENCY_META = {
	CRITICAL: { label: 'Emergency', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
	HIGH: { label: 'Urgent', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
	MEDIUM: { label: 'Normal', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
	LOW: { label: 'Normal', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
};

const STATUS_META = {
	PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700' },
	MATCHING: { label: 'Reviewing', bg: 'bg-sky-50', text: 'text-sky-700' },
	ACCEPTED: { label: 'Accepted', bg: 'bg-indigo-50', text: 'text-indigo-700' },
	PARTIALLY_FULFILLED: { label: 'Partially Fulfilled', bg: 'bg-violet-50', text: 'text-violet-700' },
	FULFILLED: { label: 'Fulfilled', bg: 'bg-emerald-50', text: 'text-emerald-700' },
	CANCELLED: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-700' },
	EXPIRED: { label: 'Expired', bg: 'bg-slate-50', text: 'text-slate-700' },
};

export function urgencyLabel(u) { return URGENCY_META[u]?.label || u; }
export function statusLabel(s) { return STATUS_META[s]?.label || s; }

function formatDateTime(iso) {
	if (!iso) return '—';
	try {
		const d = new Date(iso);
		return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
	} catch (_) { return '—'; }
}

function privacySafeLocation(r) {
	if (r.city) return r.city;
	if (r.hospitalAddress) return r.hospitalAddress;
	return '—';
}

export default function BloodRequestTable({ items = [], onView, onRespond }) {
	if (!items.length) return null;
	return (
		<div className="hidden md:block -mx-2 overflow-x-auto">
			<table className="min-w-full divide-y divide-slate-200 text-sm">
				<thead>
					<tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
						<th className="px-2 py-2">Request ID</th>
						<th className="px-2 py-2">Blood Group</th>
						<th className="px-2 py-2">Units</th>
						<th className="px-2 py-2">Urgency</th>
						<th className="px-2 py-2 hidden lg:table-cell">Hospital</th>
						<th className="px-2 py-2 hidden lg:table-cell">Location</th>
						<th className="px-2 py-2 hidden xl:table-cell">Requested</th>
						<th className="px-2 py-2">Status</th>
						<th className="px-2 py-2 text-right">Action</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-100">
					{items.map((r) => {
						const u = URGENCY_META[r.urgency] || URGENCY_META.MEDIUM;
						const s = STATUS_META[r.status] || STATUS_META.PENDING;
						return (
							<tr key={r._id} className="text-slate-700 hover:bg-slate-50/60">
								<td className="px-2 py-2 font-mono text-xs">{r._id}</td>
								<td className="px-2 py-2"><span className="inline-flex items-center justify-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">{r.bloodGroup}</span></td>
								<td className="px-2 py-2">{r.unitsRequired}</td>
								<td className="px-2 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.bg} ${u.text} ring-1 ${u.ring}`}>{u.label}</span></td>
								<td className="px-2 py-2 hidden lg:table-cell">{r.hospitalName || '—'}</td>
								<td className="px-2 py-2 hidden lg:table-cell">{privacySafeLocation(r)}</td>
								<td className="px-2 py-2 hidden xl:table-cell text-xs text-slate-500">{formatDateTime(r.createdAt)}</td>
								<td className="px-2 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span></td>
								<td className="px-2 py-2 text-right">
									<div className="inline-flex gap-1.5">
										<button type="button" onClick={() => onView?.(r)} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">View</button>
										<button type="button" onClick={() => onRespond?.(r)} className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700">Respond</button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
