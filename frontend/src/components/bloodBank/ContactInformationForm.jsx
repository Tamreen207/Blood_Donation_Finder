import { useState, useEffect } from 'react';

function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()); }
function isPhone(v) { return /^[+()\-\s\d]{7,20}$/.test(String(v || '').trim()); }
function isUrl(v) { try { new URL(String(v)); return true; } catch (_) { return false; } }

export default function ContactInformationForm({ value, errors, onChange }) {
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
				<h2 className="text-base font-semibold text-slate-900">Contact Information</h2>
				<p className="text-sm text-slate-500">Public contact details for patients and partner organizations.</p>
			</header>
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone <span className="text-rose-600">*</span></span>
					<input type="tel" value={local.phone || ''} onChange={(e) => update({ phone: e.target.value })} className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${errors?.phone ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-rose-500 focus:ring-rose-200'}`} placeholder="+91 98765 43210" />
					{errors?.phone && <p className="mt-1 text-xs text-rose-700">{errors.phone}</p>}
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email <span className="text-rose-600">*</span></span>
					<input type="email" value={local.email || ''} onChange={(e) => update({ email: e.target.value })} className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${errors?.email ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-rose-500 focus:ring-rose-200'}`} placeholder="contact@bank.org" />
					{errors?.email && <p className="mt-1 text-xs text-rose-700">{errors.email}</p>}
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Website</span>
					<input type="url" value={local.website || ''} onChange={(e) => update({ website: e.target.value })} className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${errors?.website ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-rose-500 focus:ring-rose-200'}`} placeholder="https://www.example.com" />
					{errors?.website && <p className="mt-1 text-xs text-rose-700">{errors.website}</p>}
				</label>
				<label className="block">
					<span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Emergency Contact</span>
					<input type="tel" value={local.emergencyPhone || ''} onChange={(e) => update({ emergencyPhone: e.target.value })} className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${errors?.emergencyPhone ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-300 focus:border-rose-500 focus:ring-rose-200'}`} placeholder="+91 98765 43210" />
					{errors?.emergencyPhone && <p className="mt-1 text-xs text-rose-700">{errors.emergencyPhone}</p>}
				</label>
			</div>
		</section>
	);
}

export { isEmail, isPhone, isUrl };
