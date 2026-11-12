import { useNavigate } from 'react-router-dom';

function StatCard({ label, value, tone = 'slate' }) {
	const tones = {
		slate: 'from-slate-50 to-white ring-slate-200 text-slate-700',
		emerald: 'from-emerald-50 to-white ring-emerald-200 text-emerald-700',
		rose: 'from-rose-50 to-white ring-rose-200 text-rose-700',
		amber: 'from-amber-50 to-white ring-amber-200 text-amber-700',
		indigo: 'from-indigo-50 to-white ring-indigo-200 text-indigo-700',
	};
	return (
		<div className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${tones[tone] || tones.slate} p-4 ring-1`}>
			<p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
			<p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
		</div>
	);
}

export default function RequestOverview({ stats, chart = [] }) {
	const navigate = useNavigate();
	const max = Math.max(1, ...chart.map((c) => c.value || 0));
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">Request Overview</h2>
					<p className="text-sm text-slate-500">Performance summary</p>
				</div>
				<button type="button" onClick={() => navigate('/blood-bank/requests')} className="text-sm font-semibold text-rose-700 hover:underline">View requests</button>
			</header>

			<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
				<StatCard label="Received" value={stats?.received ?? 0} tone="slate" />
				<StatCard label="Accepted" value={stats?.accepted ?? 0} tone="indigo" />
				<StatCard label="Fulfilled" value={stats?.fulfilled ?? 0} tone="emerald" />
				<StatCard label="Declined" value={stats?.declined ?? 0} tone="amber" />
				<StatCard label="Emergency" value={stats?.emergency ?? 0} tone="rose" />
			</div>

			{chart.length > 0 && (
				<div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Requests — Last 7 Days</p>
					<div className="mt-3 flex h-32 items-end gap-2" role="img" aria-label="Requests last 7 days chart">
						{chart.map((d, idx) => {
							const h = Math.max(4, Math.round(((d.value || 0) / max) * 100));
							return (
								<div key={idx} className="flex flex-1 flex-col items-center gap-1">
									<div className="w-full rounded-t-md bg-rose-500" style={{ height: `${h}%` }} title={`${d.label}: ${d.value}`} />
									<span className="text-[10px] text-slate-500">{d.label}</span>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</section>
	);
}
