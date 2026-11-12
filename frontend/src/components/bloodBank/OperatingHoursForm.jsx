import { useState, useEffect } from 'react';

const DAYS = [
	{ key: 'monday', label: 'Monday' },
	{ key: 'tuesday', label: 'Tuesday' },
	{ key: 'wednesday', label: 'Wednesday' },
	{ key: 'thursday', label: 'Thursday' },
	{ key: 'friday', label: 'Friday' },
	{ key: 'saturday', label: 'Saturday' },
	{ key: 'sunday', label: 'Sunday' },
];

const DEFAULT = { open: '09:00', close: '18:00', closed: false, is24Hours: false };

function DayRow({ day, value, onChange, errors }) {
	const v = value || DEFAULT;
	return (
		<div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-12 sm:items-center">
			<div className="sm:col-span-3">
				<p className="text-sm font-semibold text-slate-800">{day.label}</p>
			</div>
			<label className="inline-flex items-center gap-2 text-sm text-slate-700 sm:col-span-3">
				<input
					type="checkbox"
					checked={!!v.is24Hours}
					onChange={(e) => onChange({ ...v, is24Hours: e.target.checked })}
					className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
				/>
				Open 24 Hours
			</label>
			<label className="inline-flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
				<input
					type="checkbox"
					checked={!!v.closed}
					onChange={(e) => onChange({ ...v, closed: e.target.checked })}
					className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
				/>
				Closed
			</label>
			<div className="grid grid-cols-2 gap-2 sm:col-span-4">
				<label className="block">
					<span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Open</span>
					<input type="time" value={v.open || ''} disabled={v.closed || v.is24Hours} onChange={(e) => onChange({ ...v, open: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-50" />
				</label>
				<label className="block">
					<span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Close</span>
					<input type="time" value={v.close || ''} disabled={v.closed || v.is24Hours} onChange={(e) => onChange({ ...v, close: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-50" />
				</label>
			</div>
			{errors?.[day.key] && <p className="text-xs text-rose-700 sm:col-span-12">{errors[day.key]}</p>}
		</div>
	);
}

export default function OperatingHoursForm({ value, errors, onChange }) {
	const v = value || {};
	const [local, setLocal] = useState(v);
	useEffect(() => { setLocal(v); }, [v]);
	function updateDay(key, dayValue) {
		const next = { ...local, [key]: dayValue };
		setLocal(next);
		onChange?.(next);
	}
	function copyMondayToAll() {
		const monday = local.monday || DEFAULT;
		const next = {};
		DAYS.forEach((d) => { next[d.key] = { ...monday }; });
		setLocal(next);
		onChange?.(next);
	}
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-base font-semibold text-slate-900">Operating Hours</h2>
					<p className="text-sm text-slate-500">When your blood bank is open to the public.</p>
				</div>
				<button type="button" onClick={copyMondayToAll} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Copy Monday to all days</button>
			</header>
			<div className="space-y-2">
				{DAYS.map((d) => (
					<DayRow key={d.key} day={d} value={local[d.key]} onChange={(nv) => updateDay(d.key, nv)} errors={errors} />
				))}
			</div>
		</section>
	);
}

export function validateHours(hours) {
	const errs = {};
	if (!hours) return errs;
	DAYS.forEach((d) => {
		const v = hours[d.key];
		if (!v) return;
		if (v.closed || v.is24Hours) return;
		if (!v.open || !v.close) errs[d.key] = 'Set both open and close times';
		else if (v.open >= v.close) errs[d.key] = 'Open time must be before close time';
	});
	return errs;
}
