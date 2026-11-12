function Card({ icon, label, value, hint, tone = 'slate', emphasis = false }) {
	const tones = {
		slate: 'from-slate-50 to-white text-slate-700 ring-slate-200',
		rose: 'from-rose-50 to-white text-rose-700 ring-rose-200',
		amber: 'from-amber-50 to-white text-amber-700 ring-amber-200',
		emerald: 'from-emerald-50 to-white text-emerald-700 ring-emerald-200',
		indigo: 'from-indigo-50 to-white text-indigo-700 ring-indigo-200',
		sky: 'from-sky-50 to-white text-sky-700 ring-sky-200',
	};
	const t = tones[tone] || tones.slate;
	return (
		<div className={`relative rounded-2xl border border-slate-200 bg-gradient-to-br ${t} p-4 sm:p-5 shadow-sm ring-1 ${emphasis ? 'shadow-md' : ''}`}>
			<div className="flex items-start justify-between">
				<div>
					<p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
					<p className="mt-1.5 text-2xl sm:text-3xl font-bold text-slate-900">{value}</p>
					{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
				</div>
				<div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/80 ring-1 ring-slate-200 ${emphasis ? 'text-rose-600' : 'text-slate-600'}`} aria-hidden="true">
					{icon}
				</div>
			</div>
		</div>
	);
}

const Icon = {
	drops: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 2.5C8.4 6.9 5.5 10.5 5.5 14.1A6.5 6.5 0 0 0 12 20.6a6.5 6.5 0 0 0 6.5-6.5C18.5 10.5 15.6 6.9 12 2.5Z" /></svg>,
	alert: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>,
	clock: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
	emergency: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>,
	heart: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.85A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10Z" /></svg>,
	users: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
};

export default function DashboardSummaryCards({ data }) {
	const cards = [
		{ label: 'Total Blood Units', value: data?.totalUnits ?? 0, hint: 'Across all blood groups', icon: Icon.drops, tone: 'rose' },
		{ label: 'Low Stock', value: data?.lowStock ?? 0, hint: 'Below configured threshold', icon: Icon.alert, tone: 'amber' },
		{ label: 'Pending Requests', value: data?.pendingRequests ?? 0, hint: 'Awaiting response', icon: Icon.clock, tone: 'slate' },
		{ label: 'Emergency Requests', value: data?.emergencyRequests ?? 0, hint: 'Active emergencies', icon: Icon.emergency, tone: 'rose', emphasis: true },
		{ label: "Today's Donations", value: data?.todayDonations ?? 0, hint: 'Recorded today', icon: Icon.heart, tone: 'emerald' },
		{ label: 'Available Donors', value: data?.availableDonors ?? 0, hint: 'Eligible & active', icon: Icon.users, tone: 'indigo' },
	];
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
			{cards.map((c) => (
				<Card key={c.label} {...c} />
			))}
		</div>
	);
}
