function pct(value, max) {
	if (!max) return 0;
	return Math.round((value / max) * 100);
}

export function computeProfileCompletion(profile) {
	if (!profile) return 0;
	const sections = [
		{ name: 'Basic Information', filled: !!(profile.name && profile.bloodBankType) },
		{ name: 'Contact Information', filled: !!(profile.phone && profile.email) },
		{ name: 'Location', filled: !!(profile.city && (profile.state || profile.address)) },
		{ name: 'Operating Hours', filled: !!profile.hoursByDay && Object.values(profile.hoursByDay || {}).some((d) => d && (d.is24Hours || d.closed || (d.open && d.close))) },
		{ name: 'Services', filled: Array.isArray(profile.services) && profile.services.length > 0 },
		{ name: 'Verification', filled: profile.verification?.status === 'VERIFIED' },
	];
	const filled = sections.filter((s) => s.filled).length;
	return { percent: Math.round((filled / sections.length) * 100), sections, filled, total: sections.length };
}

export default function ProfileCompletionCard({ completion, onJump }) {
	if (!completion) return null;
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header className="mb-3 flex items-center justify-between">
				<div>
					<h2 className="text-base font-semibold text-slate-900">Profile completion</h2>
					<p className="text-sm text-slate-500">{completion.filled} of {completion.total} sections complete</p>
				</div>
				<span className="text-2xl font-bold text-slate-900">{completion.percent}%</span>
			</header>
			<div className="h-2 overflow-hidden rounded-full bg-slate-100">
				<div className="h-full bg-emerald-500" style={{ width: `${completion.percent}%` }} />
			</div>
			<ul className="mt-3 space-y-1.5">
				{completion.sections.map((s) => (
					<li key={s.name} className="flex items-center justify-between text-sm">
						<span className={s.filled ? 'text-slate-700' : 'text-slate-500'}>{s.name}</span>
						<button type="button" onClick={() => onJump?.(s.name)} className="text-xs font-semibold text-rose-700 hover:underline">{s.filled ? 'Edit' : 'Complete'}</button>
					</li>
				))}
			</ul>
		</section>
	);
}
