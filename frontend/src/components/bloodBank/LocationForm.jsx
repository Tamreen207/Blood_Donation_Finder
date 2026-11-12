import { useState, useEffect } from 'react';

export default function LocationForm({ value, errors, onChange }) {
	const v = value || {};
	const [local, setLocal] = useState(v);
	useEffect(() => { setLocal(v); }, [v]);
	function update(patch) { const n = { ...local, ...patch }; setLocal(n); onChange?.(n); }
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header className="mb-4">
				<h2 className="text-base font-semibold text-slate-900">Location</h2>
				<p className="text-sm text-slate-500">Official blood bank location (not a staff home address).</p>
			</header>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label className="block sm:col-span-2">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</span>
					<input type="text" value={local.address || ''} onChange={(e) => update({ address: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200" />
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">City <span className="text-rose-600">*</span></span>
					<input type="text" value={local.city || ''} onChange={(e) => update({ city: e.target.value })} className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${errors?.city ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-rose-500 focus:ring-rose-200'}`} />
					{errors?.city && <p className="mt-1 text-xs text-rose-700">{errors.city}</p>}
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">District</span>
					<input type="text" value={local.district || ''} onChange={(e) => update({ district: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200" />
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">State</span>
					<input type="text" value={local.state || ''} onChange={(e) => update({ state: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200" />
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Postal Code</span>
					<input type="text" value={local.postalCode || ''} onChange={(e) => update({ postalCode: e.target.value })} className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${errors?.postalCode ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-rose-500 focus:ring-rose-200'}`} />
					{errors?.postalCode && <p className="mt-1 text-xs text-rose-700">{errors.postalCode}</p>}
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Country</span>
					<input type="text" value={local.country || ''} onChange={(e) => update({ country: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200" />
				</label>
				<div className="grid grid-cols-2 gap-3">
					<label className="block">
						<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latitude</span>
						<input type="number" step="any" value={local.latitude ?? ''} onChange={(e) => update({ latitude: e.target.value === '' ? undefined : Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200" />
					</label>
					<label className="block">
						<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Longitude</span>
						<input type="number" step="any" value={local.longitude ?? ''} onChange={(e) => update({ longitude: e.target.value === '' ? undefined : Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200" />
					</label>
				</div>
			</div>
		</section>
	);
}
