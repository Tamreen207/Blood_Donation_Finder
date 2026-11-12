import { useNavigate } from 'react-router-dom';

const SEVERITY_META = {
	CRITICAL: { label: 'Critical', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
	LOW: { label: 'Low', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
	INFO: { label: 'Info', bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' },
	RESOLVED: { label: 'Resolved', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
};

export default function StockAlerts({ alerts = [] }) {
	const navigate = useNavigate();
	if (!alerts.length) {
		return (
			<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<header className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-slate-900">Stock Alerts</h2>
						<p className="text-sm text-slate-500">No active stock alerts. All blood groups are within healthy thresholds.</p>
					</div>
				</header>
			</section>
		);
	}
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">Stock Alerts</h2>
					<p className="text-sm text-slate-500">{alerts.length} alert{alerts.length === 1 ? '' : 's'} requiring attention</p>
				</div>
				<button
					type="button"
					onClick={() => navigate('/blood-bank/inventory')}
					className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
				>
					Manage Inventory
				</button>
			</header>
			<ul role="list" className="mt-4 space-y-2">
				{alerts.map((a, idx) => {
					const meta = SEVERITY_META[a.severity] || SEVERITY_META.INFO;
					return (
						<li key={`${a.bloodGroup}-${idx}`} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/40 p-3">
							<div className="flex items-start gap-3">
								<span className={`mt-0.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${meta.bg} ${meta.text} ring-1 ${meta.ring}`}>
									{meta.label}
								</span>
								<div>
									<p className="text-sm font-medium text-slate-800">{a.message}</p>
									<p className="text-xs text-slate-500">
										Group {a.bloodGroup} • {a.units ?? 0} units • Threshold {a.threshold ?? '—'} • {a.time || ''}
									</p>
								</div>
							</div>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
