const STATUS_LABELS = {
	OPERATIONAL: 'Operational',
	TEMPORARILY_CLOSED: 'Temporarily Closed',
	EMERGENCY_OPERATIONS: 'Emergency Operations',
	MAINTENANCE: 'Maintenance',
};

const STATUS_STYLES = {
	OPERATIONAL: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', supporting: 'Accepting blood requests and donations' },
	TEMPORARILY_CLOSED: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', supporting: 'Not accepting new requests at this time' },
	EMERGENCY_OPERATIONS: { dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', supporting: 'Operating in emergency mode — priority cases only' },
	MAINTENANCE: { dot: 'bg-slate-500', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200', supporting: 'System maintenance in progress' },
};

export default function BloodBankStatus({ status, updatedAt, accent = false }) {
	const key = STATUS_STYLES[status] ? status : 'OPERATIONAL';
	const style = STATUS_STYLES[key];
	const label = STATUS_LABELS[key];
	const labelId = 'blood-bank-status-label';
	return (
		<div
			role="status"
			aria-labelledby={labelId}
			className={`rounded-2xl border border-slate-200 ${accent ? style.bg : 'bg-white'} p-4 sm:p-5 shadow-sm ring-1 ring-transparent ${accent ? style.ring : ''}`}
		>
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<span className={`inline-block h-3 w-3 rounded-full ${style.dot} ring-2 ring-white shadow`} aria-hidden="true" />
					<div>
						<p className="text-xs font-medium uppercase tracking-wide text-slate-500">Blood Bank Status</p>
						<p id={labelId} className={`text-base sm:text-lg font-semibold ${style.text}`}>{label}</p>
					</div>
				</div>
				{updatedAt && (
					<p className="text-xs text-slate-500">Updated {updatedAt}</p>
				)}
			</div>
			<p className="mt-2 text-sm text-slate-600">{style.supporting}</p>
		</div>
	);
}
