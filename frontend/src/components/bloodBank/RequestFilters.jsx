import { BLOOD_GROUPS } from '../../utils/bloodGroups.js';

const STATUS_OPTIONS = [
	{ value: '', label: 'All Statuses' },
	{ value: 'PENDING,MATCHING', label: 'Pending' },
	{ value: 'ACCEPTED,PARTIALLY_FULFILLED', label: 'Accepted / Partially Fulfilled' },
	{ value: 'FULFILLED', label: 'Fulfilled' },
	{ value: 'CANCELLED', label: 'Cancelled' },
];

const URGENCY_OPTIONS = [
	{ value: '', label: 'All Urgencies' },
	{ value: 'LOW', label: 'Normal' },
	{ value: 'MEDIUM,HIGH', label: 'Urgent' },
	{ value: 'CRITICAL', label: 'Emergency' },
];

const SORT_OPTIONS = [
	{ value: 'newest', label: 'Newest first' },
	{ value: 'oldest', label: 'Oldest first' },
	{ value: 'urgency', label: 'Highest urgency' },
	{ value: 'units', label: 'Highest units requested' },
];

export default function RequestFilters({ value = {}, onChange, onReset }) {
	const v = value || {};
	function update(patch) {
		onChange?.({ ...v, ...patch });
	}
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
					<input
						type="search"
						value={v.search || ''}
						onChange={(e) => update({ search: e.target.value })}
						placeholder="Request ID, hospital, blood group, city"
						className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
					/>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blood Group</span>
					<select
						value={v.bloodGroup || ''}
						onChange={(e) => update({ bloodGroup: e.target.value })}
						className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
					>
						<option value="">All Groups</option>
						{BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
					</select>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Urgency</span>
					<select
						value={v.urgency || ''}
						onChange={(e) => update({ urgency: e.target.value })}
						className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
					>
						{URGENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
					</select>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
					<select
						value={v.status || ''}
						onChange={(e) => update({ status: e.target.value })}
						className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
					>
						{STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
					</select>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</span>
					<select
						value={v.sort || 'newest'}
						onChange={(e) => update({ sort: e.target.value })}
						className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
					>
						{SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
					</select>
				</label>
			</div>
			<div className="mt-3 flex flex-wrap items-center justify-between gap-2">
				<label className="block text-xs text-slate-500">
					Date range
					<div className="mt-1 flex flex-wrap gap-2">
						<input
							type="date"
							value={v.from || ''}
							onChange={(e) => update({ from: e.target.value })}
							className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
						/>
						<span className="self-center text-slate-400">→</span>
						<input
							type="date"
							value={v.to || ''}
							onChange={(e) => update({ to: e.target.value })}
							className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
						/>
					</div>
				</label>
				<button
					type="button"
					onClick={onReset}
					className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
				>
					Clear Filters
				</button>
			</div>
		</section>
	);
}
