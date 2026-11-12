import { useNavigate } from 'react-router-dom';
import { Building2, AlertTriangle, MapPin, Clock } from 'lucide-react';

const URGENCY_META = {
	CRITICAL: { label: 'Emergency', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
	HIGH: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
	MEDIUM: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
	LOW: { label: 'Low', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200' },
};

const STATUS_META = {
	PENDING: { label: 'Pending' },
	MATCHING: { label: 'Reviewing' },
	ACCEPTED: { label: 'Accepted' },
	PARTIALLY_FULFILLED: { label: 'Partially Fulfilled' },
	FULFILLED: { label: 'Fulfilled' },
	CANCELLED: { label: 'Cancelled' },
	EXPIRED: { label: 'Expired' },
};

function timeAgo(iso) {
	if (!iso) return '—';
	const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
	if (m < 1) return 'just now';
	if (m < 60) return `${m} min ago`;
	const h = Math.round(m / 60);
	if (h < 24) return `${h} hr ago`;
	return `${Math.round(h / 24)} d ago`;
}

export default function AdminEmergencyRequests({ items = [] }) {
	const navigate = useNavigate();
	return (
		<section className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm" aria-label="Emergency requests">
			<header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="inline-flex items-center gap-2 text-base font-semibold text-rose-700">
						<AlertTriangle className="h-4 w-4" aria-hidden="true" /> Emergency Requests
					</h2>
					<p className="text-sm text-slate-500">Active emergency cases requiring attention</p>
				</div>
				<button type="button" onClick={() => navigate('/admin/requests?urgency=CRITICAL')} className="text-sm font-semibold text-rose-700 hover:underline">View All Emergency Requests</button>
			</header>
			{items.length === 0 ? (
				<div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
					<p className="text-sm font-semibold text-slate-800">No active emergency requests</p>
					<p className="mt-1 text-xs text-slate-500">No critical cases requiring action right now.</p>
				</div>
			) : (
				<ul className="space-y-2" role="list">
					{items.slice(0, 5).map((r) => {
						const u = URGENCY_META[r.urgency] || URGENCY_META.MEDIUM;
						return (
							<li key={r._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50/30 p-3">
								<div className="flex flex-wrap items-center gap-2">
									<span className="inline-flex items-center justify-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">{r.bloodGroup}</span>
									<span className="rounded bg-white px-2 py-0.5 text-[11px] font-mono text-slate-700 ring-1 ring-slate-200">{r._id?.slice(-6)}</span>
									<span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${u.bg} ${u.text} ring-1 ${u.ring}`}>{u.label}</span>
									<span className="text-sm text-slate-700">{r.unitsRequired} units</span>
									<span className="inline-flex items-center gap-1 text-xs text-slate-500"><Building2 className="h-3.5 w-3.5" aria-hidden="true" />{r.hospitalName || '—'}</span>
									{r.city && <span className="inline-flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{r.city}</span>}
									{r.requiredBy && <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Clock className="h-3.5 w-3.5" aria-hidden="true" />by {new Date(r.requiredBy).toLocaleDateString()}</span>}
								</div>
								<div className="flex items-center gap-2 text-xs">
									<span className="text-slate-500">{timeAgo(r.createdAt)}</span>
									<button type="button" onClick={() => navigate(`/admin/requests?focus=${r._id}`)} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">View</button>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
}
