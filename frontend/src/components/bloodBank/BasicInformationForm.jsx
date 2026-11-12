import { useState, useEffect } from 'react';

export default function BasicInformationForm({ value, errors, onChange }) {
	const v = value || {};
	const [local, setLocal] = useState(v);
	useEffect(() => { setLocal(v); }, [v]);

	function update(patch) {
		const next = { ...local, ...patch };
		setLocal(next);
		onChange?.(next);
	}
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header className="mb-4">
				<h2 className="text-base font-semibold text-slate-900">Basic Information</h2>
				<p className="text-sm text-slate-500">Public details about your blood bank.</p>
			</header>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blood Bank Name <span className="text-rose-600">*</span></span>
					<input
						type="text"
						value={local.name || ''}
						onChange={(e) => update({ name: e.target.value })}
						maxLength={120}
						className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${errors?.name ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-rose-500 focus:ring-rose-200'}`}
					/>
					{errors?.name && <p className="mt-1 text-xs text-rose-700">{errors.name}</p>}
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registration / License Number</span>
					<input
						type="text"
						value={local.registrationNumber || ''}
						onChange={(e) => update({ registrationNumber: e.target.value })}
						maxLength={80}
						className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
					/>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Blood Bank Type</span>
					<select value={local.bloodBankType || 'OTHER'} onChange={(e) => update({ bloodBankType: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200">
						<option value="GOVERNMENT">Government</option>
						<option value="PRIVATE">Private</option>
						<option value="HOSPITAL">Hospital Blood Bank</option>
						<option value="NGO_TRUST">NGO / Trust</option>
						<option value="OTHER">Other</option>
					</select>
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Established Year</span>
					<input
						type="number"
						min={1800}
						max={new Date().getFullYear()}
						value={local.establishedYear || ''}
						onChange={(e) => update({ establishedYear: e.target.value ? Number(e.target.value) : undefined })}
						className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
					/>
				</label>
				<label className="block sm:col-span-2">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
					<textarea
						rows={4}
						maxLength={1000}
						value={local.description || ''}
						onChange={(e) => update({ description: e.target.value })}
						className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
						placeholder="Short professional description of your blood bank"
					/>
					<p className="mt-1 text-right text-xs text-slate-400">{(local.description || '').length}/1000</p>
				</label>
			</div>
		</section>
	);
}
