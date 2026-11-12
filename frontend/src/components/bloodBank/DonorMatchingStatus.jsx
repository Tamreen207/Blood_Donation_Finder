import { useNavigate } from 'react-router-dom';

const STATS = [
	{ key: 'activeRequests', label: 'Active matching requests', tone: 'bg-rose-50 text-rose-700 ring-rose-200' },
	{ key: 'potentialDonorMatches', label: 'Potential donor matches', tone: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
	{ key: 'bloodBankMatches', label: 'Blood bank matches', tone: 'bg-sky-50 text-sky-700 ring-sky-200' },
	{ key: 'successfulMatches', label: 'Successful matches', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
];

export default function DonorMatchingStatus({ stats = {} }) {
	const navigate = useNavigate();
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-slate-900">Donor Matching</h2>
					<p className="text-sm text-slate-500">Live matching status for incoming requests</p>
				</div>
				<button type="button" onClick={() => navigate('/blood-bank/requests')} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">View Requests</button>
			</header>
			<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{STATS.map((s) => (
					<div key={s.key} className={`rounded-xl p-4 ring-1 ${s.tone}`}>
						<p className="text-xs font-medium uppercase tracking-wide opacity-80">{s.label}</p>
						<p className="mt-1.5 text-2xl font-bold text-slate-900">{stats?.[s.key] ?? 0}</p>
					</div>
				))}
			</div>
		</section>
	);
}
