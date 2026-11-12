import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	Bell,
	BellRing,
	Building2,
	CheckCircle2,
	ClipboardList,
	Droplet,
	Droplets,
	Hospital,
	LoaderCircle,
	Lock,
	MapPin,
	Navigation2,
	Phone,
	ShieldCheck,
	Siren,
	User,
	Users,
	Zap,
} from 'lucide-react';
import { createEmergencyRequest, isBloodRequestApiConfigured } from '../services/requestService';
import { getBrowserLocation } from '../services/locationService';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = [
	{ value: 'male', label: 'Male' },
	{ value: 'female', label: 'Female' },
	{ value: 'other', label: 'Other' },
];
const REASONS = ['Surgery', 'Accident', 'Trauma', 'Medical Treatment', 'Blood Loss', 'Other'];
const RADIUS_OPTIONS = [
	{ value: 10, label: '10 km' },
	{ value: 25, label: '25 km' },
	{ value: 50, label: '50 km' },
	{ value: 100, label: '100 km' },
];
const NOTIFICATION_TARGETS = [
	{ key: 'bloodBanks', label: 'Nearby blood banks', icon: Building2, description: 'Verified blood banks in range' },
	{ key: 'donors', label: 'Compatible donors', icon: Users, description: 'Available donors with matching blood group' },
	{ key: 'verifiedOnly', label: 'Verified donors only', icon: ShieldCheck, description: 'Limit notifications to identity-verified donors' },
];

const initialForm = {
	bloodGroup: 'O+',
	unitsRequired: 1,
	requiredDate: '',
	requiredTime: '',
	patientName: '',
	patientAge: '',
	gender: 'male',
	hospitalName: '',
	hospitalAddress: '',
	city: '',
	area: '',
	pinCode: '',
	contactName: '',
	contactPhone: '',
	alternativePhone: '',
	email: '',
	reason: 'Accident',
	additionalInformation: '',
	radius: 25,
	notificationTargets: { bloodBanks: true, donors: true, verifiedOnly: false },
	consent: false,
	latitude: null,
	longitude: null,
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[+\d][\d\s-]{6,20}$/;

function todayDate() {
	return new Date().toISOString().slice(0, 10);
}

function validate(form) {
	const errors = {};
	if (!form.bloodGroup || !BLOOD_GROUPS.includes(form.bloodGroup)) errors.bloodGroup = 'Select a valid blood group.';
	if (!form.unitsRequired || Number(form.unitsRequired) < 1) errors.unitsRequired = 'Units must be at least 1.';
	if (!form.requiredDate) errors.requiredDate = 'Required date is required.';
	if (!form.requiredTime) errors.requiredTime = 'Required time is required.';
	if (!form.patientName.trim()) errors.patientName = 'Patient name is required.';
	if (form.patientAge && (Number(form.patientAge) < 0 || Number(form.patientAge) > 130)) errors.patientAge = 'Enter a valid age.';
	if (!form.hospitalName.trim()) errors.hospitalName = 'Hospital name is required.';
	if (!form.hospitalAddress.trim()) errors.hospitalAddress = 'Hospital address is required.';
	if (!form.city.trim()) errors.city = 'City is required.';
	if (!form.contactName.trim()) errors.contactName = 'Contact name is required.';
	if (!form.contactPhone.trim()) errors.contactPhone = 'Contact phone is required.';
	else if (!phoneRegex.test(form.contactPhone.trim())) errors.contactPhone = 'Enter a valid phone number.';
	if (form.alternativePhone && !phoneRegex.test(form.alternativePhone.trim())) errors.alternativePhone = 'Enter a valid phone number.';
	if (form.email && !emailRegex.test(form.email.trim())) errors.email = 'Enter a valid email address.';
	if (!form.consent) errors.consent = 'You must consent to send the emergency request.';
	return errors;
}

export default function EmergencyRequestPage() {
	const navigate = useNavigate();
	const [form, setForm] = useState(initialForm);
	const [errors, setErrors] = useState({});
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState('');
	const [locationStatus, setLocationStatus] = useState('');
	const [submitted, setSubmitted] = useState(null);
	const isApiReady = isBloodRequestApiConfigured();
	const summary = useMemo(() => buildSummary(form), [form]);

	function update(key, value) {
		setForm((current) => ({ ...current, [key]: value }));
		setErrors((current) => {
			if (!current[key]) return current;
			const next = { ...current };
			delete next[key];
			return next;
		});
	}

	function toggleTarget(key) {
		setForm((current) => ({
			...current,
			notificationTargets: { ...current.notificationTargets, [key]: !current.notificationTargets[key] },
		}));
	}

	async function useMyLocation() {
		setLocationStatus('Requesting your location...');
		try {
			const loc = await getBrowserLocation();
			if (!loc) {
				setLocationStatus('Location access was not allowed. Please enter the hospital location manually.');
				return;
			}
			update('latitude', loc.latitude);
			update('longitude', loc.longitude);
			if (loc.city && !form.city) update('city', loc.city);
			setLocationStatus(`Location captured${loc.city ? ` (${loc.city})` : ''}.`);
		} catch (_) {
			setLocationStatus('Location access was not allowed. Please enter the hospital location manually.');
		}
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setSubmitError('');
		const v = validate(form);
		setErrors(v);
		if (Object.keys(v).length) return;

		const payload = {
			bloodGroup: form.bloodGroup,
			unitsRequired: Number(form.unitsRequired),
			requiredDate: form.requiredDate,
			requiredTime: form.requiredTime,
			patient: {
				name: form.patientName.trim(),
				age: form.patientAge ? Number(form.patientAge) : undefined,
				gender: form.gender,
			},
			hospital: {
				name: form.hospitalName.trim(),
				address: form.hospitalAddress.trim(),
			},
			location: {
				city: form.city.trim(),
				area: form.area.trim(),
				pinCode: form.pinCode.trim(),
				latitude: form.latitude,
				longitude: form.longitude,
			},
			contact: {
				name: form.contactName.trim(),
				phone: form.contactPhone.trim(),
				alternativePhone: form.alternativePhone.trim() || undefined,
				email: form.email.trim() || undefined,
			},
			reason: form.reason,
			additionalInformation: form.additionalInformation.trim() || undefined,
			radius: Number(form.radius),
			notificationTargets: form.notificationTargets,
			priority: 'EMERGENCY',
		};

		setSubmitting(true);
		try {
			const res = await createEmergencyRequest(payload);
			const request = res?.data?.request || res?.data || {
				_id: `EM-${Date.now().toString(36).toUpperCase()}`,
				status: 'SEARCHING',
				priority: 'EMERGENCY',
				...payload,
				createdAt: new Date().toISOString(),
			};
			setSubmitted({
				id: request._id || request.id,
				bloodGroup: request.bloodGroup,
				units: request.unitsRequired || payload.unitsRequired,
				hospital: request.hospitalName || request.hospital?.name || form.hospitalName,
				status: request.status || 'SEARCHING',
				createdAt: request.createdAt || new Date().toISOString(),
			});
		} catch (err) {
			setSubmitError(err?.message || 'Unable to send your emergency request. Please try again.');
		} finally {
			setSubmitting(false);
		}
	}

	if (submitted) {
		return <SuccessScreen submission={submitted} onDashboard={() => navigate('/dashboard')} onTrack={() => navigate(`/request-tracking/${submitted.id}`)} />;
	}

	return (
		<div className="min-h-screen overflow-x-hidden bg-blood-radial text-slate-100">
			<div className="section-shell py-8 sm:py-10 lg:py-12">
				<Breadcrumbs />
				<BackBar onBack={() => navigate(-1)} />
				<EmergencyHeader apiReady={isApiReady} />
				<PriorityCard />

				<form onSubmit={handleSubmit} className="mt-8 grid gap-6 xl:grid-cols-[1.55fr_1fr]" noValidate>
					<div className="space-y-6">
						<BloodRequirementCard form={form} update={update} errors={errors} />
						<PatientInfoCard form={form} update={update} errors={errors} />
						<HospitalCard form={form} update={update} errors={errors} onUseMyLocation={useMyLocation} locationStatus={locationStatus} />
						<ContactCard form={form} update={update} errors={errors} />
						<EmergencyDetailsCard form={form} update={update} />
						<SearchRadiusCard form={form} update={update} />
						<TargetsCard targets={form.notificationTargets} onToggle={toggleTarget} />
						<ConsentCard form={form} update={update} errors={errors} />
					</div>

					<div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
						<SummaryCard summary={summary} />
						<PrivacyCard />
						<HelpfulLinksCard />
					</div>

					<div className="xl:col-span-2">
						<div className="glass-card flex flex-col gap-4 rounded-[2rem] border-rose-400/30 bg-gradient-to-br from-rose-500/15 via-red-500/5 to-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
							<div className="text-sm text-slate-200">
								{submitError ? (
									<span className="inline-flex items-center gap-2 text-rose-100">
										<AlertTriangle className="h-4 w-4" aria-hidden="true" /> {submitError}
									</span>
								) : (
									<span className="inline-flex items-center gap-2">
										<Siren className="h-4 w-4 text-rose-200" aria-hidden="true" />
										Submitting an emergency request notifies the closest matching resources immediately.
									</span>
								)}
							</div>
							<div className="flex flex-wrap items-center justify-end gap-3">
								<Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
									Cancel
								</Link>
								<button
									type="submit"
									disabled={submitting}
									onClick={(e) => {
										// Ensure form submission works
										if (!e.currentTarget.form) return;
									}}
									className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{submitting ? (
										<>
											<LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
											Sending Emergency Request...
										</>
									) : (
										<>
											<BellRing className="h-4 w-4" aria-hidden="true" />
											Send Emergency Request
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

function Breadcrumbs() {
	return (
		<nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-400">
			<Link to="/dashboard" className="transition hover:text-white">Dashboard</Link>
			<span aria-hidden="true">/</span>
			<span className="text-slate-200" aria-current="page">Emergency Request</span>
		</nav>
	);
}

function BackBar({ onBack }) {
	return (
		<div className="mb-4 flex items-center justify-between">
			<button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10">
				<ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back
			</button>
		</div>
	);
}

function EmergencyHeader({ apiReady }) {
	return (
		<header className="glass-card relative overflow-hidden rounded-[2rem] border-rose-400/30 bg-gradient-to-br from-rose-500/20 via-red-500/10 to-slate-900 p-6 sm:p-8">
			<div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-red-400 to-amber-400" aria-hidden="true" />
			<div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<div className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-rose-100">
						<Siren className="h-3.5 w-3.5" aria-hidden="true" /> Emergency
					</div>
					<h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Emergency Blood Request</h1>
					<p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200/90 sm:text-base">Quickly notify nearby blood banks and compatible donors when blood is urgently needed.</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${apiReady ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/30 bg-amber-500/10 text-amber-200'}`}>
						<span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
						{apiReady ? 'API Connected' : 'Local mode (no backend configured)'}
					</span>
				</div>
			</div>
			<div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
				<AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
				<p>For life-threatening emergencies, contact local emergency medical services immediately. LifeLink helps connect people with blood resources but does not replace emergency medical care.</p>
			</div>
		</header>
	);
}

function PriorityCard() {
	return (
		<section className="mt-6 glass-card rounded-[2rem] border-rose-400/20 bg-rose-500/5 p-6 sm:p-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="rounded-2xl bg-rose-500/15 p-3 text-rose-200"><Zap className="h-5 w-5" aria-hidden="true" /></div>
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Emergency priority</p>
						<h2 className="mt-1 text-2xl font-semibold text-white">Emergency Priority</h2>
					</div>
				</div>
				<p className="max-w-xl text-sm leading-7 text-slate-200/90">Your request will be marked as high priority and matched with suitable available blood resources.</p>
			</div>
		</section>
	);
}

function Section({ icon: Icon, title, subtitle, children, action }) {
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					{Icon ? (
						<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200">
							<Icon className="h-5 w-5" aria-hidden="true" />
						</div>
					) : null}
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">{title}</p>
						{subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
					</div>
				</div>
				{action || null}
			</div>
			<div className="mt-6">{children}</div>
		</section>
	);
}

function BloodRequirementCard({ form, update, errors }) {
	return (
		<Section icon={Droplet} title="Blood requirement" subtitle="What is needed urgently">
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Blood group" required error={errors.bloodGroup}>
					<select className="field-input" value={form.bloodGroup} onChange={(e) => update('bloodGroup', e.target.value)} aria-invalid={Boolean(errors.bloodGroup)}>
						{BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
					</select>
				</Field>
				<Field label="Units required" required error={errors.unitsRequired}>
					<input className="field-input" type="number" min={1} max={10} value={form.unitsRequired} onChange={(e) => update('unitsRequired', e.target.value)} aria-invalid={Boolean(errors.unitsRequired)} />
				</Field>
				<Field label="Required by" required error={errors.requiredDate}>
					<input className="field-input" type="date" min={todayDate()} value={form.requiredDate} onChange={(e) => update('requiredDate', e.target.value)} aria-invalid={Boolean(errors.requiredDate)} />
				</Field>
				<Field label="Required time" required error={errors.requiredTime}>
					<input className="field-input" type="time" value={form.requiredTime} onChange={(e) => update('requiredTime', e.target.value)} aria-invalid={Boolean(errors.requiredTime)} />
				</Field>
			</div>
		</Section>
	);
}

function PatientInfoCard({ form, update, errors }) {
	return (
		<Section icon={User} title="Patient information" subtitle="Only essential, non-sensitive details">
			<div className="grid gap-4 sm:grid-cols-3">
				<Field label="Patient name" required error={errors.patientName}>
					<input className="field-input" value={form.patientName} onChange={(e) => update('patientName', e.target.value)} placeholder="Patient name" aria-invalid={Boolean(errors.patientName)} />
				</Field>
				<Field label="Patient age" error={errors.patientAge}>
					<input className="field-input" type="number" min={0} max={130} value={form.patientAge} onChange={(e) => update('patientAge', e.target.value)} placeholder="Years" aria-invalid={Boolean(errors.patientAge)} />
				</Field>
				<Field label="Gender">
					<select className="field-input" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
						{GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
					</select>
				</Field>
			</div>
		</Section>
	);
}

function HospitalCard({ form, update, errors, onUseMyLocation, locationStatus }) {
	return (
		<Section
			icon={Hospital}
			title="Hospital information"
			subtitle="Where the blood is needed"
			action={
				<button type="button" onClick={onUseMyLocation} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
					<Navigation2 className="h-4 w-4" aria-hidden="true" /> Use My Location
				</button>
			}
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Hospital name" required error={errors.hospitalName}>
					<input className="field-input" value={form.hospitalName} onChange={(e) => update('hospitalName', e.target.value)} placeholder="Hospital name" aria-invalid={Boolean(errors.hospitalName)} />
				</Field>
				<Field label="Hospital address" required error={errors.hospitalAddress}>
					<input className="field-input" value={form.hospitalAddress} onChange={(e) => update('hospitalAddress', e.target.value)} placeholder="Street, area" aria-invalid={Boolean(errors.hospitalAddress)} />
				</Field>
				<Field label="City" required error={errors.city}>
					<input className="field-input" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="City" aria-invalid={Boolean(errors.city)} />
				</Field>
				<Field label="Area">
					<input className="field-input" value={form.area} onChange={(e) => update('area', e.target.value)} placeholder="Area / neighborhood" />
				</Field>
				<Field label="PIN code">
					<input className="field-input" value={form.pinCode} onChange={(e) => update('pinCode', e.target.value)} placeholder="PIN code" inputMode="numeric" />
				</Field>
			</div>
			{locationStatus ? (
				<p className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-300">
					<MapPin className="h-4 w-4 text-rose-200" aria-hidden="true" /> {locationStatus}
				</p>
			) : null}
		</Section>
	);
}

function ContactCard({ form, update, errors }) {
	return (
		<Section icon={Phone} title="Contact information" subtitle="Used to coordinate only">
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Contact person" required error={errors.contactName}>
					<input className="field-input" value={form.contactName} onChange={(e) => update('contactName', e.target.value)} placeholder="Contact name" aria-invalid={Boolean(errors.contactName)} />
				</Field>
				<Field label="Phone number" required error={errors.contactPhone}>
					<input className="field-input" value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} placeholder="+1 555 000 0000" aria-invalid={Boolean(errors.contactPhone)} />
				</Field>
				<Field label="Alternative phone" error={errors.alternativePhone}>
					<input className="field-input" value={form.alternativePhone} onChange={(e) => update('alternativePhone', e.target.value)} placeholder="Optional" aria-invalid={Boolean(errors.alternativePhone)} />
				</Field>
				<Field label="Email" error={errors.email}>
					<input className="field-input" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="Optional" aria-invalid={Boolean(errors.email)} />
				</Field>
			</div>
		</Section>
	);
}

function EmergencyDetailsCard({ form, update }) {
	return (
		<Section icon={AlertTriangle} title="Emergency details" subtitle="Help responders prioritise correctly">
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Reason for emergency">
					<select className="field-input" value={form.reason} onChange={(e) => update('reason', e.target.value)}>
						{REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
					</select>
				</Field>
			</div>
			<div className="mt-4">
				<Field label="Additional information">
					<textarea
						className="field-input min-h-[120px]"
						value={form.additionalInformation}
						onChange={(e) => update('additionalInformation', e.target.value)}
						placeholder="Share any important context for responders..."
					/>
				</Field>
			</div>
		</Section>
	);
}

function SearchRadiusCard({ form, update }) {
	return (
		<Section icon={Navigation2} title="Search radius" subtitle="Notify matching resources within">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="radiogroup" aria-label="Search radius">
				{RADIUS_OPTIONS.map((r) => {
					const active = Number(form.radius) === r.value;
					return (
						<button
							key={r.value}
							type="button"
							role="radio"
							aria-checked={active}
							onClick={() => update('radius', r.value)}
							className={`rounded-2xl border p-4 text-sm font-semibold transition ${active ? 'border-rose-400/40 bg-rose-500/15 text-white' : 'border-white/10 bg-slate-950/40 text-slate-200 hover:border-white/20'}`}
						>
							{r.label}
						</button>
					);
				})}
			</div>
		</Section>
	);
}

function TargetsCard({ targets, onToggle }) {
	return (
		<Section icon={Bell} title="Notification targets" subtitle="Choose who should be notified">
			<div className="space-y-3">
				{NOTIFICATION_TARGETS.map((t) => {
					const Icon = t.icon;
					const active = Boolean(targets[t.key]);
					return (
						<button
							key={t.key}
							type="button"
							role="switch"
							aria-checked={active}
							onClick={() => onToggle(t.key)}
							className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${active ? 'border-rose-400/40 bg-rose-500/10' : 'border-white/10 bg-slate-950/40 hover:border-white/20'}`}
						>
							<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-rose-200">
								<Icon className="h-5 w-5" aria-hidden="true" />
							</div>
							<div className="flex-1">
								<p className="text-sm font-semibold text-white">{t.label}</p>
								<p className="text-xs text-slate-300">{t.description}</p>
							</div>
							<span className={`inline-flex h-6 w-11 items-center rounded-full transition ${active ? 'bg-rose-500' : 'bg-white/10'}`}>
								<span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${active ? 'translate-x-5' : 'translate-x-1'}`} />
							</span>
						</button>
					);
				})}
			</div>
			<p className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
				<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Donor contact details are never publicly exposed. They are shared only after consent through the request flow.
			</p>
		</Section>
	);
}

function ConsentCard({ form, update, errors }) {
	return (
		<Section icon={ShieldCheck} title="Consent" subtitle="Required to submit">
			<label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200">
				<input
					type="checkbox"
					checked={form.consent}
					onChange={(e) => update('consent', e.target.checked)}
					className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-rose-500 focus:ring-rose-500"
					aria-invalid={Boolean(errors.consent)}
				/>
				<span>I confirm that the information provided is accurate and I authorize LifeLink to share the necessary request details with authorized matching blood resources.</span>
			</label>
			{errors.consent ? <p className="mt-2 text-sm text-rose-200" role="alert">{errors.consent}</p> : null}
		</Section>
	);
}

function SummaryCard({ summary }) {
	return (
		<aside className="glass-card rounded-[2rem] p-6 sm:p-8" aria-label="Request summary">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Summary</p>
					<h2 className="mt-2 text-2xl font-semibold text-white">Request summary</h2>
				</div>
				<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200"><ClipboardList className="h-5 w-5" aria-hidden="true" /></div>
			</div>
			<dl className="mt-6 space-y-3 text-sm">
				{summary.map((row) => (
					<div key={row.label} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
						<dt className="text-slate-400">{row.label}</dt>
						<dd className="text-right font-medium text-white">{row.value}</dd>
					</div>
				))}
			</dl>
		</aside>
	);
}

function PrivacyCard() {
	return (
		<aside className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center gap-3">
				<div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-200"><Lock className="h-5 w-5" aria-hidden="true" /></div>
				<h3 className="text-lg font-semibold text-white">Privacy & safety</h3>
			</div>
			<p className="mt-3 text-sm leading-7 text-slate-300">Your personal and contact information is shared only with authorized parties involved in fulfilling this request. Donor home addresses remain private.</p>
		</aside>
	);
}

function HelpfulLinksCard() {
	return (
		<aside className="glass-card rounded-[2rem] p-6 sm:p-8">
			<h3 className="text-lg font-semibold text-white">Other ways to find blood</h3>
			<div className="mt-4 flex flex-wrap gap-3">
				<Link to="/find-blood" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
					<Building2 className="h-4 w-4" aria-hidden="true" /> Find Blood
				</Link>
				<Link to="/find-donor" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
					<User className="h-4 w-4" aria-hidden="true" /> Find Donor
				</Link>
				<Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
					Dashboard
				</Link>
			</div>
		</aside>
	);
}

function SuccessScreen({ submission, onDashboard, onTrack }) {
	const steps = [
		{ id: 1, label: 'Searching nearby blood banks...', done: true },
		{ id: 2, label: 'Searching compatible donors...', done: true },
		{ id: 3, label: 'Notifications being sent...', done: true },
		{ id: 4, label: 'Waiting for responses...', done: false },
	];
	return (
		<div className="min-h-screen overflow-x-hidden bg-blood-radial text-slate-100">
			<div className="section-shell flex min-h-[80vh] items-center justify-center py-10">
				<div className="grid w-full max-w-3xl gap-6">
					<div className="glass-card w-full rounded-[2.5rem] p-8 text-center sm:p-10">
						<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-emerald-500/15 text-emerald-200">
							<CheckCircle2 className="h-10 w-10" aria-hidden="true" />
						</div>
						<h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Emergency Request Sent</h1>
						<p className="mt-3 text-sm leading-7 text-slate-300">We are searching for compatible nearby blood resources.</p>
						<dl className="mt-8 grid gap-3 text-left sm:grid-cols-2">
							<InfoLine label="Request ID" value={submission.id} />
							<InfoLine label="Status" value={submission.status || 'Searching'} />
							<InfoLine label="Blood group" value={submission.bloodGroup} />
							<InfoLine label="Units required" value={String(submission.units || 1)} />
							<InfoLine label="Hospital" value={submission.hospital || '—'} />
							<InfoLine label="Created" value={new Date(submission.createdAt).toLocaleString()} />
						</dl>
						<div className="mt-8 flex flex-wrap justify-center gap-3">
							<button type="button" onClick={onTrack} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3 text-sm font-semibold text-white">
								Track Request <ArrowRight className="h-4 w-4" aria-hidden="true" />
							</button>
							<button type="button" onClick={onDashboard} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
								Back to Dashboard
							</button>
						</div>
					</div>

					<section className="glass-card rounded-[2rem] p-6 sm:p-8" aria-label="Matching progress">
						<div className="flex items-center gap-3">
							<div className="rounded-2xl bg-sky-500/10 p-3 text-sky-200"><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /></div>
							<div>
								<p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200/80">Live status</p>
								<h2 className="mt-1 text-2xl font-semibold text-white">Matching progress</h2>
							</div>
						</div>
						<ol className="mt-6 space-y-3">
							{steps.map((step) => (
								<li key={step.id} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${step.done ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-slate-950/40 text-slate-200'}`}>
									<span className={`flex h-8 w-8 items-center justify-center rounded-full ${step.done ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/5 text-slate-300'}`}>
										{step.done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
									</span>
									<span className="flex-1">{step.label}</span>
									<span className="text-xs text-slate-400">{step.done ? 'Done' : 'In progress'}</span>
								</li>
							))}
						</ol>
						<p className="mt-4 text-xs text-slate-400">Live status will update automatically once real-time notifications are connected.</p>
					</section>
				</div>
			</div>
		</div>
	);
}

function Field({ label, required, error, icon: Icon, children }) {
	return (
		<label className="block">
			<span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
				{Icon ? <Icon className="h-4 w-4 text-rose-200" aria-hidden="true" /> : null}
				{label}{required ? <span className="text-rose-300">*</span> : null}
			</span>
			{children}
			{error ? <p className="mt-2 text-sm text-rose-200" role="alert">{error}</p> : null}
		</label>
	);
}

function InfoLine({ label, value }) {
	return (
		<div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
			<dt className="text-slate-400">{label}</dt>
			<dd className="text-right font-medium text-white">{value || '—'}</dd>
		</div>
	);
}

function buildSummary(form) {
	const targets = [];
	if (form.notificationTargets.bloodBanks) targets.push('Blood banks');
	if (form.notificationTargets.donors) targets.push(form.notificationTargets.verifiedOnly ? 'Verified donors' : 'Compatible donors');
	return [
		{ label: 'Priority', value: 'Emergency' },
		{ label: 'Blood group', value: form.bloodGroup || '—' },
		{ label: 'Units required', value: form.unitsRequired ? `${form.unitsRequired} unit${Number(form.unitsRequired) > 1 ? 's' : ''}` : '—' },
		{ label: 'Hospital', value: form.hospitalName || '—' },
		{ label: 'Location', value: [form.area, form.city].filter(Boolean).join(', ') || '—' },
		{ label: 'Required by', value: [form.requiredDate, form.requiredTime].filter(Boolean).join(' ') || '—' },
		{ label: 'Search radius', value: `${form.radius} km` },
		{ label: 'Notification targets', value: targets.length ? targets.join(', ') : 'None selected' },
	];
}
