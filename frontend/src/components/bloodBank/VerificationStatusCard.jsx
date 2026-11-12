import { ShieldCheck, ShieldAlert, FileText, BadgeCheck, Clock, XCircle } from 'lucide-react';

function StatusBadge({ status }) {
	const meta = {
		VERIFIED: { label: 'Verified', tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
		PENDING: { label: 'Pending', tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
		REJECTED: { label: 'Rejected', tone: 'bg-rose-50 text-rose-700 ring-rose-200' },
		NOT_SUBMITTED: { label: 'Not submitted', tone: 'bg-slate-50 text-slate-700 ring-slate-200' },
	}[status] || { label: status || 'Unknown', tone: 'bg-slate-50 text-slate-700 ring-slate-200' };
	return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${meta.tone}`}>{meta.label}</span>;
}

function formatDate(iso) {
	if (!iso) return '—';
	try { return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }); } catch (_) { return '—'; }
}

export default function VerificationStatusCard({ verification = {}, documents = {} }) {
	const status = verification.status || 'UNVERIFIED';
	const mainMeta = {
		VERIFIED: { label: 'Verified', icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
		PENDING: { label: 'Pending Verification', icon: Clock, tone: 'bg-amber-50 text-amber-700 ring-amber-200' },
		REJECTED: { label: 'Verification Rejected', icon: XCircle, tone: 'bg-rose-50 text-rose-700 ring-rose-200' },
		UNVERIFIED: { label: 'Verification Required', icon: ShieldAlert, tone: 'bg-slate-50 text-slate-700 ring-slate-200' },
	}[status];
	const Main = mainMeta.icon;
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
			<header className="mb-4">
				<h2 className="text-base font-semibold text-slate-900">Verification</h2>
				<p className="text-sm text-slate-500">Verification is controlled by the platform administrator.</p>
			</header>
			<div className={`mb-5 flex items-center gap-3 rounded-xl border p-4 ring-1 ${mainMeta.tone}`}>
				<Main className="h-6 w-6" aria-hidden="true" />
				<div>
					<p className="text-sm font-semibold">Status: {mainMeta.label}</p>
					{verification.verifiedAt && <p className="text-xs">Verified on {formatDate(verification.verifiedAt)}</p>}
					{verification.authority && <p className="text-xs">Authority: {verification.authority}</p>}
					{verification.notes && <p className="mt-1 text-xs opacity-80">{verification.notes}</p>}
				</div>
			</div>
			<div>
				<h3 className="mb-2 text-sm font-semibold text-slate-800">Documents</h3>
				<ul className="space-y-2">
					{['license', 'registration', 'verification'].map((d) => (
						<li key={d} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-3">
							<div className="flex items-center gap-2">
								<FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
								<span className="text-sm font-medium capitalize text-slate-800">{d} document</span>
							</div>
							<StatusBadge status={documents?.[d]?.status || 'NOT_SUBMITTED'} />
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
