import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	Building2,
	Calendar,
	CheckCircle2,
	ClipboardList,
	Clock,
	Droplet,
	Droplets,
	Edit3,
	Heart,
	Hospital,
	LoaderCircle,
	Lock,
	MapPin,
	MessageSquare,
	Navigation2,
	Phone,
	ShieldCheck,
	Sparkles,
	User,
	Users,
	X,
} from 'lucide-react';
import { createBloodRequest, isBloodRequestApiConfigured } from '../services/requestService';
import { getBrowserLocation } from '../services/locationService';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCIES = [
	{ value: 'NORMAL', label: 'Normal', description: 'Planned or scheduled need', tone: 'emerald' },
	{ value: 'URGENT', label: 'Urgent', description: 'Needed within 24 hours', tone: 'amber' },
	{ value: 'EMERGENCY', label: 'Emergency', description: 'Life-threatening, immediate support', tone: 'rose' },
];
const REQUEST_TYPES = [
	{ value: 'BLOOD_BANK', label: 'Blood Bank', icon: Building2, description: 'Request directly from a verified blood bank' },
	{ value: 'DONOR', label: 'Donor', icon: User, description: 'Request a specific donor to coordinate' },
	{ value: 'BOTH', label: 'Both', icon: Users, description: 'Coordinate with blood banks and donors' },
];
const GENDERS = [
	{ value: 'male', label: 'Male' },
	{ value: 'female', label: 'Female' },
	{ value: 'other', label: 'Other' },
];

const initialState = {
	requestType: 'BOTH',
	bloodGroup: 'O+',
	unitsRequired: 1,
	urgency: 'NORMAL',
	requiredDate: '',
	requiredTime: '',
	patientName: '',
	patientAge: '',
	gender: 'male',
	hospitalName: '',
	hospitalLocation: '',
	reason: '',
	city: '',
	area: '',
	pinCode: '',
	contactName: '',
	contactPhone: '',
	alternativePhone: '',
	email: '',
	message: '',
	consent: false,
	latitude: null,
	longitude: null,
	source: { type: '', id: '', name: '', bloodGroup: '', location: '', distanceKm: null, availableUnits: null },
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[+\d][\d\s-]{6,20}$/;

function urgencyTone(tone) {
	if (tone === 'rose') return 'border-rose-400/30 bg-rose-500/10 text-rose-200';
	if (tone === 'amber') return 'border-amber-400/30 bg-amber-500/10 text-amber-200';
	return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
}

function statusLabel(status) {
	switch (status) {
		case 'PENDING': return 'Pending';
		case 'SEARCHING': return 'Searching';
		case 'MATCHED': return 'Matched';
		case 'ACCEPTED': return 'Accepted';
		case 'FULFILLED': return 'Fulfilled';
		case 'CANCELLED': return 'Cancelled';
		default: return status || 'Pending';
	}
}

function validate(form) {
	const errors = {};
	if (!form.bloodGroup || !BLOOD_GROUPS.includes(form.bloodGroup)) errors.bloodGroup = 'Select a valid blood group.';
	if (!form.unitsRequired || Number(form.unitsRequired) < 1) errors.unitsRequired = 'Units must be at least 1.';
	if (!form.urgency) errors.urgency = 'Select an urgency level.';
	if (!form.requiredDate) errors.requiredDate = 'Required date is required.';
	if (!form.requiredTime) errors.requiredTime = 'Required time is required.';
	if (!form.patientName.trim()) errors.patientName = 'Patient name is required.';
	if (form.patientAge && (Number(form.patientAge) < 0 || Number(form.patientAge) > 130)) errors.patientAge = 'Enter a valid age.';
	if (!form.hospitalName.trim()) errors.hospitalName = 'Hospital name is required.';
	if (!form.hospitalLocation.trim()) errors.hospitalLocation = 'Hospital location is required.';
	if (!form.city.trim()) errors.city = 'City is required.';
	if (!form.contactName.trim()) errors.contactName = 'Contact name is required.';
	if (!form.contactPhone.trim()) errors.contactPhone = 'Contact phone is required.';
	else if (!phoneRegex.test(form.contactPhone.trim())) errors.contactPhone = 'Enter a valid phone number.';
	if (form.alternativePhone && !phoneRegex.test(form.alternativePhone.trim())) errors.alternativePhone = 'Enter a valid phone number.';
	if (form.email && !emailRegex.test(form.email.trim())) errors.email = 'Enter a valid email address.';
	if (!form.consent) errors.consent = 'You must confirm the information to submit.';
	return errors;
}

function todayDate() {
	const d = new Date();
	return d.toISOString().slice(0, 10);
}

export default function CreateBloodRequestPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const incoming = location.state || {};
	const [form, setForm] = useState(() => ({
		...initialState,
		bloodGroup: incoming.bloodGroup || 'O+',
		source: incoming.donor
			? { type: 'DONOR', id: incoming.donor.id, name: incoming.donor.name, bloodGroup: incoming.donor.bloodGroup, location: incoming.donor.area, distanceKm: incoming.donor.distance, availableUnits: null }
			: incoming.bloodBank
				? { type: 'BLOOD_BANK', id: incoming.bloodBank.id, name: incoming.bloodBank.name, bloodGroup: incoming.bloodBank.bloodGroup, location: incoming.bloodBank.address || incoming.bloodBank.location, distanceKm: incoming.bloodBank.distanceKm, availableUnits: incoming.bloodBank.availableUnits }
				: initialState.source,
		requestType: incoming.donor ? 'DONOR' : incoming.bloodBank ? 'BLOOD_BANK' : 'BOTH',
	}));
	const [errors, setErrors] = useState({});
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState('');
	const [locationStatus, setLocationStatus] = useState('');
	const [submitted, setSubmitted] = useState(null);

	const isApiReady = isBloodRequestApiConfigured();
	const summary = useMemo(() => buildSummary(form), [form]);
	const errorCount = Object.keys(errors).length;

	function update(key, value) {
		setForm((current) => ({ ...current, [key]: value }));
		setErrors((current) => {
			if (!current[key]) return current;
			const next = { ...current };
			delete next[key];
			return next;
		});
	}

	function clearSource() {
		update('source', { type: '', id: '', name: '', bloodGroup: '', location: '', distanceKm: null, availableUnits: null });
	}

	async function useMyLocation() {
		setLocationStatus('Requesting your location...');
		try {
			const loc = await getBrowserLocation();
			if (!loc) {
				setLocationStatus('Location access was not allowed. Please enter your location manually.');
				return;
			}
			update('latitude', loc.latitude);
			update('longitude', loc.longitude);
			if (loc.city && !form.city) update('city', loc.city);
			setLocationStatus(`Location captured${loc.city ? ` (${loc.city})` : ''}.`);
		} catch (err) {
			setLocationStatus('Location access was not allowed. Please enter your location manually.');
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
			urgency: form.urgency,
			requiredDate: form.requiredDate,
			requiredTime: form.requiredTime,
			patient: {
				name: form.patientName.trim(),
				age: form.patientAge ? Number(form.patientAge) : undefined,
				gender: form.gender,
				reason: form.reason.trim() || undefined,
			},
			hospital: {
				name: form.hospitalName.trim(),
				location: form.hospitalLocation.trim(),
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
			source: form.source?.id ? { type: form.source.type, id: form.source.id } : undefined,
			message: form.message.trim() || undefined,
			requestType: form.requestType,
		};

		setSubmitting(true);
		try {
			const res = await createBloodRequest(payload);
			const request = res?.data?.request || res?.data || { _id: `LR-${Date.now().toString(36).toUpperCase()}`, status: 'PENDING', ...payload, createdAt: new Date().toISOString() };
			setSubmitted({ id: request._id || request.id, bloodGroup: request.bloodGroup, units: request.unitsRequired, status: request.status || 'PENDING', createdAt: request.createdAt || new Date().toISOString() });
		} catch (err) {
			setSubmitError('Your request could not be submitted. Please try again.');
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

				<PageHeader apiReady={isApiReady} errorCount={errorCount} />

				<form onSubmit={handleSubmit} className="mt-8 grid gap-6 xl:grid-cols-[1.55fr_1fr]" noValidate>
					<div className="space-y-6">
						<RequestTypeCard value={form.requestType} onChange={(v) => update('requestType', v)} />
						<BloodRequirementCard form={form} update={update} errors={errors} />
						<PatientInfoCard form={form} update={update} errors={errors} />
						<LocationCard form={form} update={update} errors={errors} onUseMyLocation={useMyLocation} locationStatus={locationStatus} />
						<ContactCard form={form} update={update} errors={errors} />
						<SourceCard source={form.source} onClear={clearSource} />
						<MessageCard form={form} update={update} />
						<ConsentCard form={form} update={update} errors={errors} />
					</div>

					<div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
						<SummaryCard summary={summary} />
						<PrivacyCard />
						<EmergencyWarningCard urgency={form.urgency} />
					</div>

					<div className="xl:col-span-2">
						<div className="glass-card flex flex-col gap-4 rounded-[2rem] p-6 sm:flex-row sm:items-center sm:justify-between">
							<div className="text-sm text-slate-300">
								{submitError ? (
									<span className="inline-flex items-center gap-2 text-rose-200">
										<AlertTriangle className="h-4 w-4" aria-hidden="true" /> {submitError}
									</span>
								) : (
									<span className="inline-flex items-center gap-2">
										<Lock className="h-4 w-4 text-emerald-300" aria-hidden="true" />
										Information is only shared with authorized parties involved in fulfilling this request.
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
									className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{submitting ? (
										<>
											<LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
											Submitting Request...
										</>
									) : (
										<>
											<Droplets className="h-4 w-4" aria-hidden="true" />
											Submit Blood Request
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
			<span className="text-slate-200" aria-current="page">Request Blood</span>
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

function PageHeader({ apiReady, errorCount }) {
	return (
		<header className="glass-card overflow-hidden rounded-[2rem] p-6 sm:p-8">
			<div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-red-400 to-amber-400" aria-hidden="true" />
			<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Blood request</p>
					<h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Request Blood</h1>
					<p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">Provide the required details so we can help you find the blood you need.</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${apiReady ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-400/30 bg-amber-500/10 text-amber-200'}`}>
						<span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
						{apiReady ? 'API Connected' : 'Local mode (no backend configured)'}
					</span>
					{errorCount > 0 ? (
						<span className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
							<AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> {errorCount} field{errorCount === 1 ? '' : 's'} need attention
						</span>
					) : null}
				</div>
			</div>
		</header>
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

function RequestTypeCard({ value, onChange }) {
	return (
		<Section icon={Users} title="Request from" subtitle="Choose where LifeLink should look first">
			<div className="grid gap-3 sm:grid-cols-3">
				{REQUEST_TYPES.map((opt) => {
					const Icon = opt.icon;
					const active = value === opt.value;
					return (
						<button
							key={opt.value}
							type="button"
							onClick={() => onChange(opt.value)}
							aria-pressed={active}
							className={`flex flex-col items-start gap-2 rounded-2xl border p-5 text-left transition ${active ? 'border-rose-400/40 bg-rose-500/10' : 'border-white/10 bg-slate-950/40 hover:border-white/20'}`}
						>
							<div className="flex items-center gap-2">
								<Icon className="h-5 w-5 text-rose-200" aria-hidden="true" />
								<span className="text-base font-semibold text-white">{opt.label}</span>
							</div>
							<p className="text-sm text-slate-300">{opt.description}</p>
						</button>
					);
				})}
			</div>
		</Section>
	);
}

function BloodRequirementCard({ form, update, errors }) {
	return (
		<Section icon={Droplet} title="Blood requirement" subtitle="Tell us what is needed">
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Blood group" required error={errors.bloodGroup}>
					<select className="field-input" value={form.bloodGroup} onChange={(e) => update('bloodGroup', e.target.value)} aria-invalid={Boolean(errors.bloodGroup)}>
						{BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
					</select>
				</Field>
				<Field label="Units required" required error={errors.unitsRequired}>
					<input className="field-input" type="number" min={1} max={10} value={form.unitsRequired} onChange={(e) => update('unitsRequired', e.target.value)} aria-invalid={Boolean(errors.unitsRequired)} />
				</Field>
			</div>

			<div className="mt-5">
				<p className="mb-2 text-sm font-medium text-slate-200">Urgency<span className="ml-1 text-rose-300">*</span></p>
				<div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Urgency">
					{URGENCIES.map((u) => {
						const active = form.urgency === u.value;
						return (
							<button
								key={u.value}
								type="button"
								role="radio"
								aria-checked={active}
								onClick={() => update('urgency', u.value)}
								className={`flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition ${active ? `${urgencyTone(u.tone)} border-current` : 'border-white/10 bg-slate-950/40 hover:border-white/20'}`}
							>
								<span className="text-sm font-semibold text-white">{u.label}</span>
								<span className="text-xs text-slate-300">{u.description}</span>
							</button>
						);
					})}
				</div>
				{errors.urgency ? <p className="mt-2 text-sm text-rose-200">{errors.urgency}</p> : null}
			</div>

			<div className="mt-5 grid gap-4 sm:grid-cols-2">
				<Field label="Required date" required error={errors.requiredDate}>
					<div className="relative">
						<Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-200" aria-hidden="true" />
						<input className="field-input pl-10" type="date" min={todayDate()} value={form.requiredDate} onChange={(e) => update('requiredDate', e.target.value)} aria-invalid={Boolean(errors.requiredDate)} />
					</div>
				</Field>
				<Field label="Required time" required error={errors.requiredTime}>
					<div className="relative">
						<Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-200" aria-hidden="true" />
						<input className="field-input pl-10" type="time" value={form.requiredTime} onChange={(e) => update('requiredTime', e.target.value)} aria-invalid={Boolean(errors.requiredTime)} />
					</div>
				</Field>
			</div>
		</Section>
	);
}

function PatientInfoCard({ form, update, errors }) {
	return (
		<Section icon={Heart} title="Patient information" subtitle="Only essential, non-sensitive details">
			<div className="grid gap-4 sm:grid-cols-2">
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
				<Field label="Reason for requirement">
					<input className="field-input" value={form.reason} onChange={(e) => update('reason', e.target.value)} placeholder="Surgery, accident, etc." />
				</Field>
			</div>
			<div className="mt-4 grid gap-4 sm:grid-cols-2">
				<Field label="Hospital name" required error={errors.hospitalName} icon={Hospital}>
					<input className="field-input" value={form.hospitalName} onChange={(e) => update('hospitalName', e.target.value)} placeholder="Hospital name" aria-invalid={Boolean(errors.hospitalName)} />
				</Field>
				<Field label="Hospital location" required error={errors.hospitalLocation}>
					<input className="field-input" value={form.hospitalLocation} onChange={(e) => update('hospitalLocation', e.target.value)} placeholder="Street, area" aria-invalid={Boolean(errors.hospitalLocation)} />
				</Field>
			</div>
		</Section>
	);
}

function LocationCard({ form, update, errors, onUseMyLocation, locationStatus }) {
	return (
		<Section
			icon={MapPin}
			title="Location"
			subtitle="Where the blood is needed"
			action={
				<button type="button" onClick={onUseMyLocation} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
					<Navigation2 className="h-4 w-4" aria-hidden="true" /> Use My Location
				</button>
			}
		>
			<div className="grid gap-4 sm:grid-cols-3">
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
		<Section icon={Phone} title="Contact information" subtitle="Used to coordinate the request only">
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Contact name" required error={errors.contactName}>
					<input className="field-input" value={form.contactName} onChange={(e) => update('contactName', e.target.value)} placeholder="Contact name" aria-invalid={Boolean(errors.contactName)} />
				</Field>
				<Field label="Contact phone" required error={errors.contactPhone}>
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

function SourceCard({ source, onClear }) {
	if (!source || !source.id) {
		return (
			<Section icon={Sparkles} title="Selected source" subtitle="Optional — request can be submitted without one">
				<p className="rounded-2xl border border-dashed border-white/15 bg-slate-950/30 px-4 py-6 text-center text-sm text-slate-300">
					You can submit a general request and let LifeLink find the best match, or pick a specific donor/blood bank from the search pages first.
				</p>
				<div className="mt-3 flex flex-wrap gap-3">
					<Link to="/find-donor" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
						<User className="h-4 w-4" aria-hidden="true" /> Choose a Donor
					</Link>
					<Link to="/find-blood" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
						<Building2 className="h-4 w-4" aria-hidden="true" /> Choose a Blood Bank
					</Link>
				</div>
			</Section>
		);
	}
	const isDonor = source.type === 'DONOR';
	return (
		<Section
			icon={isDonor ? User : Building2}
			title={isDonor ? 'Selected donor' : 'Selected blood bank'}
			subtitle="You can change this selection"
			action={
				<div className="flex gap-2">
					<button type="button" onClick={onClear} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10">
						<X className="h-3.5 w-3.5" aria-hidden="true" /> Change
					</button>
				</div>
			}
		>
			<div className="grid gap-3 sm:grid-cols-2">
				<InfoLine label="Name" value={source.name} />
				<InfoLine label="Blood group" value={source.bloodGroup} />
				{isDonor ? (
					<>
						<InfoLine label="Approximate location" value={source.location || '—'} />
						<InfoLine label="Distance" value={source.distanceKm != null ? `${Number(source.distanceKm).toFixed(1)} km` : 'On request'} />
					</>
				) : (
					<>
						<InfoLine label="Location" value={source.location || '—'} />
						<InfoLine label="Available units" value={source.availableUnits != null ? String(source.availableUnits) : 'On request'} />
						<InfoLine label="Distance" value={source.distanceKm != null ? `${Number(source.distanceKm).toFixed(1)} km` : '—'} />
					</>
				)}
			</div>
			{isDonor ? (
				<p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
					<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Private donor contact details are not shown here. They are shared only after consent through the request flow.
				</p>
			) : null}
		</Section>
	);
}

function MessageCard({ form, update }) {
	return (
		<Section icon={MessageSquare} title="Additional message" subtitle="Optional — share context for the donor or blood bank">
			<textarea
				className="field-input min-h-[120px]"
				placeholder="Add any important information related to this request..."
				value={form.message}
				onChange={(e) => update('message', e.target.value)}
			/>
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
				<span>I confirm that the information provided is accurate and I agree to LifeLink's request and privacy policies.</span>
			</label>
			{errors.consent ? <p className="mt-2 text-sm text-rose-200">{errors.consent}</p> : null}
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
				<div className="rounded-2xl bg-white/5 p-3 text-slate-200"><ClipboardList className="h-5 w-5" aria-hidden="true" /></div>
			</div>
			<dl className="mt-6 space-y-3 text-sm">
				{summary.map((row) => (
					<div key={row.label} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
						<dt className="text-slate-400">{row.label}</dt>
						<dd className="text-right font-medium text-white">{row.value}</dd>
					</div>
				))}
			</dl>
			<p className="mt-5 text-xs text-slate-400">You can edit the form on the left at any time. Summary updates live.</p>
		</aside>
	);
}

function PrivacyCard() {
	return (
		<aside className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex items-center gap-3">
				<div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-200"><Lock className="h-5 w-5" aria-hidden="true" /></div>
				<h3 className="text-lg font-semibold text-white">Privacy first</h3>
			</div>
			<p className="mt-3 text-sm leading-7 text-slate-300">Your personal and contact information is shared only with authorized parties involved in fulfilling your request.</p>
		</aside>
	);
}

function EmergencyWarningCard({ urgency }) {
	if (urgency !== 'EMERGENCY') return null;
	return (
		<aside className="glass-card overflow-hidden rounded-[2rem] border-rose-400/30 bg-gradient-to-br from-rose-500/20 via-red-500/10 to-slate-900 p-6 sm:p-8" role="alert">
			<div className="flex items-center gap-3">
				<div className="rounded-2xl bg-rose-500/15 p-3 text-rose-200"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></div>
				<h3 className="text-lg font-semibold text-white">Emergency notice</h3>
			</div>
			<p className="mt-3 text-sm leading-7 text-slate-100">
				For life-threatening emergencies, contact local emergency medical services immediately. LifeLink is a blood-matching platform and does not replace emergency medical care.
			</p>
		</aside>
	);
}

function SuccessScreen({ submission, onDashboard, onTrack }) {
	return (
		<div className="min-h-screen overflow-x-hidden bg-blood-radial text-slate-100">
			<div className="section-shell flex min-h-[80vh] items-center justify-center py-10">
				<div className="glass-card w-full max-w-2xl rounded-[2.5rem] p-8 text-center sm:p-10">
					<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-emerald-500/15 text-emerald-200">
						<CheckCircle2 className="h-10 w-10" aria-hidden="true" />
					</div>
					<h1 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Blood Request Submitted Successfully</h1>
					<p className="mt-3 text-sm leading-7 text-slate-300">Your request is now in the queue. LifeLink will notify matching donors and blood banks.</p>

					<dl className="mt-8 grid gap-3 text-left sm:grid-cols-2">
						<InfoLine label="Request ID" value={submission.id} />
						<InfoLine label="Status" value={statusLabel(submission.status)} />
						<InfoLine label="Blood group" value={submission.bloodGroup} />
						<InfoLine label="Units" value={String(submission.units || 1)} />
						<InfoLine label="Submitted" value={new Date(submission.createdAt).toLocaleString()} />
						<InfoLine label="Expected response" value="Within 15–60 minutes" />
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
	return [
		{ label: 'Request from', value: REQUEST_TYPES.find((r) => r.value === form.requestType)?.label || '—' },
		{ label: 'Blood group', value: form.bloodGroup || '—' },
		{ label: 'Units required', value: form.unitsRequired ? `${form.unitsRequired} unit${Number(form.unitsRequired) > 1 ? 's' : ''}` : '—' },
		{ label: 'Urgency', value: URGENCIES.find((u) => u.value === form.urgency)?.label || '—' },
		{ label: 'Required date', value: form.requiredDate || '—' },
		{ label: 'Required time', value: form.requiredTime || '—' },
		{ label: 'Hospital', value: form.hospitalName || '—' },
		{ label: 'Location', value: [form.area, form.city].filter(Boolean).join(', ') || '—' },
		{ label: 'Request source', value: form.source?.id ? `${form.source.type === 'DONOR' ? 'Donor' : 'Blood bank'}: ${form.source.name}` : 'General search' },
	];
}
