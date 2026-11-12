import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';

const URGENCY_META = {
	CRITICAL: 'bg-rose-50 text-rose-700 ring-rose-200',
	HIGH: 'bg-orange-50 text-orange-700 ring-orange-200',
	MEDIUM: 'bg-amber-50 text-amber-700 ring-amber-200',
	LOW: 'bg-slate-50 text-slate-700 ring-slate-200',
};
const STATUS_META = {
	PENDING: 'bg-amber-50 text-amber-700',
	MATCHING: 'bg-sky-50 text-sky-700',
	ACCEPTED: 'bg-indigo-50 text-indigo-700',
	PARTIALLY_FULFILLED: 'bg-violet-50 text-violet-700',
	FULFILLED: 'bg-emerald-50 text-emerald-700',
	CANCELLED: 'bg-rose-50 text-rose-700',
	EXPIRED: 'bg-slate-50 text-slate-700',
};

export default function AdminRecentRequests({ items = [] }) {
	const navigate = useNavigate();
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Recent blood requests">
			<header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-base font-semibold text-slate-900">Recent Blood Requests</h2>
					<p className="text-sm text-slate-500">Latest requests across the platform</p>
				</div>
				<button type="button" onClick={() => navigate('/admin/requests')} className="text-sm font-semibold text-rose-700 hover:underline">View All Requests</button>
			</header>
			{items.length === 0 ? (
				<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
					<p className="text-sm font-semibold text-slate-800">No blood requests found</p>
				</div>
			) : (
				<div className="-mx-2 overflow-x-auto">
					<table className="min-w-full divide-y divide-slate-200 text-sm">
						<thead>
							<tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
								<th className="px-2 py-2">ID</th>
								<th className="px-2 py-2">Group</th>
								<th className="px-2 py-2">Units</th>
								<th className="px-2 py-2 hidden md:table-cell">Urgency</th>
								<th className="px-2 py-2 hidden lg:table-cell">Hospital</th>
								<th className="px-2 py-2 hidden lg:table-cell">Date</th>
								<th className="px-2 py-2">Status</th>
								<th className="px-2 py-2 text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{items.slice(0, 8).map((r) => (
								<tr key={r._id} className="text-slate-700">
									<td className="px-2 py-2 font-mono text-xs">{r._id?.slice(-6)}</td>
									<td className="px-2 py-2"><span className="inline-flex items-center justify-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">{r.bloodGroup}</span></td>
									<td className="px-2 py-2">{r.unitsRequired}</td>
									<td className="px-2 py-2 hidden md:table-cell"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${URGENCY_META[r.urgency] || URGENCY_META.MEDIUM}`}>{r.urgency}</span></td>
									<td className="px-2 py-2 hidden lg:table-cell"><span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{r.hospitalName || '—'}</span></td>
									<td className="px-2 py-2 hidden lg:table-cell text-xs text-slate-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
									<td className="px-2 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[r.status] || STATUS_META.PENDING}`}>{r.status}</span></td>
									<td className="px-2 py-2 text-right">
										<button type="button" onClick={() => navigate(`/admin/requests?focus=${r._id}`)} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">View</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
