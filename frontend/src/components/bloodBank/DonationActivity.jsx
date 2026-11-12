import { useNavigate } from 'react-router-dom';

const STAT = [
	{ key: 'today', label: "Today's donations", tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
	{ key: 'scheduled', label: 'Scheduled donors', tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
	{ key: 'completed', label: 'Completed', tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
	{ key: 'cancelled', label: 'Cancelled', tone: 'bg-rose-50 text-rose-700 ring-rose-200' },
];

export default function DonationActivity({ stats = {}, byDay = [] }) {
	const navigate = useNavigate();
	const max = Math.max(1, ...byDay.map((d) => d.value || 0));
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">Today's Donation Activity</h2>
					<p className="text-sm text-slate-500">Donations recorded at your blood bank</p>
				</div>
				<button type="button" onClick={() => navigate('/blood-bank/donations')} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">View Donation Records</button>
			</header>

			<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
				{STAT.map((s) => (
					<div key={s.key} className={`rounded-xl p-3 ring-1 ${s.tone}`}>
						<p className="text-xs font-medium uppercase tracking-wide opacity-80">{s.label}</p>
						<p className="mt-1 text-xl font-bold text-slate-900">{stats?.[s.key] ?? 0}</p>
					</div>
				))}
			</div>

			{byDay.length > 0 && (
				<div className="mt-4">
					<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last 7 days</p>
					<div className="mt-2 flex h-20 items-end gap-2" role="img" aria-label="Donations last 7 days">
						{byDay.map((d, idx) => {
							const h = Math.max(4, Math.round(((d.value || 0) / max) * 100));
							return (
								<div key={idx} className="flex flex-1 flex-col items-center gap-1">
									<div className="w-full rounded-t-md bg-emerald-500" style={{ height: `${h}%` }} title={`${d.label}: ${d.value}`} />
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
