import { BLOOD_GROUPS } from '../../utils/bloodGroups.js';

const STATUS_OPTIONS = [
	{ value: '', label: 'All Statuses' },
	{ value: 'SCHEDULED', label: 'Scheduled' },
	{ value: 'CHECKED_IN', label: 'Checked In' },
	{ value: 'SCREENING', label: 'Screening' },
	{ value: 'APPROVED', label: 'Approved' },
	{ value: 'COLLECTED', label: 'Collected' },
	{ value: 'REJECTED,DEFERRED', label: 'Rejected / Deferred' },
	{ value: 'CANCELLED', label: 'Cancelled' },
];

const RANGE_OPTIONS = [
	{ value: 'all', label: 'All time' },
	{ value: 'today', label: 'Today' },
	{ value: 'week', label: 'This week' },
	{ value: 'month', label: 'This month' },
];

const TYPE_OPTIONS = [
	{ value: '', label: 'All types' },
	{ value: 'WHOLE_BLOOD', label: 'Whole Blood' },
	{ value: 'PLASMA', label: 'Plasma' },
	{ value: 'PLATELETS', label: 'Platelets' },
	{ value: 'OTHER', label: 'Other' },
];

const SORT_OPTIONS = [
	{ value: 'newest', label: 'Newest first' },
	{ value: 'oldest', label: 'Oldest first' },
	{ value: 'bloodGroup', label: 'Blood group' },
	{ value: 'status', label: 'Status' },
];

export default function DonationFilters({ value = {}, onChange, onReset }) {
	const v = value || {};
	function update(patch) { onChange?.({ ...v, ...patch }); }
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
					<input
						type="search"
						value={v.search || ''}
						onChange={(e) => update({ search: e.target.value })}
						placeholder="Donation ID, donor, blood group"
						className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
					/>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blood Group</span>
					<select value={v.bloodGroup || ''} onChange={(e) => update({ bloodGroup: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200">
						<option value="">All Groups</option>
						{BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
					</select>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
					<select value={v.status || ''} onChange={(e) => update({ status: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200">
						{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
					</select>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</span>
					<select value={v.donationType || ''} onChange={(e) => update({ donationType: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200">
						{TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
					</select>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</span>
					<select value={v.sort || 'newest'} onChange={(e) => update({ sort: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200">
						{SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
					</select>
				</label>
			</div>
			<div className="mt-3 flex flex-wrap items-center justify-between gap-2">
				<label className="block text-xs text-slate-500">
					Date
					<div className="mt-1 flex flex-wrap items-center gap-2">
						<select value={v.range || 'all'} onChange={(e) => update({ range: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200">
							{RANGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
						</select>
						{v.range === 'all' && (
							<>
								<input type="date" value={v.from || ''} onChange={(e) => update({ from: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm" />
								<span className="self-center text-slate-400">→</span>
								<input type="date" value={v.to || ''} onChange={(e) => update({ to: e.target.value })} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm" />
							</>
						)}
					</div>
				</label>
				<button type="button" onClick={onReset} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear Filters</button>
			</div>
		</section>
	);
}
