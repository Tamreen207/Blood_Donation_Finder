import { useNavigate } from 'react-router-dom';

const URGENCY_META = {
	CRITICAL: { label: 'Critical', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
	HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
	MEDIUM: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
	LOW: { label: 'Low', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
};

const STATUS_META = {
	PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700' },
	ACCEPTED: { label: 'Accepted', bg: 'bg-sky-50', text: 'text-sky-700' },
	IN_PROGRESS: { label: 'In Progress', bg: 'bg-indigo-50', text: 'text-indigo-700' },
	COMPLETED: { label: 'Completed', bg: 'bg-emerald-50', text: 'text-emerald-700' },
	REJECTED: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700' },
};

export default function PendingRequests({ items = [], onView, onRespond }) {
	const navigate = useNavigate();
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">Pending Blood Requests</h2>
					<p className="text-sm text-slate-500">Awaiting your response</p>
				</div>
				<button type="button" onClick={() => navigate('/blood-bank/requests')} className="text-sm font-semibold text-rose-700 hover:underline">View all</button>
			</header>

			{items.length === 0 ? (
				<div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
					<p className="text-sm font-semibold text-slate-700">No pending requests</p>
					<p className="mt-1 text-xs text-slate-500">There are currently no blood requests waiting for your response.</p>
				</div>
			) : (
				<div className="mt-4 -mx-2 overflow-x-auto">
					<table className="min-w-full divide-y divide-slate-200 text-sm">
						<thead>
							<tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
								<th className="px-2 py-2">Request ID</th>
								<th className="px-2 py-2">Blood Group</th>
								<th className="px-2 py-2">Units</th>
								<th className="px-2 py-2">Urgency</th>
								<th className="px-2 py-2 hidden md:table-cell">Location</th>
								<th className="px-2 py-2 hidden lg:table-cell">Requested</th>
								<th className="px-2 py-2">Status</th>
								<th className="px-2 py-2 text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{items.map((item) => {
								const u = URGENCY_META[item.urgency] || URGENCY_META.MEDIUM;
								const s = STATUS_META[item.status] || STATUS_META.PENDING;
								return (
									<tr key={item.id} className="text-slate-700">
										<td className="px-2 py-2 font-mono text-xs">{item.id}</td>
										<td className="px-2 py-2"><span className="inline-flex items-center justify-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">{item.bloodGroup}</span></td>
										<td className="px-2 py-2">{item.units ?? 0}</td>
										<td className="px-2 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${u.bg} ${u.text} ring-1 ${u.ring}`}>{u.label}</span></td>
										<td className="px-2 py-2 hidden md:table-cell">{item.location || '—'}</td>
										<td className="px-2 py-2 hidden lg:table-cell text-xs text-slate-500">{item.requestedAt || '—'}</td>
										<td className="px-2 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>{s.label}</span></td>
										<td className="px-2 py-2 text-right">
											<div className="inline-flex gap-1.5">
																<button type="button" onClick={() => onView?.(item)} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">View</button>
																<button type="button" onClick={() => onRespond?.(item)} className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700">Respond</button>
															</div>
														</td>
													</tr>
												);
											})}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
