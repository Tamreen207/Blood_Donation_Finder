import { useNavigate } from 'react-router-dom';

const STATUS_META = {
	HEALTHY: { label: 'Healthy', bg: 'bg-emerald-50', text: 'text-emerald-700' },
	LOW: { label: 'Low', bg: 'bg-amber-50', text: 'text-amber-700' },
	CRITICAL: { label: 'Critical', bg: 'bg-rose-50', text: 'text-rose-700' },
	UNAVAILABLE: { label: 'Unavailable', bg: 'bg-slate-50', text: 'text-slate-600' },
};

export default function InventoryStatusTable({ items = [] }) {
	const navigate = useNavigate();
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header>
				<h2 className="text-lg font-semibold text-slate-900">Inventory Status</h2>
				<p className="text-sm text-slate-500">Threshold-based stock overview</p>
			</header>
			<div className="mt-4 -mx-2 overflow-x-auto">
				<table className="min-w-full divide-y divide-slate-200 text-sm">
					<thead>
						<tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
							<th className="px-2 py-2">Blood Group</th>
							<th className="px-2 py-2">Available Units</th>
							<th className="px-2 py-2 hidden sm:table-cell">Min Threshold</th>
							<th className="px-2 py-2">Status</th>
							<th className="px-2 py-2 hidden md:table-cell">Last Updated</th>
							<th className="px-2 py-2 text-right">Action</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						{items.map((it) => {
							const m = STATUS_META[it.status] || STATUS_META.HEALTHY;
							return (
								<tr key={it.bloodGroup}>
									<td className="px-2 py-2 font-semibold text-slate-800">{it.bloodGroup}</td>
									<td className="px-2 py-2 text-slate-800">{it.units ?? 0}</td>
									<td className="px-2 py-2 hidden sm:table-cell text-slate-600">{it.threshold ?? '—'}</td>
									<td className="px-2 py-2"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.bg} ${m.text}`}>{m.label}</span></td>
									<td className="px-2 py-2 hidden md:table-cell text-xs text-slate-500">{it.lastUpdated || '—'}</td>
									<td className="px-2 py-2 text-right">
										<button type="button" onClick={() => navigate('/blood-bank/inventory')} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Update</button>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</section>
	);
}
