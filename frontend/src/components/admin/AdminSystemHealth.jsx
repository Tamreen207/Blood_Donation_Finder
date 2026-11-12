import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const META = {
	OPERATIONAL: { label: 'Operational', bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', icon: CheckCircle2 },
	DEGRADED: { label: 'Degraded', bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', icon: AlertTriangle },
	UNAVAILABLE: { label: 'Unavailable', bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', icon: XCircle },
};

function Row({ name, check }) {
	const meta = META[check?.status] || META.UNAVAILABLE;
	const Icon = meta.icon;
	return (
		<li className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/40 p-3 text-sm">
			<div className="flex items-center gap-2">
				<Icon className={`h-4 w-4 ${meta.text}`} aria-hidden="true" />
				<span className="font-medium text-slate-800">{name}</span>
			</div>
			<div className="flex items-center gap-2">
				<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${meta.bg} ${meta.text} ${meta.ring}`}>{meta.label}</span>
				{Number.isFinite(check?.latencyMs) && <span className="text-xs text-slate-500">{check.latencyMs}ms</span>}
			</div>
		</li>
	);
}

export default function AdminSystemHealth({ checks = {} }) {
	const services = [
		{ key: 'api', label: 'API' },
		{ key: 'database', label: 'Database' },
		{ key: 'authentication', label: 'Authentication' },
		{ key: 'fileStorage', label: 'File Storage' },
		{ key: 'notificationService', label: 'Notification Service' },
		{ key: 'webSocketService', label: 'WebSocket Service' },
	];
	return (
		<section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label="System health">
			<header className="mb-4">
				<h2 className="text-base font-semibold text-slate-900">System Health</h2>
				<p className="text-sm text-slate-500">Live operational status of platform services</p>
			</header>
			<ul className="space-y-2" role="list">
				{services.map((s) => <Row key={s.key} name={s.label} check={checks[s.key]} />)}
			</ul>
		</section>
	);
}
