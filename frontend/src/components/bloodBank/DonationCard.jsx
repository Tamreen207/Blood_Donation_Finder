import { Calendar, Droplet } from 'lucide-react';
import { donationStatusLabel, donationTypeLabel, screeningStatusLabel } from './DonationTable.jsx';

function formatDateTime(iso) {
	if (!iso) return '—';
	try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); }
	catch (_) { return '—'; }
}

export default function DonationCard({ donation, onView, onManage }) {
	if (!donation) return null;
	const s = donationStatusLabel(donation.status);
	return (
		<article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<span className="inline-flex items-center justify-center rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">{donation.bloodGroup}</span>
					<span className="rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-mono text-slate-700 ring-1 ring-slate-200">{donation._id}</span>
				</div>
				<span className="rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">{s}</span>
			</div>
			<div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700">
				<div className="rounded-lg bg-slate-50 px-3 py-2">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Donor</p>
					<p className="truncate text-sm font-medium text-slate-800">{donation.donor?.name || donation.donorUserId || '—'}</p>
				</div>
				<div className="rounded-lg bg-slate-50 px-3 py-2">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Type</p>
					<p className="text-sm font-medium text-slate-800 inline-flex items-center gap-1.5"><Droplet className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />{donationTypeLabel(donation.donationType)}</p>
				</div>
				<div className="rounded-lg bg-slate-50 px-3 py-2">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Units</p>
					<p className="text-sm font-medium text-slate-800">{donation.units}</p>
				</div>
				<div className="rounded-lg bg-slate-50 px-3 py-2">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Screening</p>
					<p className="text-sm font-medium text-slate-800">{screeningStatusLabel(donation.screeningStatus)}</p>
				</div>
				<div className="col-span-2 rounded-lg bg-slate-50 px-3 py-2">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Date</p>
					<p className="text-sm font-medium text-slate-800 inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />{formatDateTime(donation.donationDate)}</p>
				</div>
			</div>
			<div className="mt-3 flex flex-wrap gap-2">
				<button type="button" onClick={() => onView?.(donation)} className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">View Details</button>
				<button type="button" onClick={() => onManage?.(donation)} className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700">Manage</button>
			</div>
		</article>
	);
}
