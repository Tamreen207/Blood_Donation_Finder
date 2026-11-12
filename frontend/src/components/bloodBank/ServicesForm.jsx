import { useState, useEffect } from 'react';

const SERVICE_OPTIONS = [
	{ value: 'BLOOD_DONATION', label: 'Blood Donation' },
	{ value: 'BLOOD_COLLECTION', label: 'Blood Collection' },
	{ value: 'BLOOD_STORAGE', label: 'Blood Storage' },
	{ value: 'BLOOD_TESTING', label: 'Blood Testing' },
	{ value: 'COMPONENT_SEPARATION', label: 'Blood Component Separation' },
	{ value: 'BLOOD_ISSUANCE', label: 'Blood Issuance' },
	{ value: 'EMERGENCY_SUPPORT', label: 'Emergency Blood Support' },
	{ value: 'PLASMA_AVAILABILITY', label: 'Plasma Availability' },
	{ value: 'PLATELET_AVAILABILITY', label: 'Platelet Availability' },
];

const COMPONENT_OPTIONS = [
	{ value: 'WHOLE_BLOOD', label: 'Whole Blood' },
	{ value: 'PACKED_RBC', label: 'Packed Red Blood Cells' },
	{ value: 'PLASMA', label: 'Plasma' },
	{ value: 'PLATELETS', label: 'Platelets' },
	{ value: 'CRYOPRECIPITATE', label: 'Cryoprecipitate' },
];

function CheckboxGroup({ options, value, onChange }) {
	return (
		<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
			{options.map((o) => {
				const checked = value?.includes(o.value);
				return (
					<label key={o.value} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 transition ${checked ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
						<input
							type="checkbox"
							checked={!!checked}
							onChange={(e) => {
								const set = new Set(value || []);
								if (e.target.checked) set.add(o.value); else set.delete(o.value);
								onChange(Array.from(set));
							}}
							className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
						/>
						<span className="text-sm text-slate-800">{o.label}</span>
					</label>
				);
			})}
		</div>
	);
}

export default function ServicesForm({ value, onChange }) {
	const v = value || {};
	const [local, setLocal] = useState(v);
	useEffect(() => { setLocal(v); }, [v]);
	function update(patch) { const n = { ...local, ...patch }; setLocal(n); onChange?.(n); }
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header className="mb-4">
				<h2 className="text-base font-semibold text-slate-900">Services & Components</h2>
				<p className="text-sm text-slate-500">What your blood bank offers. This is informational — live stock is in Inventory.</p>
			</header>
			<div className="space-y-5">
				<div>
					<h3 className="mb-2 text-sm font-semibold text-slate-800">Services Offered</h3>
					<CheckboxGroup options={SERVICE_OPTIONS} value={local.services} onChange={(arr) => update({ services: arr })} />
				</div>
				<div>
					<h3 className="mb-2 text-sm font-semibold text-slate-800">Blood Components</h3>
					<CheckboxGroup options={COMPONENT_OPTIONS} value={local.components} onChange={(arr) => update({ components: arr })} />
				</div>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
						<button
							type="button"
							role="switch"
							aria-checked={!!local.emergencySupport}
							onClick={() => update({ emergencySupport: !local.emergencySupport })}
							className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${local.emergencySupport ? 'bg-rose-600' : 'bg-slate-300'}`}
						>
							<span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${local.emergencySupport ? 'translate-x-5' : 'translate-x-0.5'}`} />
						</button>
						<span className="text-sm text-slate-800">Emergency support available</span>
					</label>
					<label className="block">
						<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Emergency service hours</span>
						<input type="text" value={local.emergencyHours || ''} onChange={(e) => update({ emergencyHours: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200" placeholder="e.g. 24/7 or 18:00-06:00" />
					</label>
				</div>
			</div>
		</section>
	);
}
