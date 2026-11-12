export default function BloodBankHeader({ name, location, address, role }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-rose-50 via-white to-white p-5 sm:p-6 shadow-sm">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-start gap-4">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 ring-1 ring-rose-200" aria-hidden="true">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M12 2.5c-3.6 4.4-6.5 8-6.5 11.6A6.5 6.5 0 0 0 12 20.6a6.5 6.5 0 0 0 6.5-6.5C18.5 10.5 15.6 6.9 12 2.5Zm0 15.6a3.5 3.5 0 0 1-3.5-3.5c0-1.5 1.1-3.3 3.5-6.6 2.4 3.3 3.5 5.1 3.5 6.6A3.5 3.5 0 0 1 12 18.1Z" /></svg>
					</div>
					<div>
						<p className="text-xs font-medium uppercase tracking-wide text-rose-600">Blood Bank Dashboard</p>
						<h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{name || 'Blood Bank'}</h1>
						<p className="mt-1 text-sm text-slate-600">Monitor inventory, requests, donors, and daily blood bank operations.</p>
						{location && (
							<p className="mt-2 text-sm text-slate-500 inline-flex items-center gap-1.5">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-slate-400" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
								{address ? `${address}` : location}
							</p>
						)}
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-slate-500" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
						Role: {role || 'Blood Bank'}
					</span>
				</div>
			</div>
		</div>
	);
}
