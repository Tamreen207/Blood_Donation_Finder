import { Link } from 'react-router-dom';

const STATUS_META = {
	HEALTHY: { label: 'Healthy', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', bar: 'bg-emerald-500' },
	LOW: { label: 'Low', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', bar: 'bg-amber-500' },
	CRITICAL: { label: 'Critical', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', bar: 'bg-rose-500' },
	UNAVAILABLE: { label: 'Unavailable', bg: 'bg-slate-50', text: 'text-slate-600', ring: 'ring-slate-200', bar: 'bg-slate-400' },
};

function statusFor(units, threshold = 5) {
	if (units <= 0) return 'UNAVAILABLE';
	if (units < 2) return 'CRITICAL';
	if (units < threshold) return 'LOW';
	return 'HEALTHY';
}

function Bar({ value, max = 50, status }) {
	const pct = Math.max(2, Math.min(100, Math.round((value / Math.max(max, 1)) * 100)));
	return (
		<div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
			<div className={`h-full ${STATUS_META[status]?.bar || 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
		</div>
	);
}

export default function InventoryOverview({ items = [], onManage }) {
	const total = items.reduce((s, i) => s + (i.units || 0), 0);
	const critical = items.filter((i) => i.status === 'CRITICAL' || i.status === 'UNAVAILABLE').length;
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">Blood Inventory</h2>
					<p className="text-sm text-slate-500">{total} units across 8 groups • {critical} need attention</p>
				</div>
				<button
					type="button"
					onClick={onManage}
					className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
				>
					Manage Inventory
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
				</button>
			</header>

			<ul role="list" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{items.map((item) => {
					const status = item.status || statusFor(item.units, item.threshold);
					const meta = STATUS_META[status];
					return (
						<li key={item.bloodGroup} className="rounded-xl border border-slate-200 bg-slate-50/40 p-3.5">
							<div className="flex items-center justify-between">
								<span className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1 text-sm font-bold text-rose-600 ring-1 ring-rose-200">{item.bloodGroup}</span>
								<span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${meta.bg} ${meta.text} ring-1 ${meta.ring}`}>
									<span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'currentColor' }} aria-hidden="true" />
									{meta.label}
								</span>
							</div>
							<div className="mt-2 flex items-baseline gap-1">
								<span className="text-2xl font-bold text-slate-900">{item.units ?? 0}</span>
								<span className="text-xs text-slate-500">units</span>
							</div>
							<div className="mt-2"><Bar value={item.units || 0} status={status} /></div>
							<p className="mt-2 text-xs text-slate-500">Last updated: {item.lastUpdated || '—'}</p>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
