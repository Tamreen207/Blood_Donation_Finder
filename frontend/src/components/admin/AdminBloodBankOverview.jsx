import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, BadgeCheck, Clock } from 'lucide-react';

export default function AdminBloodBankOverview({ summary = {}, recent = [] }) {
	const navigate = useNavigate();
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="Blood bank network">
			<header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-base font-semibold text-slate-900">Blood Bank Network</h2>
					<p className="text-sm text-slate-500">Network distribution and verification status</p>
				</div>
				<button type="button" onClick={() => navigate('/admin/blood-banks')} className="text-sm font-semibold text-rose-700 hover:underline">Manage Blood Banks</button>
			</header>
			<div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div className="rounded-lg bg-slate-50 p-3">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total</p>
					<p className="text-xl font-bold text-slate-900">{summary.totalBloodBanks ?? 0}</p>
				</div>
				<div className="rounded-lg bg-emerald-50 p-3">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Verified</p>
					<p className="text-xl font-bold text-emerald-700">{summary.verifiedBloodBanks ?? 0}</p>
				</div>
				<div className="rounded-lg bg-amber-50 p-3">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Pending</p>
					<p className="text-xl font-bold text-amber-700">{summary.pendingBloodBanks ?? 0}</p>
				</div>
				<div className="rounded-lg bg-sky-50 p-3">
					<p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">Active</p>
					<p className="text-xl font-bold text-sky-700">{summary.totalBloodBanks ?? 0}</p>
				</div>
			</div>
			{recent.length > 0 && (
				<ul className="space-y-2" role="list">
					{recent.slice(0, 5).map((b) => (
						<li key={b._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/40 p-3 text-sm">
							<div className="flex flex-wrap items-center gap-2">
								<Building2 className="h-4 w-4 text-slate-500" aria-hidden="true" />
								<span className="font-semibold text-slate-800">{b.name}</span>
								{b.city && <span className="inline-flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{b.city}</span>}
							</div>
							<div className="flex items-center gap-2 text-xs">
								{b.isVerified ? (
									<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-emerald-200"><BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />Verified</span>
								) : (
									<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 ring-1 ring-amber-200"><Clock className="h-3.5 w-3.5" aria-hidden="true" />Pending</span>
								)}
								<span className="text-slate-500">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}</span>
							</div>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
