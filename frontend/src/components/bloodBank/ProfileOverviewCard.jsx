import { Building2, CheckCircle2, MapPin, Phone, Mail, Globe, ShieldCheck, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';

function verificationMeta(status) {
	switch (status) {
		case 'VERIFIED': return { label: 'Verified Blood Bank', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', dot: 'bg-emerald-500' };
		case 'PENDING': return { label: 'Verification Pending', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', dot: 'bg-amber-500' };
		case 'REJECTED': return { label: 'Verification Rejected', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', dot: 'bg-rose-500' };
		default: return { label: 'Verification Required', bg: 'bg-slate-50', text: 'text-slate-700', ring: 'ring-slate-200', dot: 'bg-slate-500' };
	}
}

export default function ProfileOverviewCard({ profile, completion, onUploadLogo, onRemoveLogo, busy }) {
	const v = verificationMeta(profile?.verification?.status || 'UNVERIFIED');
	const city = profile?.city;
	const state = profile?.state;
	const location = [city, state].filter(Boolean).join(', ');
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
			<div className="flex flex-col gap-5 sm:flex-row sm:items-center">
				<div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-rose-50 text-rose-600 ring-1 ring-rose-100">
					{profile?.logoUrl ? (
						<img src={profile.logoUrl} alt={`${profile?.name || 'Blood bank'} logo`} className="h-full w-full object-cover" />
					) : (
						<div className="flex h-full w-full items-center justify-center">
							<Building2 className="h-10 w-10" aria-hidden="true" />
						</div>
					)}
				</div>
				<div className="flex-1 min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{profile?.name || 'Blood Bank'}</h1>
						<span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${v.bg} ${v.text} ring-1 ${v.ring}`}>
							<span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} aria-hidden="true" />
							<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
							{v.label}
						</span>
					</div>
					<p className="mt-1 text-sm text-slate-500">
						{profile?._id ? <span className="font-mono">ID: {String(profile._id).slice(-8).toUpperCase()}</span> : 'Blood Bank ID pending'}
					</p>
					<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
						{location && (
							<span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{location}</span>
						)}
						{profile?.phone && (
							<span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{profile.phone}</span>
						)}
						{profile?.email && (
							<span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{profile.email}</span>
						)}
						{profile?.website && (
							<span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />{profile.website}</span>
						)}
					</div>
					{completion != null && (
						<div className="mt-3 max-w-md">
							<div className="flex items-center justify-between text-xs text-slate-500">
								<span>Profile completion</span>
								<span className="font-semibold text-slate-700">{completion}%</span>
							</div>
							<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
								<div className="h-full bg-emerald-500" style={{ width: `${completion}%` }} />
							</div>
						</div>
					)}
				</div>
				<div className="flex flex-col items-stretch gap-2 sm:items-end">
					<label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
						<Upload className="h-4 w-4" aria-hidden="true" />
						{busy ? 'Uploading…' : 'Upload Logo'}
						<input type="file" accept="image/*" className="sr-only" onChange={(e) => {
							const f = e.target.files?.[0];
							if (f) onUploadLogo?.(f);
							e.target.value = '';
						}} />
					</label>
					{profile?.logoUrl ? (
						<button type="button" disabled={busy} onClick={onRemoveLogo} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60">
							<Trash2 className="h-4 w-4" aria-hidden="true" /> Remove Logo
						</button>
					) : null}
				</div>
			</div>
		</section>
	);
}
