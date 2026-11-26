import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	AlertTriangle,
	Bell,
	BellOff,
	Building2,
	Calendar,
	CalendarClock,
	Camera,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	CircleDot,
	Droplet,
	HeartHandshake,
	Hospital,
	LoaderCircle,
	Lock,
	MapPin,
	Pencil,
	Phone,
	Save,
	ShieldCheck,
	Siren,
	Trash2,
	Upload,
	User,
	UserCheck,
	X,
} from 'lucide-react';
import DashboardLayout, { donorSidebar } from '../components/DashboardLayout';
import { useToast } from '../components/ToastProvider';
import { useNotificationCount } from '../services/notificationCount';
import {
	deleteAccount,
	deleteProfilePhoto,
	fetchMyProfile,
	isProfileApiConfigured,
	updateDonorStatus,
	updateMyProfile,
	updatePreferences,
	uploadProfilePhoto,
} from '../services/profileService';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RADIUS_OPTIONS = ['5 km', '10 km', '25 km', '50 km', '100 km'];
const GENDERS = [
	{ value: 'male', label: 'Male' },
	{ value: 'female', label: 'Female' },
	{ value: 'other', label: 'Other' },
];
const AVAILABILITY_OPTIONS = [
	{ value: 'AVAILABLE', label: 'Available', description: 'Open to donation requests' },
	{ value: 'TEMPORARILY_UNAVAILABLE', label: 'Temporarily Unavailable', description: 'Paused for a short period' },
	{ value: 'NOT_AVAILABLE', label: 'Not Available', description: 'Not currently donating' },
];
const PREFERENCE_KEYS = [
	{ key: 'email', label: 'Email notifications', description: 'Important updates by email' },
	{ key: 'sms', label: 'SMS notifications', description: 'Text messages to your phone' },
	{ key: 'push', label: 'Push notifications', description: 'In-app and browser notifications' },
	{ key: 'requests', label: 'Blood request alerts', description: 'When a matching request is created' },
	{ key: 'emergency', label: 'Emergency alerts', description: 'Critical and time-sensitive requests' },
	{ key: 'reminders', label: 'Donation reminders', description: 'Scheduled appointment reminders' },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[+\d][\d\s-]{6,20}$/;

function readUser() {
	try {
		const raw = localStorage.getItem('lifelink_user');
		return raw ? JSON.parse(raw) : null;
	} catch (_) {
		return null;
	}
}

function buildDemoProfile() {
	return {
		_id: 'USR-DEMO-1',
		name: 'Demo User',
		email: 'demo.user@lifelink.org',
		phone: '+1 555 014 0000',
		role: 'donor',
		isActive: true,
		isVerified: true,
		emailVerified: true,
		phoneVerified: false,
		createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
		updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
		photoUrl: '',
		dateOfBirth: '1998-04-12',
		gender: 'male',
		city: 'Anantapur',
		state: 'Andhra Pradesh',
		country: 'India',
		radius: '10 km',
		donor: {
			bloodGroup: 'O+',
			availability: 'AVAILABLE',
			isAvailable: true,
			lastDonationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
			totalDonations: 4,
			preferredLocation: 'City Central Blood Bank',
			isVerified: true,
		},
		preferences: {
			email: true,
			sms: false,
			push: true,
			requests: true,
			emergency: true,
			reminders: true,
		},
	};
}

function normalizeProfile(raw) {
	if (!raw) return null;
	return {
		id: raw._id || raw.id,
		name: raw.name || 'User',
		email: raw.email || '',
		phone: raw.phone || '',
		role: raw.role || 'donor',
		isActive: raw.isActive !== false,
		isVerified: Boolean(raw.isVerified),
		emailVerified: Boolean(raw.emailVerified ?? raw.isVerified),
		phoneVerified: Boolean(raw.phoneVerified),
		createdAt: raw.createdAt,
		updatedAt: raw.updatedAt,
		photoUrl: raw.photoUrl || '',
		dateOfBirth: raw.dateOfBirth || '',
		gender: raw.gender || '',
		city: raw.city || '',
		state: raw.state || '',
		country: raw.country || '',
		radius: raw.radius || '10 km',
		donor: raw.donor || null,
		preferences: raw.preferences || { email: true, sms: false, push: true, requests: true, emergency: true, reminders: true },
	};
}

function computeCompletion(profile) {
	if (!profile) return { percent: 0, items: [] };
	const checks = [
		{ key: 'photo', label: 'Add profile photo', done: Boolean(profile.photoUrl) },
		{ key: 'phone', label: 'Add phone number', done: Boolean(profile.phone) },
		{ key: 'phoneVerified', label: 'Verify phone', done: Boolean(profile.phoneVerified) },
		{ key: 'city', label: 'Add city', done: Boolean(profile.city) },
		{ key: 'country', label: 'Add country', done: Boolean(profile.country) },
		{ key: 'bloodGroup', label: 'Add blood group', done: Boolean(profile.donor?.bloodGroup) },
		{ key: 'availability', label: 'Enable donor availability', done: Boolean(profile.donor?.isAvailable) },
	];
	const total = checks.length;
	const done = checks.filter((c) => c.done).length;
	return { percent: Math.round((done / total) * 100), items: checks.filter((c) => !c.done) };
}

export default function UserProfilePage() {
	const navigate = useNavigate();
	const { toast } = useToast();
	const unreadBell = useNotificationCount();
	const [user, setUser] = useState(() => readUser() || { name: 'User', role: 'donor' });
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(null);
	const [saving, setSaving] = useState(false);
	const [validationErrors, setValidationErrors] = useState({});
	const [photoUploading, setPhotoUploading] = useState(false);
	const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
	const [pendingNavigation, setPendingNavigation] = useState(null);
	const fileInputRef = useRef(null);
	const apiReady = isProfileApiConfigured();

	const completion = useMemo(() => computeCompletion(profile), [profile]);

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function load() {
		setLoading(true);
		setError('');
		try {
			if (apiReady) {
				const res = await fetchMyProfile();
				if (res?.data) setProfile(normalizeProfile(res.data));
				else setProfile(normalizeProfile(buildDemoProfile()));
			} else {
				setProfile(normalizeProfile(buildDemoProfile()));
			}
		} catch (_) {
			setProfile(normalizeProfile(buildDemoProfile()));
		} finally {
			setLoading(false);
		}
	}

	function startEditing() {
		setDraft({ ...profile, donor: { ...(profile.donor || {}), preferences: undefined }, preferences: { ...(profile.preferences || {}) } });
		setValidationErrors({});
		setEditing(true);
	}

	function cancelEditing() {
		if (hasChanges()) {
			setShowUnsavedConfirm(true);
			return;
		}
		setEditing(false);
		setDraft(null);
		setValidationErrors({});
	}

	function hasChanges() {
		if (!draft || !profile) return false;
		return JSON.stringify(serializeForCompare(draft)) !== JSON.stringify(serializeForCompare(profile));
	}

	function serializeForCompare(p) {
		if (!p) return null;
		return {
			name: p.name, email: p.email, phone: p.phone, dateOfBirth: p.dateOfBirth, gender: p.gender,
			city: p.city, state: p.state, country: p.country, radius: p.radius,
			donor: p.donor ? { bloodGroup: p.donor.bloodGroup, availability: p.donor.availability, preferredLocation: p.donor.preferredLocation, isAvailable: p.donor.isAvailable } : null,
			preferences: p.preferences,
		};
	}

	function updateDraft(key, value) {
		setDraft((current) => ({ ...current, [key]: value }));
		setValidationErrors((current) => {
			if (!current[key]) return current;
			const next = { ...current };
			delete next[key];
			return next;
		});
	}

	function updateDonor(key, value) {
		setDraft((current) => ({ ...current, donor: { ...(current.donor || {}), [key]: value } }));
	}

	function updatePreference(key, value) {
		setDraft((current) => ({ ...current, preferences: { ...(current.preferences || {}), [key]: value } }));
	}

	function validate(d) {
		const errors = {};
		if (!d.name || String(d.name).trim().length < 2) errors.name = 'Full name is required';
		if (!emailRegex.test(d.email || '')) errors.email = 'Enter a valid email';
		if (d.phone && !phoneRegex.test(d.phone)) errors.phone = 'Enter a valid phone number';
		if (d.donor && !BLOOD_GROUPS.includes(d.donor.bloodGroup)) errors.bloodGroup = 'Select a valid blood group';
		return errors;
	}

	async function save() {
		const errors = validate(draft);
		setValidationErrors(errors);
		if (Object.keys(errors).length) return;
		setSaving(true);
		try {
			const payload = {
				name: draft.name,
				email: draft.email,
				phone: draft.phone,
				dateOfBirth: draft.dateOfBirth || undefined,
				gender: draft.gender || undefined,
				city: draft.city,
				state: draft.state,
				country: draft.country,
				radius: draft.radius,
				donor: {
					bloodGroup: draft.donor?.bloodGroup,
					availability: draft.donor?.availability,
					isAvailable: draft.donor?.isAvailable,
					preferredLocation: draft.donor?.preferredLocation,
				},
				preferences: draft.preferences,
			};
			if (apiReady) await updateMyProfile(payload);
			setProfile({ ...profile, ...draft });
			setEditing(false);
			setDraft(null);
			toast('Profile updated successfully.', 'success');
		} catch (_) {
			toast('Unable to update profile. Please check your information and try again.', 'error');
		} finally {
			setSaving(false);
		}
	}

	async function handleToggleAvailability(next) {
		const previous = profile;
		setProfile({ ...profile, donor: { ...(profile.donor || {}), isAvailable: next } });
		try {
			if (apiReady) await updateDonorStatus({ isAvailable: next });
			toast(next ? 'You are now available for blood requests.' : 'You are now hidden from donor matching.', 'success');
		} catch (_) {
			setProfile(previous);
			toast('Could not update availability.', 'error');
		}
	}

	async function handleTogglePreference(key, next) {
		const previous = profile.preferences?.[key];
		setProfile({ ...profile, preferences: { ...(profile.preferences || {}), [key]: next } });
		try {
			if (apiReady) await updatePreferences({ [key]: next });
		} catch (_) {
			setProfile({ ...profile, preferences: { ...(profile.preferences || {}), [key]: previous } });
			toast('Could not update preferences.', 'error');
		}
	}

	async function handlePhotoChange(e) {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
			toast('Only JPG, PNG, or WebP images are supported.', 'error');
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast('Image must be smaller than 5MB.', 'error');
			return;
		}
		setPhotoUploading(true);
		try {
			const res = await uploadProfilePhoto(file);
			const url = res?.data?.photoUrl || URL.createObjectURL(file);
			setProfile({ ...profile, photoUrl: url });
			toast('Profile photo updated.', 'success');
		} catch (_) {
			toast('Could not upload photo.', 'error');
		} finally {
			setPhotoUploading(false);
			if (fileInputRef.current) fileInputRef.current.value = '';
		}
	}

	async function handlePhotoRemove() {
		setProfile({ ...profile, photoUrl: '' });
		try {
			if (apiReady) await deleteProfilePhoto();
			toast('Profile photo removed.', 'success');
		} catch (_) {
			toast('Could not remove photo.', 'error');
		}
	}

	async function handleDeleteAccount() {
		setDeleting(true);
		try {
			if (apiReady) await deleteAccount();
			try {
				localStorage.removeItem('lifelink_token');
				localStorage.removeItem('lifelink_user');
			} catch (_) {}
			toast('Account deletion request submitted.', 'success');
			setDeleteAccountOpen(false);
			navigate('/login');
		} catch (_) {
			toast('Could not delete account right now.', 'error');
		} finally {
			setDeleting(false);
		}
	}

	const headerPrimary = editing ? (
		<div className="flex flex-wrap items-center gap-2">
			<button type="button" onClick={cancelEditing} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
				<X className="h-4 w-4" aria-hidden="true" /> Cancel
			</button>
			<button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
				{saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
				{saving ? 'Saving...' : 'Save Changes'}
			</button>
		</div>
	) : (
		<button type="button" onClick={startEditing} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:-translate-y-0.5">
			<Pencil className="h-4 w-4" aria-hidden="true" /> Edit Profile
		</button>
	);

	return (
		<DashboardLayout
			user={user}
			items={donorSidebar}
			pageTitle="My Profile"
			pageSubtitle="Manage your personal information and donor profile."
			primaryAction={headerPrimary}
			unreadNotifications={unreadBell}
		>
			{loading ? (
				<ProfileSkeleton />
			) : error ? (
				<ErrorState onRetry={load} />
			) : !profile ? (
				<ErrorState onRetry={load} />
			) : (
				<div className="space-y-6">
					<ProfileHeader
						profile={profile}
						editing={editing}
						onUploadClick={() => fileInputRef.current?.click()}
						onRemovePhoto={handlePhotoRemove}
						uploading={photoUploading}
						fileInputRef={fileInputRef}
						onPhotoChange={handlePhotoChange}
					/>

					<ProfileCompletion completion={completion} />

					<div className="grid gap-6 xl:grid-cols-2">
						<PersonalInformation profile={profile} draft={draft} editing={editing} updateDraft={updateDraft} errors={validationErrors} />
						<DonorInformation profile={profile} draft={draft} editing={editing} updateDonor={updateDonor} errors={validationErrors} onToggle={handleToggleAvailability} />
					</div>

					<div className="grid gap-6 xl:grid-cols-2">
						<LocationPreferences profile={profile} draft={draft} editing={editing} updateDraft={updateDraft} />
						<ContactPreferences profile={profile} onToggle={handleTogglePreference} />
					</div>

					<AccountInformation profile={profile} />

					<PrivacySection />

					<section className="glass-card rounded-[2rem] border border-rose-400/30 bg-gradient-to-br from-rose-500/10 via-red-500/5 to-slate-900 p-6 sm:p-8">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<div className="flex items-center gap-2">
									<AlertTriangle className="h-5 w-5 text-rose-200" aria-hidden="true" />
									<h2 className="text-xl font-semibold text-white">Delete Account</h2>
								</div>
								<p className="mt-2 text-sm text-slate-300">Permanently delete your LifeLink account and associated profile data.</p>
							</div>
							<button type="button" onClick={() => setDeleteAccountOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/15 px-5 py-3 text-sm font-semibold text-rose-200 hover:bg-rose-500/25">
								<Trash2 className="h-4 w-4" aria-hidden="true" /> Delete Account
							</button>
						</div>
					</section>
				</div>
			)}

			{deleteAccountOpen ? (
				<DeleteAccountDialog onCancel={() => setDeleteAccountOpen(false)} onConfirm={handleDeleteAccount} loading={deleting} />
			) : null}

			{showUnsavedConfirm ? (
				<UnsavedChangesDialog
					onKeepEditing={() => setShowUnsavedConfirm(false)}
					onDiscard={() => {
						setShowUnsavedConfirm(false);
						setEditing(false);
						setDraft(null);
						setValidationErrors({});
						if (pendingNavigation) {
							const target = pendingNavigation;
							setPendingNavigation(null);
							navigate(target);
						}
					}}
				/>
			) : null}
		</DashboardLayout>
	);
}

function ProfileHeader({ profile, editing, onUploadClick, onRemovePhoto, uploading, fileInputRef, onPhotoChange }) {
	const initials = (profile.name || 'U').split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
	return (
		<section className="glass-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
			<div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-red-400 to-amber-400" aria-hidden="true" />
			<div className="flex flex-col gap-6 md:flex-row md:items-center">
				<div className="relative">
					{profile.photoUrl ? (
						<img src={profile.photoUrl} alt="Profile" className="h-24 w-24 rounded-3xl object-cover shadow-lg shadow-rose-500/30" />
					) : (
						<div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 text-2xl font-bold text-white shadow-lg shadow-rose-500/30" aria-hidden="true">
							{initials || 'U'}
						</div>
					)}
					<button type="button" onClick={onUploadClick} className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-950 bg-white text-slate-950 shadow" aria-label="Change profile photo">
						{uploading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4" aria-hidden="true" />}
					</button>
					<input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={onPhotoChange} />
				</div>
				<div className="flex-1">
					<h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{profile.name || 'User'}</h1>
					<p className="mt-1 text-sm text-slate-300">{profile.email}</p>
					<div className="mt-4 flex flex-wrap items-center gap-2">
						<span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
							<UserCheck className="h-3.5 w-3.5 text-rose-200" aria-hidden="true" /> {roleLabel(profile.role)}
						</span>
						{profile.donor?.bloodGroup ? (
							<span className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-100">
								<Droplet className="h-3.5 w-3.5" aria-hidden="true" /> {profile.donor.bloodGroup}
							</span>
						) : null}
						{profile.isVerified ? (
							<span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
								<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Verified Account
							</span>
						) : (
							<span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
								<AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Unverified
							</span>
						)}
					</div>
					<div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
						{profile.phone ? <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-rose-200" aria-hidden="true" /> {profile.phone}</span> : null}
						{profile.city ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-rose-200" aria-hidden="true" /> {profile.city}{profile.country ? `, ${profile.country}` : ''}</span> : null}
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
					<button type="button" onClick={onUploadClick} disabled={uploading} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60">
						<Upload className="h-4 w-4" aria-hidden="true" /> Change Photo
					</button>
					{profile.photoUrl ? (
						<button type="button" onClick={onRemovePhoto} className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20">
							<Trash2 className="h-4 w-4" aria-hidden="true" /> Remove Photo
						</button>
					) : null}
				</div>
			</div>
		</section>
	);
}

function ProfileCompletion({ completion }) {
	const percent = completion?.percent ?? 0;
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Profile</p>
					<h2 className="mt-1 text-2xl font-semibold text-white">Profile Completion</h2>
				</div>
				<p className="text-3xl font-semibold text-white">{percent}%</p>
			</div>
			<div className="mt-4 h-3 rounded-full bg-white/10">
				<div className="h-3 rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all" style={{ width: `${percent}%` }} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} role="progressbar" />
			</div>
			{completion.items?.length ? (
				<div className="mt-5">
					<p className="text-sm font-medium text-slate-200">Next steps</p>
					<ul className="mt-3 grid gap-2 sm:grid-cols-2">
						{completion.items.map((item) => (
							<li key={item.key} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
								<CircleDot className="h-4 w-4 text-rose-200" aria-hidden="true" /> {item.label}
							</li>
						))}
					</ul>
				</div>
			) : (
				<p className="mt-4 text-sm text-emerald-200">All key information complete. Great job!</p>
			)}
		</section>
	);
}

function PersonalInformation({ profile, draft, editing, updateDraft, errors }) {
	const value = editing ? draft : profile;
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<SectionHeader icon={User} title="Personal Information" subtitle="Name, contact, and basic details" />
			<div className="mt-6 grid gap-4 sm:grid-cols-2">
				<Field label="Full name" required error={errors.name}>
					{editing ? (
						<input className="field-input" value={value.name || ''} onChange={(e) => updateDraft('name', e.target.value)} aria-invalid={Boolean(errors.name)} />
					) : (
						<ReadOnlyLine value={value.name} />
					)}
				</Field>
				<Field label="Email address" required error={errors.email}>
					{editing ? (
						<input className="field-input" type="email" value={value.email || ''} onChange={(e) => updateDraft('email', e.target.value)} aria-invalid={Boolean(errors.email)} />
					) : (
						<div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
							<span className="text-sm text-white">{value.email || '—'}</span>
							{profile.emailVerified ? (
								<span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">Verified</span>
							) : (
								<span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">Not Verified</span>
							)}
						</div>
					)}
				</Field>
				<Field label="Phone number" error={errors.phone}>
					{editing ? (
						<input className="field-input" value={value.phone || ''} onChange={(e) => updateDraft('phone', e.target.value)} aria-invalid={Boolean(errors.phone)} />
					) : (
						<div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
							<span className="text-sm text-white">{value.phone || '—'}</span>
							{profile.phoneVerified ? (
								<span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">Verified</span>
							) : profile.phone ? (
								<span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">Not Verified</span>
							) : null}
						</div>
					)}
				</Field>
				<Field label="Date of birth">
					{editing ? (
						<input className="field-input" type="date" value={value.dateOfBirth || ''} onChange={(e) => updateDraft('dateOfBirth', e.target.value)} />
					) : (
						<ReadOnlyLine value={value.dateOfBirth ? new Date(value.dateOfBirth).toLocaleDateString() : '—'} />
					)}
				</Field>
				<Field label="Gender">
					{editing ? (
						<select className="field-input" value={value.gender || ''} onChange={(e) => updateDraft('gender', e.target.value)}>
							<option value="">Select gender</option>
							{GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
						</select>
					) : (
						<ReadOnlyLine value={GENDERS.find((g) => g.value === value.gender)?.label || '—'} />
					)}
				</Field>
				<Field label="City">
					{editing ? <input className="field-input" value={value.city || ''} onChange={(e) => updateDraft('city', e.target.value)} /> : <ReadOnlyLine value={value.city} />}
				</Field>
				<Field label="State">
					{editing ? <input className="field-input" value={value.state || ''} onChange={(e) => updateDraft('state', e.target.value)} /> : <ReadOnlyLine value={value.state} />}
				</Field>
				<Field label="Country">
					{editing ? <input className="field-input" value={value.country || ''} onChange={(e) => updateDraft('country', e.target.value)} /> : <ReadOnlyLine value={value.country} />}
				</Field>
			</div>
		</section>
	);
}

function DonorInformation({ profile, draft, editing, updateDonor, errors, onToggle }) {
	const value = editing ? draft?.donor : profile.donor;
	const isAvailable = editing ? Boolean(draft?.donor?.isAvailable) : Boolean(profile.donor?.isAvailable);
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<SectionHeader icon={HeartHandshake} title="Donor Information" subtitle="Blood group, donations, and availability" />
			<div className="mt-6 grid gap-4 sm:grid-cols-2">
				<Field label="Blood group" required error={errors.bloodGroup}>
					{editing ? (
						<select className="field-input" value={draft?.donor?.bloodGroup || ''} onChange={(e) => updateDonor('bloodGroup', e.target.value)} aria-invalid={Boolean(errors.bloodGroup)}>
							<option value="">Select blood group</option>
							{BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
						</select>
					) : (
						<ReadOnlyLine value={value?.bloodGroup} />
					)}
				</Field>
				<Field label="Donor status">
					{editing ? (
						<select className="field-input" value={draft?.donor?.availability || ''} onChange={(e) => updateDonor('availability', e.target.value)}>
							<option value="">Select status</option>
							{AVAILABILITY_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
						</select>
					) : (
						<ReadOnlyLine value={AVAILABILITY_OPTIONS.find((o) => o.value === value?.availability)?.label || '—'} />
					)}
				</Field>
				<Field label="Last donation">
					<ReadOnlyLine value={value?.lastDonationDate ? new Date(value.lastDonationDate).toLocaleDateString() : '—'} />
				</Field>
				<Field label="Donation count">
					<ReadOnlyLine value={value?.totalDonations != null ? `${value.totalDonations} donation${value.totalDonations === 1 ? '' : 's'}` : '—'} />
				</Field>
				<Field label="Preferred donation location">
					{editing ? (
						<input className="field-input" value={draft?.donor?.preferredLocation || ''} onChange={(e) => updateDonor('preferredLocation', e.target.value)} placeholder="e.g. City Central Blood Bank" />
					) : (
						<ReadOnlyLine value={value?.preferredLocation} />
					)}
				</Field>
				<Field label="Donor verification">
					{value?.isVerified ? (
						<span className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
							<ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified Donor
						</span>
					) : (
						<span className="inline-flex items-center gap-2 self-start rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
							<AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Verification pending
						</span>
					)}
				</Field>
			</div>

			<div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
				<div className="flex items-center justify-between gap-3">
					<div>
						<p className="text-sm font-semibold text-white">Available for blood requests</p>
						<p className="text-xs text-slate-400">Allow LifeLink to consider you when matching nearby blood requests.</p>
					</div>
					<Switch
						checked={isAvailable}
						disabled={editing}
						onChange={(v) => !editing && onToggle(v)}
						label="Toggle donor availability"
					/>
				</div>
				<p className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-100">
					<Lock className="h-3.5 w-3.5" aria-hidden="true" /> Your exact home address and private contact information will not be shown publicly.
				</p>
			</div>

			<p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
				<AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Application eligibility here does not equal medical eligibility. Final donation eligibility is determined by qualified blood-bank or medical staff.
			</p>
		</section>
	);
}

function LocationPreferences({ profile, draft, editing, updateDraft }) {
	const value = editing ? draft : profile;
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<SectionHeader icon={MapPin} title="Location Preferences" subtitle="Used only for matching and discovery" />
			<div className="mt-6 grid gap-4 sm:grid-cols-2">
				<Field label="City">
					{editing ? <input className="field-input" value={value.city || ''} onChange={(e) => updateDraft('city', e.target.value)} /> : <ReadOnlyLine value={value.city} />}
				</Field>
				<Field label="State">
					{editing ? <input className="field-input" value={value.state || ''} onChange={(e) => updateDraft('state', e.target.value)} /> : <ReadOnlyLine value={value.state} />}
				</Field>
				<Field label="Country">
					{editing ? <input className="field-input" value={value.country || ''} onChange={(e) => updateDraft('country', e.target.value)} /> : <ReadOnlyLine value={value.country} />}
				</Field>
				<Field label="Preferred search radius">
					{editing ? (
						<select className="field-input" value={value.radius || '10 km'} onChange={(e) => updateDraft('radius', e.target.value)}>
							{RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
						</select>
					) : (
						<ReadOnlyLine value={value.radius || '10 km'} />
					)}
				</Field>
			</div>
			<p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
				<Lock className="h-3.5 w-3.5" aria-hidden="true" /> Exact residential address is never displayed publicly. Matching uses approximate area.
			</p>
		</section>
	);
}

function ContactPreferences({ profile, onToggle }) {
	const prefs = profile.preferences || {};
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<SectionHeader icon={Bell} title="Contact Preferences" subtitle="Choose how LifeLink may notify you" />
			<div className="mt-6 space-y-3">
				{PREFERENCE_KEYS.map((opt) => {
					const enabled = Boolean(prefs[opt.key]);
					const isEmergency = opt.key === 'emergency';
					return (
						<div key={opt.key} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
							<div>
								<p className="text-sm font-semibold text-white">{opt.label}</p>
								<p className="text-xs text-slate-400">{opt.description}</p>
								{isEmergency ? (
									<p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-100">
										<Siren className="h-3.5 w-3.5" aria-hidden="true" /> LifeLink does not replace emergency medical services.
									</p>
								) : null}
							</div>
							<Switch
								checked={enabled}
								onChange={(v) => onToggle(opt.key, v)}
								label={`Toggle ${opt.label}`}
							/>
						</div>
					);
				})}
			</div>
		</section>
	);
}

function AccountInformation({ profile }) {
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<SectionHeader icon={ShieldCheck} title="Account Information" subtitle="Account-level details and verification" />
			<div className="mt-6 grid gap-3 sm:grid-cols-2">
				<InfoLine label="Account created" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'} icon={Calendar} />
				<InfoLine label="Last profile update" value={profile.updatedAt ? new Date(profile.updatedAt).toLocaleString() : '—'} icon={CalendarClock} />
				<InfoLine label="Email verification" value={profile.emailVerified ? 'Verified' : 'Not verified'} icon={profile.emailVerified ? CheckCircle2 : AlertTriangle} tone={profile.emailVerified ? 'emerald' : 'amber'} />
				<InfoLine label="Phone verification" value={profile.phoneVerified ? 'Verified' : 'Not verified'} icon={profile.phoneVerified ? CheckCircle2 : AlertTriangle} tone={profile.phoneVerified ? 'emerald' : 'amber'} />
				<InfoLine label="Account role" value={roleLabel(profile.role)} icon={UserCheck} />
				<InfoLine label="Account status" value={profile.isActive ? 'Active' : 'Suspended'} icon={profile.isActive ? CheckCircle2 : AlertTriangle} tone={profile.isActive ? 'emerald' : 'rose'} />
			</div>
		</section>
	);
}

function PrivacySection() {
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<SectionHeader icon={Lock} title="Privacy & Visibility" subtitle="How your information is used" />
			<ul className="mt-6 space-y-3 text-sm text-slate-300">
				<li className="flex items-start gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" aria-hidden="true" /> Your personal information is private.</li>
				<li className="flex items-start gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" aria-hidden="true" /> Your exact home address is not publicly displayed.</li>
				<li className="flex items-start gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" aria-hidden="true" /> Donor matching may use approximate location.</li>
				<li className="flex items-start gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" aria-hidden="true" /> Blood group information is used for matching purposes.</li>
				<li className="flex items-start gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" aria-hidden="true" /> You control donor availability.</li>
			</ul>
		</section>
	);
}

function DeleteAccountDialog({ onCancel, onConfirm, loading }) {
	return (
		<div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="delete-title">
			<div className="glass-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-start gap-3">
					<div className="rounded-2xl bg-rose-500/15 p-3 text-rose-200"><Trash2 className="h-5 w-5" aria-hidden="true" /></div>
					<div>
						<h3 id="delete-title" className="text-xl font-semibold text-white">Delete your account?</h3>
						<p className="mt-2 text-sm text-slate-300">This action may permanently remove your account and associated data. This cannot be easily undone.</p>
					</div>
				</div>
				<div className="mt-6 flex flex-wrap justify-end gap-3">
					<button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Keep Account</button>
					<button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
						{loading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null} Delete Account
					</button>
				</div>
			</div>
		</div>
	);
}

function UnsavedChangesDialog({ onKeepEditing, onDiscard }) {
	return (
		<div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
			<div className="glass-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-start gap-3">
					<div className="rounded-2xl bg-amber-500/15 p-3 text-amber-200"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></div>
					<div>
						<h3 id="unsaved-title" className="text-xl font-semibold text-white">Discard changes?</h3>
						<p className="mt-2 text-sm text-slate-300">You have unsaved changes. Are you sure you want to leave?</p>
					</div>
				</div>
				<div className="mt-6 flex flex-wrap justify-end gap-3">
					<button type="button" onClick={onKeepEditing} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Keep Editing</button>
					<button type="button" onClick={onDiscard} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white">Discard Changes</button>
				</div>
			</div>
		</div>
	);
}

function ProfileSkeleton() {
	return (
		<div className="space-y-6">
			<div className="glass-card h-40 animate-pulse rounded-[2rem]" />
			<div className="glass-card h-28 animate-pulse rounded-[2rem]" />
			<div className="grid gap-6 xl:grid-cols-2">
				<div className="glass-card h-64 animate-pulse rounded-[2rem]" />
				<div className="glass-card h-64 animate-pulse rounded-[2rem]" />
			</div>
		</div>
	);
}

function ErrorState({ onRetry }) {
	return (
		<section className="glass-card rounded-[2rem] p-8 text-center sm:p-10">
			<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-200"><AlertTriangle className="h-8 w-8" aria-hidden="true" /></div>
			<h2 className="mt-6 text-2xl font-semibold text-white">Unable to load your profile</h2>
			<p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-300">We couldn't retrieve your profile information. Please try again.</p>
			<button type="button" onClick={onRetry} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">Retry</button>
		</section>
	);
}

function SectionHeader({ icon: Icon, title, subtitle }) {
	return (
		<div className="flex items-center gap-3">
			<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200"><Icon className="h-5 w-5" aria-hidden="true" /></div>
			<div>
				<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">{title}</p>
				{subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
			</div>
		</div>
	);
}

function Field({ label, required, error, children }) {
	return (
		<label className="block">
			<span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
				{label}{required ? <span className="text-rose-300">*</span> : null}
			</span>
			{children}
			{error ? <p className="mt-2 text-sm text-rose-200" role="alert">{error}</p> : null}
		</label>
	);
}

function ReadOnlyLine({ value }) {
	return (
		<div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white">{value || '—'}</div>
	);
}

function InfoLine({ label, value, icon: Icon, tone }) {
	const tones = {
		emerald: 'text-emerald-200',
		amber: 'text-amber-200',
		rose: 'text-rose-200',
		sky: 'text-sky-200',
	};
	return (
		<div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
			<div className="flex items-center gap-2">
				{Icon ? <Icon className={`h-4 w-4 ${tones[tone] || 'text-rose-200'}`} aria-hidden="true" /> : null}
				<dt className="text-sm text-slate-400">{label}</dt>
			</div>
			<dd className="text-right text-sm font-medium text-white">{value || '—'}</dd>
		</div>
	);
}

function Switch({ checked, onChange, label, disabled }) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${checked ? 'bg-rose-500' : 'bg-white/15'} ${disabled ? 'opacity-60' : ''}`}
		>
			<span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
		</button>
	);
}

function roleLabel(role) {
	const map = { seeker: 'Seeker', donor: 'Donor', bloodbank: 'Blood Bank', admin: 'Admin' };
	return map[role] || 'User';
}
