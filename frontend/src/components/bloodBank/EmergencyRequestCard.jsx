import { AlertTriangle, MapPin, Clock, Building2 } from 'lucide-react';

function formatDateTime(iso) {
	if (!iso) return '—';
	try {
		const d = new Date(iso);
		return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
	} catch (_) { return '—'; }
}

export default function EmergencyRequestCard({ request, onView, onRespond }) {
	if (!request) return null;
	return (
		<article className="rounded-2xl border border-rose-200 bg-white p-4 shadow-sm ring-1 ring-rose-100">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-wrap items-center gap-2">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
						<AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
						Emergency
					</span>
					<span className="inline-flex items-center justify-center rounded-md bg-rose-50 px-2 py-1 text-sm font-bold text-rose-700 ring-1 ring-rose-200">{request.bloodGroup}</span>
					<span className="rounded-md bg-slate-50 px-2 py-1 text-xs font-mono text-slate-700 ring-1 ring-slate-200">{request._id}</span>
				</div>
				<div className="flex items-center gap-2 text-xs text-slate-500">
					<Clock className="h-3.5 w-3.5" aria-hidden="true" />
					<span>Needed by: {formatDateTime(request.requiredBy || request.createdAt)}</span>
				</div>
			</div>
			<div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
				<div className="rounded-lg bg-slate-50 px-3 py-2">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Units Required</p>
					<p className="text-base font-bold text-slate-900">{request.unitsRequired}</p>
				</div>
				<div className="rounded-lg bg-slate-50 px-3 py-2">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Hospital</p>
					<p className="truncate text-sm font-medium text-slate-800 inline-flex items-center gap-1.5">
						<Building2 className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
						{request.hospitalName}
					</p>
				</div>
				<div className="rounded-lg bg-slate-50 px-3 py-2">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Location</p>
					<p className="truncate text-sm font-medium text-slate-800 inline-flex items-center gap-1.5">
						<MapPin className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
						{request.city || request.hospitalAddress || '—'}
					</p>
				</div>
			</div>
			<div className="mt-3 flex flex-wrap items-center justify-between gap-2">
				<span className="text-xs text-slate-500">Status: <span className="font-semibold text-slate-700">{request.status}</span></span>
				<div className="flex flex-wrap gap-2">
					<button type="button" onClick={() => onView?.(request)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">View Request</button>
					<button type="button" onClick={() => onRespond?.(request)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700">Respond</button>
				</div>
			</div>
		</article>
	);
}
