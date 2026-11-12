const STATUS_META = {
	SCHEDULED: { label: 'Scheduled', bg: 'bg-amber-50', text: 'text-amber-700' },
	CHECKED_IN: { label: 'Checked In', bg: 'bg-sky-50', text: 'text-sky-700' },
	SCREENING: { label: 'Screening', bg: 'bg-indigo-50', text: 'text-indigo-700' },
	APPROVED: { label: 'Approved', bg: 'bg-violet-50', text: 'text-violet-700' },
	COLLECTED: { label: 'Collected', bg: 'bg-emerald-50', text: 'text-emerald-700' },
	REJECTED: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700' },
	DEFERRED: { label: 'Deferred', bg: 'bg-orange-50', text: 'text-orange-700' },
	CANCELLED: { label: 'Cancelled', bg: 'bg-slate-50', text: 'text-slate-700' },
};

const SCREEN_META = {
	PENDING: { label: 'Pending', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
	IN_PROGRESS: { label: 'In Progress', bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200' },
	PASSED: { label: 'Passed', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
	FAILED: { label: 'Failed', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
	REQUIRES_REVIEW: { label: 'Requires Review', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
};

const TYPE_META = {
	WHOLE_BLOOD: 'Whole Blood',
	PLASMA: 'Plasma',
	PLATELETS: 'Platelets',
	OTHER: 'Other',
};

export function donationStatusLabel(s) { return STATUS_META[s]?.label || s; }
export function screeningStatusLabel(s) { return SCREEN_META[s]?.label || s; }
export function donationTypeLabel(t) { return TYPE_META[t] || t; }

function formatDateTime(iso) {
	if (!iso) return '—';
	try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
	catch (_) { return '—'; }
}

export default function DonationTable({ items = [], onView, onManage }) {
	if (!items.length) return null;
	return (
		<div className="hidden md:block -mx-2 overflow-x-auto">
			<table className="min-w-full divide-y divide-slate-200 text-sm">
				<thead>
					<tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
						<th className="px-2 py-2">Donation ID</th>
						<th className="px-2 py-2">Donor</th>
						<th className="px-2 py-2">Blood Group</th>
						<th className="px-2 py-2 hidden md:table-cell">Type</th>
						<th className="px-2 py-2 hidden lg:table-cell">Date</th>
						<th className="px-2 py-2">Units</th>
						<th className="px-2 py-2 hidden md:table-cell">Screening</th>
						<th className="px-2 py-2">Status</th>
						<th className="px-2 py-2 text-right">Action</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-slate-100">
					{items.map((d) => {
						const s = STATUS_META[d.status] || STATUS_META.SCHEDULED;
						const sc = SCREEN_META[d.screeningStatus] || SCREEN_META.PENDING;
						return (
							<tr key={d._id} className="text-slate-700 hover:bg-slate-50/60">
								<td className="px-2 py-2 font-mono text-xs">{d._id}</td>
								<td className="px-2 py-2">{d.donor?.name || d.donorUserId || '—'}</td>
								<td className="px-2 py-2"><span className="inline-flex items-center justify-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">{d.bloodGroup}</span></td>
								<td className="px-2 py-2 hidden md:table-cell">{donationTypeLabel(d.donationType)}</td>
								<td className="px-2 py-2 hidden lg:table-cell text-xs text-slate-500">{formatDateTime(d.donationDate)}</td>
								<td className="px-2 py-2">{d.units}</td>
								<td className="px-2 py-2 hidden md:table-cell"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.text} ring-1 ${sc.ring}`}>{sc.label}</span></td>
								<td className="px-2 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span></td>
								<td className="px-2 py-2 text-right">
									<div className="inline-flex gap-1.5">
										<button type="button" onClick={() => onView?.(d)} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">View</button>
										<button type="button" onClick={() => onManage?.(d)} className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700">Manage</button>
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
