import { Droplet, Calendar, Clock, CheckCircle2, Package, XCircle, UserCheck } from 'lucide-react';

function Stat({ icon, label, value, tone = 'slate' }) {
	const tones = {
		slate: 'from-slate-50 to-white ring-slate-200 text-slate-700',
		emerald: 'from-emerald-50 to-white ring-emerald-200 text-emerald-700',
		rose: 'from-rose-50 to-white ring-rose-200 text-rose-700',
		amber: 'from-amber-50 to-white ring-amber-200 text-amber-700',
		indigo: 'from-indigo-50 to-white ring-indigo-200 text-indigo-700',
		sky: 'from-sky-50 to-white ring-sky-200 text-sky-700',
	};
	return (
		<div className={`rounded-2xl border border-slate-200 bg-gradient-to-br ${tones[tone] || tones.slate} p-4 shadow-sm ring-1`}>
			<div className="flex items-start justify-between">
				<div>
					<p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
					<p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
				</div>
				<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 text-slate-700 ring-1 ring-slate-200" aria-hidden="true">
					{icon}
				</div>
			</div>
		</div>
	);
}

export default function DonationSummaryCards({ data = {} }) {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			<Stat label="Total Donations" value={data.total ?? 0} icon={<Droplet className="h-5 w-5" />} tone="slate" />
			<Stat label="Today's Donations" value={data.today ?? 0} icon={<Calendar className="h-5 w-5" />} tone="indigo" />
			<Stat label="Pending Screening" value={data.pendingScreening ?? 0} icon={<Clock className="h-5 w-5" />} tone="amber" />
			<Stat label="Eligible / Approved" value={data.approved ?? 0} icon={<CheckCircle2 className="h-5 w-5" />} tone="sky" />
			<Stat label="Units Collected" value={data.unitsCollected ?? 0} icon={<Package className="h-5 w-5" />} tone="emerald" />
			<Stat label="Rejected / Deferred" value={(data.rejected ?? 0) + (data.deferred ?? 0)} icon={<XCircle className="h-5 w-5" />} tone="rose" />
		</div>
	);
}
