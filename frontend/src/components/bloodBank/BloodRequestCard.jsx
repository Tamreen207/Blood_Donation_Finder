import { Building2, MapPin, Clock } from 'lucide-react';
import { urgencyLabel, statusLabel } from './BloodRequestTable.jsx';

function formatDateTime(iso) {
	if (!iso) return '—';
	try {
		const d = new Date(iso);
		return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
	} catch (_) { return '—'; }
}

function privacySafeLocation(r) {
	if (r.city) return r.city;
	if (r.hospitalAddress) return r.hospitalAddress;
	return '—';
}

export default function BloodRequestCard({ request, onView, onRespond }) {
	if (!request) return null;
	const isEmergency = request.urgency === 'CRITICAL';
	return (
		<article className={`rounded-2xl border ${isEmergency ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 bg-white'} p-4 shadow-sm`}>
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-2">
					{isEmergency && (
						<span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">Emergency</span>
					)}
					<span className="inline-flex items-center justify-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">{request.bloodGroup}</span>
					<span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-mono text-slate-700 ring-1 ring-slate-200">{request._id}</span>
				</div>
				<span className="text-[11px] font-semibold text-slate-500">{urgencyLabel(request.urgency)}</span>
			</div>
			<div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700">
				<div className="rounded-lg bg-slate-50 px-3 py-2">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Units</p>
					<p className="text-sm font-bold text-slate-900">{request.unitsRequired}</p>
				</div>
				<div className="rounded-lg bg-slate-50 px-3 py-2">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Status</p>
					<p className="text-sm font-bold text-slate-900">{statusLabel(request.status)}</p>
				</div>
				<div className="col-span-2 rounded-lg bg-slate-50 px-3 py-2">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Hospital</p>
					<p className="truncate text-sm font-medium text-slate-800 inline-flex items-center gap-1.5">
						<Building2 className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
						{request.hospitalName}
					</p>
				</div>
				<div className="col-span-2 rounded-lg bg-slate-50 px-3 py-2">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Location</p>
					<p className="truncate text-sm font-medium text-slate-800 inline-flex items-center gap-1.5">
						<MapPin className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
						{privacySafeLocation(request)}
					</p>
				</div>
				<div className="col-span-2 rounded-lg bg-slate-50 px-3 py-2">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Needed by</p>
					<p className="text-sm font-medium text-slate-800 inline-flex items-center gap-1.5">
						<Clock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
						{formatDateTime(request.requiredBy || request.createdAt)}
					</p>
				</div>
			</div>
			<div className="mt-3 flex flex-wrap gap-2">
				<button type="button" onClick={() => onView?.(request)} className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">View Details</button>
				<button type="button" onClick={() => onRespond?.(request)} className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700">Respond</button>
			</div>
		</article>
	);
}
