import { useNavigate } from 'react-router-dom';
import { Users, Heart, Building2, ClipboardList, AlertTriangle, Droplet, ArrowRight } from 'lucide-react';

function Card({ icon, label, value, hint, tone = 'slate', to, emphasis = false }) {
	const tones = {
		slate: 'from-slate-50 to-white ring-slate-200 text-slate-700',
		emerald: 'from-emerald-50 to-white ring-emerald-200 text-emerald-700',
		rose: 'from-rose-50 to-white ring-rose-200 text-rose-700',
		amber: 'from-amber-50 to-white ring-amber-200 text-amber-700',
		indigo: 'from-indigo-50 to-white ring-indigo-200 text-indigo-700',
		sky: 'from-sky-50 to-white ring-sky-200 text-sky-700',
	};
	return (
		<button
			type="button"
			onClick={() => to && (window.location.assign(to))}
			className={`group relative rounded-2xl border border-slate-200 bg-gradient-to-br ${tones[tone] || tones.slate} p-4 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${emphasis ? 'shadow-md' : ''}`}
		>
			<div className="flex items-start justify-between">
				<div>
					<p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
					<p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
					{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
				</div>
				<div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 ring-1 ring-slate-200 ${emphasis ? 'text-rose-600' : 'text-slate-700'}`} aria-hidden="true">
					{icon}
				</div>
			</div>
			{to && <ArrowRight className="absolute right-3 bottom-3 h-3.5 w-3.5 text-slate-300 transition group-hover:text-rose-500" aria-hidden="true" />}
		</button>
	);
}

export default function AdminSummaryCards({ data = {} }) {
	const navigate = useNavigate();
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			<Card
				label="Total Users"
				value={data.totalUsers ?? 0}
				hint="Registered accounts"
				icon={<Users className="h-5 w-5" />}
				tone="indigo"
				to="/admin/users"
			/>
			<Card
				label="Active Donors"
				value={data.activeDonors ?? data.totalDonors ?? 0}
				hint="Donor profiles"
				icon={<Heart className="h-5 w-5" />}
				tone="emerald"
				to="/admin/users?role=donor"
			/>
			<Card
				label="Blood Banks"
				value={data.totalBloodBanks ?? 0}
				hint={`${data.verifiedBloodBanks ?? 0} verified`}
				icon={<Building2 className="h-5 w-5" />}
				tone="sky"
				to="/admin/blood-banks"
			/>
			<Card
				label="Blood Requests"
				value={data.totalRequests ?? 0}
				hint={`${data.activeRequests ?? 0} active`}
				icon={<ClipboardList className="h-5 w-5" />}
				tone="slate"
				to="/admin/requests"
			/>
			<Card
				label="Emergency Requests"
				value={data.emergencyRequests ?? 0}
				hint="Active emergencies"
				icon={<AlertTriangle className="h-5 w-5" />}
				tone="rose"
				emphasis
				to="/admin/requests?urgency=CRITICAL"
			/>
			<Card
				label="Donations"
				value={data.totalDonations ?? data.completedDonations ?? 0}
				hint="Total recorded"
				icon={<Droplet className="h-5 w-5" />}
				tone="emerald"
				to="/admin/requests"
			/>
		</div>
	);
}
