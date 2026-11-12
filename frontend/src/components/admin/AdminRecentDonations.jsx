import { useNavigate } from 'react-router-dom';

const STATUS_META = {
	SCHEDULED: 'bg-amber-50 text-amber-700',
	CHECKED_IN: 'bg-sky-50 text-sky-700',
	SCREENING: 'bg-indigo-50 text-indigo-700',
	APPROVED: 'bg-violet-50 text-violet-700',
	COLLECTED: 'bg-emerald-50 text-emerald-700',
	REJECTED: 'bg-rose-50 text-rose-700',
	DEFERRED: 'bg-orange-50 text-orange-700',
	CANCELLED: 'bg-slate-50 text-slate-700',
	COMPLETED: 'bg-emerald-50 text-emerald-700',
};

export default function AdminRecentDonations({ items = [] }) {
	const navigate = useNavigate();
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Recent donations">
			<header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-base font-semibold text-slate-900">Recent Donations</h2>
					<p className="text-sm text-slate-500">Latest donation activity platform-wide</p>
				</div>
			</header>
			{items.length === 0 ? (
				<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
					<p className="text-sm font-semibold text-slate-800">No donations available</p>
				</div>
			) : (
				<div className="-mx-2 overflow-x-auto">
					<table className="min-w-full divide-y divide-slate-200 text-sm">
						<thead>
							<tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
								<th className="px-2 py-2">ID</th>
								<th className="px-2 py-2">Group</th>
								<th className="px-2 py-2">Units</th>
								<th className="px-2 py-2 hidden md:table-cell">Date</th>
								<th className="px-2 py-2">Status</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{items.slice(0, 8).map((d) => (
								<tr key={d._id} className="text-slate-700">
									<td className="px-2 py-2 font-mono text-xs">{d._id?.slice(-6)}</td>
									<td className="px-2 py-2"><span className="inline-flex items-center justify-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">{d.bloodGroup}</span></td>
									<td className="px-2 py-2">{d.units}</td>
									<td className="px-2 py-2 hidden md:table-cell text-xs text-slate-500">{d.donationDate ? new Date(d.donationDate).toLocaleDateString() : '—'}</td>
									<td className="px-2 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[d.status] || 'bg-slate-50 text-slate-700'}`}>{d.status}</span></td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</section>
	);
}
