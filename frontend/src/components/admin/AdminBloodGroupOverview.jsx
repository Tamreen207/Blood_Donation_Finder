import { BLOOD_GROUPS } from '../../utils/bloodGroups.js';

export default function AdminBloodGroupOverview({ requests = {}, units = {} }) {
	const maxReq = Math.max(1, ...BLOOD_GROUPS.map((g) => Number(requests?.[g] || 0)));
	const maxUnits = Math.max(1, ...BLOOD_GROUPS.map((g) => Number(units?.[g] || 0)));
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Blood group overview">
			<header className="mb-4">
				<h2 className="text-base font-semibold text-slate-900">Blood Group Overview</h2>
				<p className="text-sm text-slate-500">Active requests and available units by blood group</p>
			</header>
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{BLOOD_GROUPS.map((g) => {
					const req = Number(requests?.[g] || 0);
					const u = Number(units?.[g] || 0);
					return (
						<div key={g} className="rounded-xl border border-slate-200 bg-slate-50/40 p-3">
							<div className="flex items-center justify-between">
								<span className="inline-flex items-center justify-center rounded-md bg-white px-2 py-1 text-sm font-bold text-rose-700 ring-1 ring-rose-200">{g}</span>
								<span className="text-xs text-slate-500">{u} units • {req} req</span>
							</div>
							<div className="mt-2 space-y-1.5">
								<div>
									<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Requests</p>
									<div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
										<div className="h-full bg-rose-500" style={{ width: `${(req / maxReq) * 100}%` }} />
									</div>
								</div>
								<div>
									<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Units</p>
									<div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
										<div className="h-full bg-emerald-500" style={{ width: `${(u / maxUnits) * 100}%` }} />
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}
