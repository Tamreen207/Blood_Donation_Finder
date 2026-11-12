import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RefreshCw, X, AlertTriangle, ArrowLeft, Building2 } from 'lucide-react';
import DashboardLayout, { bloodBankSidebar } from '../components/DashboardLayout.jsx';
import ProfileOverviewCard from '../components/bloodBank/ProfileOverviewCard.jsx';
import BasicInformationForm from '../components/bloodBank/BasicInformationForm.jsx';
import ContactInformationForm, { isEmail, isPhone, isUrl } from '../components/bloodBank/ContactInformationForm.jsx';
import LocationForm from '../components/bloodBank/LocationForm.jsx';
import OperatingHoursForm, { validateHours } from '../components/bloodBank/OperatingHoursForm.jsx';
import ServicesForm from '../components/bloodBank/ServicesForm.jsx';
import VerificationStatusCard from '../components/bloodBank/VerificationStatusCard.jsx';
import ProfileCompletionCard, { computeProfileCompletion } from '../components/bloodBank/ProfileCompletionCard.jsx';
import UnsavedChangesDialog from '../components/bloodBank/UnsavedChangesDialog.jsx';
import { useToast } from '../components/ToastProvider.jsx';
import {
	fetchMyBankProfile,
	updateMyBankProfile,
	uploadBankLogo,
	deleteBankLogo,
	isBloodBankApiConfigured,
} from '../services/bloodBankProfileService.js';

function readCurrentUser() {
	try { const raw = localStorage.getItem('lifelink_user'); return raw ? JSON.parse(raw) : null; }
	catch (_) { return null; }
}

const SECTION_IDS = {
	'Basic Information': 'section-basic',
	'Contact Information': 'section-contact',
	'Location': 'section-location',
	'Operating Hours': 'section-hours',
	'Services': 'section-services',
	'Verification': 'section-verification',
};

function safeEqual(a, b) {
	try { return JSON.stringify(a || {}) === JSON.stringify(b || {}); } catch (_) { return false; }
}

function ForbiddenState() {
	return (
		<div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-8 text-center">
			<h2 className="text-lg font-semibold text-slate-900">Blood Bank access required</h2>
			<p className="mt-1 text-sm text-slate-600">This page is only available to blood bank accounts.</p>
		</div>
	);
}

function ErrorState({ onRetry }) {
	return (
		<div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-8 text-center">
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
				<AlertTriangle className="h-6 w-6" aria-hidden="true" />
			</div>
			<h2 className="mt-3 text-lg font-semibold text-slate-900">Unable to load blood bank profile</h2>
			<p className="mt-1 text-sm text-slate-600">Please try again.</p>
			<button type="button" onClick={onRetry} className="mt-4 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Retry</button>
		</div>
	);
}

function ProfileSkeleton() {
	return (
		<div className="space-y-4">
			<div className="h-32 w-full animate-pulse rounded-2xl bg-slate-200/70" />
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<div className="h-64 animate-pulse rounded-2xl bg-slate-200/70 md:col-span-2" />
				<div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
			</div>
			<div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
		</div>
	);
}

export default function BloodBankProfile() {
	const navigate = useNavigate();
	const { toast } = useToast();
	const [user, setUser] = useState(() => readCurrentUser());
	const [authChecked, setAuthChecked] = useState(false);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState(null);
	const [profile, setProfile] = useState(null);
	const [form, setForm] = useState(null);
	const [busy, setBusy] = useState(false);
	const [logoBusy, setLogoBusy] = useState(false);
	const [confirmLeave, setConfirmLeave] = useState(false);
	const [confirmCancel, setConfirmCancel] = useState(false);
	const pendingNavRef = useRef(null);
	const configured = isBloodBankApiConfigured();

	const role = user?.role;
	const isBloodBank = role === 'bloodbank' || role === 'blood_bank';

	const completion = useMemo(() => computeProfileCompletion(profile), [profile]);
	const isDirty = useMemo(() => !safeEqual(form, profile), [form, profile]);

	const sectionRefs = {
		'section-basic': useRef(null),
		'section-contact': useRef(null),
		'section-location': useRef(null),
		'section-hours': useRef(null),
		'section-services': useRef(null),
		'section-verification': useRef(null),
	};

	const load = useCallback(async ({ silent = false } = {}) => {
		if (!isBloodBank) return;
		if (silent) setRefreshing(true); else setLoading(true);
		setError(null);
		try {
			if (!configured) { setProfile(null); setForm(null); return; }
			const res = await fetchMyBankProfile();
			const data = res?.data || res;
			setProfile(data);
			setForm(data);
		} catch (e) {
			setError(e?.message || 'Failed to load profile');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, [configured, isBloodBank]);

	useEffect(() => { setUser(readCurrentUser()); setAuthChecked(true); }, []);

	useEffect(() => {
		if (!authChecked) return;
		if (!user) { navigate('/login', { replace: true }); return; }
		if (user.role && !isBloodBank && user.role !== 'admin') return;
		load();
	}, [authChecked, user, isBloodBank, load, navigate]);

	// Unsaved-changes guard
	useEffect(() => {
		function beforeUnload(e) {
			if (isDirty) { e.preventDefault(); e.returnValue = ''; }
		}
		window.addEventListener('beforeunload', beforeUnload);
		return () => window.removeEventListener('beforeunload', beforeUnload);
	}, [isDirty]);

	function validate() {
		const errs = {};
		if (!form?.name || !String(form.name).trim()) errs.name = 'Name is required';
		if (form?.email && !isEmail(form.email)) errs.email = 'Enter a valid email address';
		if (form?.phone && !isPhone(form.phone)) errs.phone = 'Enter a valid phone number';
		if (form?.emergencyPhone && !isPhone(form.emergencyPhone)) errs.emergencyPhone = 'Enter a valid phone number';
		if (form?.website && !isUrl(form.website)) errs.website = 'Enter a valid URL (https://...)';
		if (!form?.city || !String(form.city).trim()) errs.city = 'City is required';
		const hourErrs = validateHours(form?.hoursByDay);
		if (Object.keys(hourErrs).length) errs.hours = hourErrs;
		return errs;
	}

	async function save() {
		const errs = validate();
		if (Object.keys(errs).length) {
			setError('Please fix the highlighted fields');
			const firstKey = Object.keys(errs)[0];
			const id = firstKey === 'hours' ? 'section-hours' : `section-${firstKey === 'name' ? 'basic' : firstKey === 'phone' || firstKey === 'email' || firstKey === 'website' || firstKey === 'emergencyPhone' ? 'contact' : firstKey === 'city' ? 'location' : 'basic'}`;
			const ref = sectionRefs[id]?.current;
			if (ref && ref.scrollIntoView) ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
			return;
		}
		setBusy(true);
		try {
			const payload = {
				name: form.name,
				registrationNumber: form.registrationNumber,
				bloodBankType: form.bloodBankType,
				description: form.description,
				establishedYear: form.establishedYear,
				phone: form.phone,
				email: form.email,
				website: form.website,
				emergencyPhone: form.emergencyPhone,
				address: form.address,
				city: form.city,
				district: form.district,
				state: form.state,
				postalCode: form.postalCode,
				country: form.country,
				latitude: form.latitude,
				longitude: form.longitude,
				hoursByDay: form.hoursByDay,
				services: form.services,
				components: form.components,
				emergencySupport: form.emergencySupport,
				emergencyHours: form.emergencyHours,
			};
			const res = await updateMyBankProfile(payload);
			const data = res?.data || res;
			setProfile(data);
			setForm(data);
			toast('Profile updated successfully', 'success');
		} catch (e) {
			toast(e?.message || 'Unable to save changes. Please try again.', 'error');
		} finally {
			setBusy(false);
		}
	}

	function tryCancel() {
		if (!isDirty) return;
		setConfirmCancel(true);
	}

	function doCancel() {
		setForm(profile);
		setConfirmCancel(false);
		toast('Changes discarded', 'info');
	}

	async function handleUploadLogo(file) {
		setLogoBusy(true);
		try {
			const res = await uploadBankLogo(file);
			const data = res?.data || res;
			const next = { ...(profile || {}), logoUrl: data?.logoUrl || data?.url || '' };
			setProfile(next);
			setForm(next);
			toast('Logo updated', 'success');
		} catch (e) {
			toast(e?.message || 'Logo upload failed', 'error');
		} finally { setLogoBusy(false); }
	}

	async function handleRemoveLogo() {
		setLogoBusy(true);
		try {
			await deleteBankLogo();
			const next = { ...(profile || {}), logoUrl: '' };
			setProfile(next);
			setForm(next);
			toast('Logo removed', 'success');
		} catch (e) {
			toast(e?.message || 'Could not remove logo', 'error');
		} finally { setLogoBusy(false); }
	}

	function jumpToSection(name) {
		const id = SECTION_IDS[name];
		if (!id) return;
		const el = document.getElementById(id);
		if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	if (!authChecked) {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Bank Profile" pageSubtitle="Manage your blood bank's official information and contact details.">
				<ProfileSkeleton />
			</DashboardLayout>
		);
	}
	if (!user) {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Bank Profile" pageSubtitle="Manage your blood bank's official information and contact details.">
				<ForbiddenState />
			</DashboardLayout>
		);
	}
	if (user.role && !isBloodBank && user.role !== 'admin') {
		return (
			<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Bank Profile" pageSubtitle="Manage your blood bank's official information and contact details.">
				<ForbiddenState />
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout user={user} items={bloodBankSidebar} pageTitle="Blood Bank Profile" pageSubtitle="Manage your blood bank's official information and contact details.">
			<div className="space-y-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<button type="button" onClick={() => navigate('/blood-bank/dashboard')} className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900">
							<ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Dashboard
						</button>
						<p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Blood Bank Operations</p>
						<h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Blood Bank Profile</h1>
						<p className="text-sm text-slate-600">Manage your blood bank's official information and contact details.</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<button type="button" onClick={() => load({ silent: true })} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60">
							<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" /> {refreshing ? 'Refreshing…' : 'Refresh'}
						</button>
						<button type="button" onClick={tryCancel} disabled={busy || !isDirty} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
							<X className="h-4 w-4" aria-hidden="true" /> Cancel
						</button>
						<button type="button" onClick={save} disabled={busy || !isDirty} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
							<Save className="h-4 w-4" aria-hidden="true" /> {busy ? 'Saving…' : 'Save Changes'}
						</button>
					</div>
				</div>

				{loading ? (
					<ProfileSkeleton />
				) : error ? (
					<ErrorState onRetry={() => load()} />
				) : !profile ? (
					<div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
						<Building2 className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
						<p className="mt-2 text-sm text-slate-600">No blood bank profile found yet.</p>
					</div>
				) : (
					<>
						<ProfileOverviewCard profile={profile} completion={completion.percent} onUploadLogo={handleUploadLogo} onRemoveLogo={handleRemoveLogo} busy={logoBusy} />
						<div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
							<div className="space-y-5">
								<div ref={sectionRefs['section-basic']} id="section-basic"><BasicInformationForm value={form} onChange={setForm} errors={null} /></div>
								<div ref={sectionRefs['section-contact']} id="section-contact"><ContactInformationForm value={form} onChange={setForm} errors={null} /></div>
								<div ref={sectionRefs['section-location']} id="section-location"><LocationForm value={form} onChange={setForm} errors={null} /></div>
								<div ref={sectionRefs['section-hours']} id="section-hours"><OperatingHoursForm value={form?.hoursByDay} onChange={(hours) => setForm((f) => ({ ...f, hoursByDay: hours }))} errors={null} /></div>
								<div ref={sectionRefs['section-services']} id="section-services"><ServicesForm value={form} onChange={setForm} /></div>
								<div ref={sectionRefs['section-verification']} id="section-verification"><VerificationStatusCard verification={profile.verification} documents={profile.documents} /></div>
							</div>
							<div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
								<ProfileCompletionCard completion={completion} onJump={jumpToSection} />
								<div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
									<h3 className="mb-1 text-sm font-semibold text-slate-800">Inventory & stock</h3>
									<p>Live blood stock is managed in the Inventory page, not here.</p>
									<button type="button" onClick={() => navigate('/blood-bank/inventory')} className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Open Inventory</button>
								</div>
							</div>
						</div>
					</>
				)}
			</div>

			<UnsavedChangesDialog open={confirmLeave} onStay={() => { setConfirmLeave(false); pendingNavRef.current = null; }} onLeave={() => {
				setConfirmLeave(false);
				if (pendingNavRef.current) { const fn = pendingNavRef.current; pendingNavRef.current = null; fn(); }
			}} />

			{confirmCancel ? (
				<div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
					<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
						<h3 id="cancel-title" className="text-lg font-semibold text-slate-900">Discard changes?</h3>
						<p className="mt-1 text-sm text-slate-600">Your unsaved changes will be lost.</p>
						<div className="mt-5 flex flex-wrap justify-end gap-2">
							<button type="button" onClick={() => setConfirmCancel(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Keep Editing</button>
							<button type="button" onClick={doCancel} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700">Discard</button>
						</div>
					</div>
				</div>
			) : null}
		</DashboardLayout>
	);
}
