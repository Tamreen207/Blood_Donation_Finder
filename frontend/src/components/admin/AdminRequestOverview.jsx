import { useNavigate } from 'react-router-dom';

const STATUS_ORDER = [
	['PENDING', 'Pending'],
	['MATCHING', 'Reviewing'],
	['ACCEPTED', 'Accepted'],
	['PARTIALLY_FULFILLED', 'Partially Fulfilled'],
	['FULFILLED', 'Fulfilled'],
	['CANCELLED', 'Cancelled'],
	['EXPIRED', 'Expired'],
];

const META = {
	PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
	MATCHING: { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200' },
	ACCEPTED: { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200' },
	PARTIALLY_FULFILLED: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200' },
	FULFILLED: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
	CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
	EXPIRED: { bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
};

export default function AdminRequestOverview({ data = {} }) {
	const navigate = useNavigate();
	const values = STATUS_ORDER.map(([k]) => Number(data?.[k] || 0));
	const total = values.reduce((s, v) => s + v, 0);
	const max = Math.max(1, ...values);

	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Request status overview">
			<header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-base font-semibold text-slate-900">Request Status Overview</h2>
					<p className="text-sm text-slate-500">Real-time breakdown of all blood requests</p>
				</div>
				<button type="button" onClick={() => navigate('/admin/requests')} className="text-sm font-semibold text-rose-700 hover:underline">View requests</button>
			</header>
			<dl className="space-y-2">
				{STATUS_ORDER.map(([key, label], idx) => {
					const v = values[idx];
					const pct = total > 0 ? Math.round((v / total) * 100) : 0;
					const meta = META[key];
					return (
						<button
							type="button"
							key={key}
							onClick={() => navigate(`/admin/requests?status=${key}`)}
							className="grid w-full grid-cols-12 items-center gap-2 rounded-lg p-2 text-left transition hover:bg-slate-50"
						>
							<dt className={`col-span-3 sm:col-span-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${meta.bg} ${meta.text} ${meta.ring}`}>{label}</dt>
							<dd className="col-span-7 sm:col-span-8">
								<div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
									<div className={`h-full ${meta.bg.replace('/50', '/500')}`} style={{ width: `${(v / max) * 100}%` }} />
								</div>
							</dd>
							<dd className="col-span-2 text-right text-sm font-semibold text-slate-800">{v} <span className="text-xs text-slate-500">({pct}%)</span></dd>
						</button>
					);
				})}
			</dl>
			<p className="sr-only">Total {total} requests across {STATUS_ORDER.length} statuses.</p>
		</section>
	);
}
