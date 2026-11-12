import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	AlertTriangle,
	Bell,
	BellOff,
	Building2,
	Calendar,
	CalendarClock,
	CheckCircle2,
	ChevronDown,
	Droplet,
	Download,
	Eye,
	EyeOff,
	Globe2,
	HeartHandshake,
	LayoutDashboard,
	LoaderCircle,
	Lock,
	MapPin,
	Menu,
	Moon,
	Monitor,
	Palette,
	Phone,
	RotateCcw,
	Save,
	Settings as SettingsIcon,
	Shield,
	ShieldCheck,
	Smartphone,
	Trash2,
	User,
	Users,
	X,
} from 'lucide-react';
import DashboardLayout, { donorSidebar } from '../components/DashboardLayout';
import { useToast } from '../components/ToastProvider';
import { useNotificationCount } from '../services/notificationCount';
import {
	changePassword,
	deleteAccount,
	fetchSettings,
	getDefaultSettings,
	isSettingsApiConfigured,
	requestDataExport,
	resetPreferences,
	saveDonorPreferences,
	saveNotificationPreferences,
	savePrivacyPreferences,
	saveSettings,
} from '../services/settingsService';

const SECTIONS = [
	{ id: 'general', label: 'General', icon: LayoutDashboard },
	{ id: 'notifications', label: 'Notifications', icon: Bell },
	{ id: 'privacy', label: 'Privacy', icon: Shield },
	{ id: 'donor', label: 'Donor Preferences', icon: HeartHandshake },
	{ id: 'security', label: 'Security', icon: Lock },
	{ id: 'appearance', label: 'Appearance', icon: Palette },
	{ id: 'account', label: 'Account', icon: User },
];

const LANGUAGES = [
	{ value: 'en', label: 'English' },
	{ value: 'te', label: 'Telugu' },
	{ value: 'hi', label: 'Hindi' },
];
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'];
const TIMEZONES = [
	'UTC',
	'Asia/Kolkata',
	'Asia/Singapore',
	'America/New_York',
	'America/Los_Angeles',
	'Europe/London',
	'Europe/Berlin',
	'Australia/Sydney',
];
const RADIUS_OPTIONS = ['5 km', '10 km', '25 km', '50 km', '100 km'];
const THEMES = [
	{ value: 'system', label: 'System Default', icon: Monitor },
	{ value: 'light', label: 'Light', icon: Globe2 },
	{ value: 'dark', label: 'Dark', icon: Moon },
];
const NOTIFICATION_OPTIONS = [
	{ key: 'bloodRequestAlerts', label: 'Blood Request Alerts', description: 'Receive updates about your blood requests and matches.' },
	{ key: 'emergencyAlerts', label: 'Emergency Alerts', description: 'Receive important emergency blood-request notifications.' },
	{ key: 'donationReminders', label: 'Donation Reminders', description: 'Receive reminders about upcoming donation appointments and eligibility.' },
	{ key: 'bloodBankUpdates', label: 'Blood Bank Updates', description: 'Receive updates related to blood banks and request responses.' },
	{ key: 'accountActivity', label: 'Account Activity', description: 'Receive notifications about important account changes.' },
	{ key: 'promotionalMessages', label: 'Promotional Messages', description: 'Receive optional LifeLink announcements and promotional communications.' },
];
const CHANNEL_OPTIONS = [
	{ key: 'email', label: 'Email', icon: Globe2, description: 'Email notifications' },
	{ key: 'sms', label: 'SMS', icon: Phone, description: 'Text messages to your phone' },
	{ key: 'push', label: 'Push Notifications', icon: Smartphone, description: 'In-app and browser notifications' },
];

function readUser() {
	try {
		const raw = localStorage.getItem('lifelink_user');
		return raw ? JSON.parse(raw) : null;
	} catch (_) { return null; }
}

function isStrong(password) {
	if (!password) return { score: 0, label: 'Empty', tone: 'rose' };
	let score = 0;
	if (password.length >= 8) score += 1;
	if (/[A-Z]/.test(password)) score += 1;
	if (/[0-9]/.test(password)) score += 1;
	if (/[^A-Za-z0-9]/.test(password)) score += 1;
	if (password.length >= 12) score += 1;
	if (score <= 1) return { score, label: 'Weak', tone: 'rose' };
	if (score <= 3) return { score, label: 'Fair', tone: 'amber' };
	if (score === 4) return { score, label: 'Strong', tone: 'emerald' };
	return { score, label: 'Very strong', tone: 'emerald' };
}

export default function SettingsPage() {
	const navigate = useNavigate();
	const { toast } = useToast();
	const unreadBell = useNotificationCount();
	const [user, setUser] = useState(() => readUser() || { name: 'User', role: 'donor' });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [settings, setSettings] = useState(getDefaultSettings());
	const [draft, setDraft] = useState(getDefaultSettings());
	const [active, setActive] = useState('general');
	const [saving, setSaving] = useState(false);
	const [exporting, setExporting] = useState(false);
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const [passwordOpen, setPasswordOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);
	const [deletingAccount, setDeletingAccount] = useState(false);
	const [unsavedOpen, setUnsavedOpen] = useState(false);
	const apiReady = isSettingsApiConfigured();

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function load() {
		setLoading(true);
		setError('');
		try {
			const res = await fetchSettings();
			const data = res?.data || getDefaultSettings();
			setSettings(data);
			setDraft(data);
		} catch (_) {
			setError('Unable to load settings.');
		} finally {
			setLoading(false);
		}
	}

	function hasChanges() {
		return JSON.stringify(draft) !== JSON.stringify(settings);
	}

	function update(section, key, value) {
		setDraft((current) => ({ ...current, [section]: { ...current[section], [key]: value } }));
	}

	function updateNested(section, parent, key, value) {
		setDraft((current) => ({
			...current,
			[section]: { ...current[section], [parent]: { ...current[section][parent], [key]: value } },
		}));
	}

	async function saveGroup(sectionKey) {
		setSaving(true);
		try {
			let res;
			if (sectionKey === 'notifications') res = await saveNotificationPreferences(draft.notifications);
			else if (sectionKey === 'privacy') res = await savePrivacyPreferences(draft.privacy);
			else if (sectionKey === 'donor') res = await saveDonorPreferences(draft.donor);
			else res = await saveSettings(draft);
			const next = res?.data || draft;
			setSettings(next);
			setDraft(next);
			toast('Settings updated successfully.', 'success');
		} catch (_) {
			toast('Unable to save changes. Please try again.', 'error');
		} finally {
			setSaving(false);
		}
	}

	async function saveImmediate(section, key, value) {
		const previous = settings;
		const next = { ...settings, [section]: { ...settings[section], [key]: value } };
		setSettings(next);
		setDraft(next);
		try {
			if (section === 'notifications') {
				await saveNotificationPreferences(next.notifications);
				toast('Notification preferences updated.', 'success');
			} else if (section === 'privacy') {
				await savePrivacyPreferences(next.privacy);
				toast('Privacy preferences updated.', 'success');
			} else if (section === 'donor') {
				await saveDonorPreferences(next.donor);
				toast('Donor preferences updated.', 'success');
			} else {
				await saveSettings(next);
				toast('Settings updated successfully.', 'success');
			}
		} catch (_) {
			setSettings(previous);
			setDraft(previous);
			toast('Unable to save changes. Please try again.', 'error');
		}
	}

	async function handleExport() {
		setExporting(true);
		try {
			const res = await requestDataExport();
			toast(res?.message || 'Preparing your export...', 'info');
		} catch (_) {
			toast('Unable to prepare export right now.', 'error');
		} finally {
			setExporting(false);
		}
	}

	async function handleResetPreferences() {
		setResetOpen(false);
		const fresh = getDefaultSettings();
		setSettings(fresh);
		setDraft(fresh);
		try {
			await resetPreferences();
			toast('Preferences reset to defaults.', 'success');
		} catch (_) {
			toast('Could not reset preferences.', 'error');
		}
	}

	async function handleDeleteAccount() {
		setDeletingAccount(true);
		try {
			await deleteAccount();
			try { localStorage.removeItem('lifelink_token'); localStorage.removeItem('lifelink_user'); } catch (_) {}
			toast('Account deletion request submitted.', 'success');
			navigate('/login');
		} catch (_) {
			toast('Could not delete account right now.', 'error');
		} finally {
			setDeletingAccount(false);
			setDeleteOpen(false);
		}
	}

	const headerPrimary = (
		<button
			type="button"
			onClick={() => navigate('/profile')}
			className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
		>
			<User className="h-4 w-4" aria-hidden="true" /> View Profile
		</button>
	);

	return (
		<DashboardLayout
			user={user}
			items={donorSidebar}
			pageTitle="Settings"
			pageSubtitle="Manage your account, privacy, notifications, and preferences."
			primaryAction={headerPrimary}
			unreadNotifications={unreadBell}
		>
			{loading ? (
				<SettingsSkeleton />
			) : error ? (
				<ErrorState onRetry={load} />
			) : (
				<div className="space-y-6">
					{/* Mobile section selector */}
					<div className="lg:hidden">
						<button
							type="button"
							onClick={() => setMobileNavOpen((v) => !v)}
							className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
						>
							<span className="inline-flex items-center gap-2">
								<Menu className="h-4 w-4" aria-hidden="true" /> {SECTIONS.find((s) => s.id === active)?.label}
							</span>
							<ChevronDown className={`h-4 w-4 transition ${mobileNavOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
						</button>
						{mobileNavOpen ? (
							<div className="mt-2 grid gap-1 rounded-2xl border border-white/10 bg-slate-950/60 p-2">
								{SECTIONS.map((s) => {
									const Icon = s.icon;
									const isActive = active === s.id;
									return (
										<button
											key={s.id}
											type="button"
											onClick={() => { setActive(s.id); setMobileNavOpen(false); }}
											className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5'}`}
										>
											<Icon className="h-4 w-4" aria-hidden="true" /> {s.label}
										</button>
									);
								})}
							</div>
						) : null}
					</div>

					<div className="grid gap-6 lg:grid-cols-[260px_1fr]">
						<aside className="hidden lg:block">
							<nav aria-label="Settings sections" className="sticky top-24 space-y-1 rounded-3xl border border-white/10 bg-white/5 p-2">
								{SECTIONS.map((s) => {
									const Icon = s.icon;
									const isActive = active === s.id;
									return (
										<button
											key={s.id}
											type="button"
											onClick={() => setActive(s.id)}
											aria-current={isActive ? 'page' : undefined}
											className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${isActive ? 'bg-rose-500/15 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
										>
											<Icon className="h-4 w-4" aria-hidden="true" /> {s.label}
										</button>
									);
								})}
							</nav>
						</aside>

						<div className="space-y-6">
							{active === 'general' ? <GeneralSection draft={draft} update={update} onSave={() => saveGroup('general')} saving={saving} hasChanges={hasChanges()} /> : null}
							{active === 'notifications' ? (
								<NotificationSection
									draft={draft}
									update={(key, value) => saveImmediate('notifications', key, value)}
									updateChannel={(key, value) => updateNested('notifications', 'channels', key, value)}
									saveChannel={() => saveGroup('notifications')}
									saving={saving}
									hasChanges={hasChanges()}
								/>
							) : null}
							{active === 'privacy' ? <PrivacySection draft={draft} update={(key, value) => saveImmediate('privacy', key, value)} hasChanges={hasChanges()} /> : null}
							{active === 'donor' ? <DonorPreferencesSection draft={draft} update={(key, value) => saveImmediate('donor', key, value)} hasChanges={hasChanges()} /> : null}
							{active === 'security' ? <SecuritySection onChangePassword={() => setPasswordOpen(true)} /> : null}
							{active === 'appearance' ? <AppearanceSection draft={draft} update={(key, value) => saveImmediate('appearance', key, value)} hasChanges={hasChanges()} /> : null}
							{active === 'account' ? (
								<AccountSection
									user={user}
									onExport={handleExport}
									exporting={exporting}
									onDelete={() => setDeleteOpen(true)}
									onReset={() => setResetOpen(true)}
									hasChanges={hasChanges()}
									onSave={() => saveGroup('general')}
									saving={saving}
								/>
							) : null}
						</div>
					</div>
				</div>
			)}

			{passwordOpen ? <ChangePasswordModal onClose={() => setPasswordOpen(false)} onSubmit={async (payload) => {
				try {
					await changePassword(payload);
					toast('Password changed successfully.', 'success');
					setPasswordOpen(false);
				} catch (_) {
					toast('Unable to change password right now.', 'error');
				}
			}} /> : null}

			{deleteOpen ? <DeleteAccountDialog onCancel={() => setDeleteOpen(false)} onConfirm={handleDeleteAccount} loading={deletingAccount} /> : null}

			{resetOpen ? (
				<ConfirmDialog
					title="Reset preferences?"
					message="This will reset your notification, privacy, donor, and appearance preferences to defaults. Your account, profile, and history will not be changed."
					confirmLabel="Reset Preferences"
					onCancel={() => setResetOpen(false)}
					onConfirm={handleResetPreferences}
				/>
			) : null}

			{unsavedOpen ? (
				<ConfirmDialog
					title="Discard changes?"
					message="You have unsaved changes. Are you sure you want to leave?"
					confirmLabel="Discard Changes"
					keepLabel="Keep Editing"
					onCancel={() => setUnsavedOpen(false)}
					onConfirm={() => setUnsavedOpen(false)}
				/>
			) : null}
		</DashboardLayout>
	);
}

function SectionCard({ icon: Icon, title, subtitle, action, children }) {
	return (
		<section className="glass-card rounded-[2rem] p-6 sm:p-8">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200"><Icon className="h-5 w-5" aria-hidden="true" /></div>
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

function GeneralSection({ draft, update, onSave, saving, hasChanges }) {
	return (
		<SectionCard
			icon={LayoutDashboard}
			title="General"
			subtitle="Language, timezone, and date format"
			action={<SaveButton onSave={onSave} saving={saving} hasChanges={hasChanges} label="Save General" />}
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Language">
					<select className="field-input" value={draft.general.language} onChange={(e) => update('general', 'language', e.target.value)}>
						{LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
					</select>
				</Field>
				<Field label="Time zone">
					<select className="field-input" value={draft.general.timeZone} onChange={(e) => update('general', 'timeZone', e.target.value)}>
						{TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
					</select>
				</Field>
				<Field label="Date format">
					<select className="field-input" value={draft.general.dateFormat} onChange={(e) => update('general', 'dateFormat', e.target.value)}>
						{DATE_FORMATS.map((df) => <option key={df} value={df}>{df}</option>)}
					</select>
				</Field>
			</div>
			<p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
				<Globe2 className="h-3.5 w-3.5" aria-hidden="true" /> Multilingual content is available in English; additional language support is being rolled out.
			</p>
		</SectionCard>
	);
}

function NotificationSection({ draft, update, updateChannel, saveChannel, saving, hasChanges }) {
	return (
		<>
			<SectionCard
				icon={Bell}
				title="Notification Preferences"
				subtitle="Choose which events notify you"
				action={<SaveButton onSave={saveChannel} saving={saving} hasChanges={hasChanges} label="Save Channels" />}
			>
				<div className="space-y-3">
					{NOTIFICATION_OPTIONS.map((opt) => (
						<div key={opt.key} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
							<div>
								<p className="text-sm font-semibold text-white">{opt.label}</p>
								<p className="text-xs text-slate-400">{opt.description}</p>
							</div>
							<Switch
								checked={Boolean(draft.notifications[opt.key])}
								onChange={(v) => update(opt.key, v)}
								label={`Toggle ${opt.label}`}
							/>
						</div>
					))}
				</div>
			</SectionCard>
			<SectionCard
				icon={Smartphone}
				title="Notification Channels"
				subtitle="Where notifications are delivered"
				action={<SaveButton onSave={saveChannel} saving={saving} hasChanges={hasChanges} label="Save Channels" />}
			>
				<div className="grid gap-3 sm:grid-cols-3">
					{CHANNEL_OPTIONS.map((opt) => {
						const Icon = opt.icon;
						const enabled = Boolean(draft.notifications.channels?.[opt.key]);
						const note = opt.key === 'sms' ? 'Requires SMS provider configuration' : opt.key === 'push' ? 'Uses in-app delivery' : 'Always available';
						return (
							<div key={opt.key} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
								<div className="flex items-center gap-3">
									<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-rose-200">
										<Icon className="h-5 w-5" aria-hidden="true" />
									</div>
									<div>
										<p className="text-sm font-semibold text-white">{opt.label}</p>
										<p className="text-xs text-slate-400">{opt.description}</p>
									</div>
								</div>
								<div className="mt-3 flex items-center justify-between">
									<span className="text-xs text-slate-400">{note}</span>
									<Switch checked={enabled} onChange={(v) => updateChannel(opt.key, v)} label={`Toggle ${opt.label}`} disabled={opt.key === 'sms' && !enabled && !apiReadyForSms()} />
								</div>
							</div>
						);
					})}
				</div>
				<p className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
					<AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Emergency alerts do not replace emergency medical services.
				</p>
			</SectionCard>
		</>
	);
}

function apiReadyForSms() { return Boolean(import.meta.env.VITE_SMS_PROVIDER); }

function PrivacySection({ draft, update, hasChanges }) {
	return (
		<SectionCard icon={Shield} title="Privacy" subtitle="Visibility and contact preferences">
			<div className="space-y-3">
				<PrivacyRow
					label="Donor profile visibility"
					description="Control whether your donor profile can appear when matching eligible blood requests."
					control={
						<select className="field-input" value={draft.privacy.profileVisibility} onChange={(e) => update('profileVisibility', e.target.value)}>
							<option value="visible">Visible to matching requests</option>
							<option value="hidden">Hidden</option>
						</select>
					}
				/>
				<PrivacyRow
					label="Use approximate location for matching"
					description="LifeLink should use an approximate area rather than your exact home location when matching blood requests."
					control={<Switch checked={Boolean(draft.privacy.approximateLocation)} onChange={(v) => update('approximateLocation', v)} label="Toggle approximate location" />}
				/>
				<PrivacyRow
					label="Keep personal contact information private"
					description="Your private phone number and email should not be publicly displayed to other users."
					control={<Switch checked={Boolean(draft.privacy.contactPrivacy)} onChange={(v) => update('contactPrivacy', v)} label="Toggle contact privacy" />}
				/>
			</div>
			{hasChanges ? <p className="mt-4 text-xs text-amber-200">You have unsaved changes. Preferences save automatically when toggled.</p> : null}
		</SectionCard>
	);
}

function PrivacyRow({ label, description, control }) {
	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p className="text-sm font-semibold text-white">{label}</p>
				<p className="text-xs text-slate-400">{description}</p>
			</div>
			<div className="sm:max-w-xs">{control}</div>
		</div>
	);
}

function DonorPreferencesSection({ draft, update, hasChanges }) {
	return (
		<SectionCard icon={HeartHandshake} title="Donor Preferences" subtitle="Availability and matching">
			<div className="space-y-3">
				<PrivacyRow
					label="Available for blood requests"
					description="Allow LifeLink to consider you when matching nearby blood requests."
					control={<Switch checked={Boolean(draft.donor.available)} onChange={(v) => update('available', v)} label="Toggle donor availability" />}
				/>
				<PrivacyRow
					label="Search radius"
					description="Choose how far you are willing to travel for a blood donation request."
					control={
						<select className="field-input" value={draft.donor.searchRadius} onChange={(e) => update('searchRadius', e.target.value)}>
							{RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
						</select>
					}
				/>
				<PrivacyRow
					label="Blood group"
					description="Blood group is verified through your profile. Manage it from the Profile page."
					control={<span className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-100"><Droplet className="h-3.5 w-3.5" aria-hidden="true" /> Manage in Profile</span>}
				/>
			</div>
			{hasChanges ? <p className="mt-4 text-xs text-amber-200">Changes save automatically.</p> : null}
		</SectionCard>
	);
}

function SecuritySection({ onChangePassword }) {
	return (
		<SectionCard icon={Lock} title="Security" subtitle="Password and authentication">
			<div className="space-y-3">
				<PrivacyRow
					label="Change password"
					description="Update your account password using your current password."
					control={
						<button type="button" onClick={onChangePassword} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
							<Lock className="h-4 w-4" aria-hidden="true" /> Change Password
						</button>
					}
				/>
				<PrivacyRow
					label="Active sessions"
					description="Session management is not available yet. Use sign out from the dashboard to end your current session."
					control={<span className="text-xs text-slate-400">Coming soon</span>}
				/>
				<PrivacyRow
					label="Two-factor authentication"
					description="2FA requires backend support. Once enabled by your administrator, you can manage it here."
					control={<span className="text-xs text-slate-400">Not available</span>}
				/>
			</div>
		</SectionCard>
	);
}

function AppearanceSection({ draft, update, hasChanges }) {
	return (
		<SectionCard icon={Palette} title="Appearance" subtitle="Theme and layout">
			<div className="grid gap-4 sm:grid-cols-2">
				<Field label="Theme">
					<div className="grid grid-cols-3 gap-2">
						{THEMES.map((opt) => {
							const Icon = opt.icon;
							const active = draft.appearance.theme === opt.value;
							return (
								<button
									key={opt.value}
									type="button"
									onClick={() => update('theme', opt.value)}
									aria-pressed={active}
									className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-xs font-semibold transition ${active ? 'border-rose-400/40 bg-rose-500/15 text-white' : 'border-white/10 bg-slate-950/40 text-slate-300 hover:border-white/20'}`}
								>
									<Icon className="h-5 w-5" aria-hidden="true" /> {opt.label}
								</button>
							);
						})}
					</div>
				</Field>
				<Field label="Compact mode">
					<div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
						<div>
							<p className="text-sm font-semibold text-white">Use compact layout</p>
							<p className="text-xs text-slate-400">Denser spacing throughout the interface.</p>
						</div>
						<Switch checked={Boolean(draft.appearance.compactMode)} onChange={(v) => update('compactMode', v)} label="Toggle compact mode" />
					</div>
				</Field>
			</div>
			{hasChanges ? <p className="mt-4 text-xs text-amber-200">Changes save automatically.</p> : null}
		</SectionCard>
	);
}

function AccountSection({ user, onExport, exporting, onDelete, onReset, hasChanges, onSave, saving }) {
	const [showDelete, setShowDelete] = useState(false);
	return (
		<>
			<SectionCard
				icon={User}
				title="Account"
				subtitle="Account controls and data"
				action={<SaveButton onSave={onSave} saving={saving} hasChanges={hasChanges} label="Save Account" />}
			>
				<div className="grid gap-3 sm:grid-cols-2">
					<InfoLine label="Account status" value="Active" icon={ShieldCheck} tone="emerald" />
					<InfoLine label="Email verification" value="Verified" icon={CheckCircle2} tone="emerald" />
					<InfoLine label="Phone verification" value="Pending" icon={Phone} tone="amber" />
					<InfoLine label="Account created" value="Recently" icon={Calendar} />
					<InfoLine label="Account role" value={roleLabel(user?.role)} icon={Users} />
					<InfoLine label="Last profile update" value="Recently" icon={CalendarClock} />
				</div>
				<div className="mt-6 flex flex-wrap gap-3">
					<button type="button" onClick={onExport} disabled={exporting} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60">
						{exporting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />} Request Data Export
					</button>
					<button type="button" onClick={onReset} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
						<RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset Preferences
					</button>
				</div>
			</SectionCard>
			<section className="glass-card rounded-[2rem] border border-rose-400/30 bg-gradient-to-br from-rose-500/10 via-red-500/5 to-slate-900 p-6 sm:p-8">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<div className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5 text-rose-200" aria-hidden="true" />
							<h2 className="text-xl font-semibold text-white">Delete Account</h2>
						</div>
						<p className="mt-2 text-sm text-slate-300">Permanently remove your LifeLink account and associated account data.</p>
					</div>
					<button type="button" onClick={() => setShowDelete(true)} className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/15 px-5 py-3 text-sm font-semibold text-rose-200 hover:bg-rose-500/25">
						<Trash2 className="h-4 w-4" aria-hidden="true" /> Delete Account
					</button>
				</div>
			</section>
			{showDelete ? <DeleteAccountDialog onCancel={() => setShowDelete(false)} onConfirm={() => { onDelete(); setShowDelete(false); }} loading={false} /> : null}
		</>
	);
}

function ChangePasswordModal({ onClose, onSubmit }) {
	const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
	const [show, setShow] = useState({ current: false, next: false, confirm: false });
	const [submitting, setSubmitting] = useState(false);
	const [errors, setErrors] = useState({});

	function update(key, value) {
		setForm((c) => ({ ...c, [key]: value }));
		setErrors((c) => {
			if (!c[key]) return c;
			const n = { ...c };
			delete n[key];
			return n;
		});
	}

	function validate() {
		const e = {};
		if (!form.currentPassword) e.currentPassword = 'Current password is required';
		if (!form.newPassword) e.newPassword = 'New password is required';
		else if (form.newPassword.length < 8) e.newPassword = 'New password must be at least 8 characters';
		if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
		return e;
	}

	async function handleSubmit(e) {
		e.preventDefault();
		const v = validate();
		setErrors(v);
		if (Object.keys(v).length) return;
		setSubmitting(true);
		try {
			await onSubmit({ currentPassword: form.currentPassword, newPassword: form.newPassword });
		} finally {
			setSubmitting(false);
		}
	}

	const strength = isStrong(form.newPassword);

	return (
		<div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="change-pw-title">
			<form onSubmit={handleSubmit} className="glass-card w-full max-w-lg rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-start justify-between gap-3">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Security</p>
						<h3 id="change-pw-title" className="mt-1 text-2xl font-semibold text-white">Change Password</h3>
					</div>
					<button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10" aria-label="Close change password">
						<X className="h-5 w-5" aria-hidden="true" />
					</button>
				</div>
				<div className="mt-5 space-y-4">
					<PasswordField label="Current password" value={form.currentPassword} onChange={(v) => update('currentPassword', v)} show={show.current} setShow={(v) => setShow((s) => ({ ...s, current: v }))} error={errors.currentPassword} />
					<PasswordField label="New password" value={form.newPassword} onChange={(v) => update('newPassword', v)} show={show.next} setShow={(v) => setShow((s) => ({ ...s, next: v }))} error={errors.newPassword} />
					{form.newPassword ? <PasswordStrength strength={strength} /> : null}
					<PasswordField label="Confirm new password" value={form.confirmPassword} onChange={(v) => update('confirmPassword', v)} show={show.confirm} setShow={(v) => setShow((s) => ({ ...s, confirm: v }))} error={errors.confirmPassword} />
				</div>
				<div className="mt-6 flex flex-wrap justify-end gap-3">
					<button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Cancel</button>
					<button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
						{submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />} Update Password
					</button>
				</div>
			</form>
		</div>
	);
}

function PasswordField({ label, value, onChange, show, setShow, error }) {
	return (
		<label className="block">
			<span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
			<div className="relative">
				<input className="field-input pr-10" type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} autoComplete="off" />
				<button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-300 hover:bg-white/10" aria-label={show ? 'Hide password' : 'Show password'}>
					{show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
				</button>
			</div>
			{error ? <p className="mt-2 text-sm text-rose-200" role="alert">{error}</p> : null}
		</label>
	);
}

function PasswordStrength({ strength }) {
	const tone = strength.tone === 'emerald' ? 'bg-emerald-500' : strength.tone === 'amber' ? 'bg-amber-500' : 'bg-rose-500';
	const widths = ['w-1/5', 'w-2/5', 'w-3/5', 'w-4/5', 'w-full'];
	return (
		<div>
			<div className="flex items-center justify-between text-xs text-slate-400">
				<span>Password strength</span>
				<span>{strength.label}</span>
			</div>
			<div className="mt-2 h-2 rounded-full bg-white/10">
				<div className={`h-2 rounded-full ${tone} transition-all ${widths[strength.score] || 'w-0'}`} />
			</div>
		</div>
	);
}

function DeleteAccountDialog({ onCancel, onConfirm, loading }) {
	return (
		<div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="settings-delete-title">
			<div className="glass-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-start gap-3">
					<div className="rounded-2xl bg-rose-500/15 p-3 text-rose-200"><Trash2 className="h-5 w-5" aria-hidden="true" /></div>
					<div>
						<h3 id="settings-delete-title" className="text-xl font-semibold text-white">Delete your account?</h3>
						<p className="mt-2 text-sm text-slate-300">This action may permanently remove your account and associated data. Make sure you understand the consequences before continuing.</p>
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

function ConfirmDialog({ title, message, confirmLabel, keepLabel, onCancel, onConfirm }) {
	return (
		<div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md" role="dialog" aria-modal="true">
			<div className="glass-card w-full max-w-md rounded-[2rem] p-6 sm:p-8">
				<div className="flex items-start gap-3">
					<div className="rounded-2xl bg-amber-500/15 p-3 text-amber-200"><AlertTriangle className="h-5 w-5" aria-hidden="true" /></div>
					<div>
						<h3 className="text-xl font-semibold text-white">{title}</h3>
						<p className="mt-2 text-sm text-slate-300">{message}</p>
					</div>
				</div>
				<div className="mt-6 flex flex-wrap justify-end gap-3">
					<button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">{keepLabel || 'Cancel'}</button>
					<button type="button" onClick={onConfirm} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white">{confirmLabel}</button>
				</div>
			</div>
		</div>
	);
}

function SettingsSkeleton() {
	return (
		<div className="grid gap-6 lg:grid-cols-[260px_1fr]">
			<div className="hidden lg:block"><div className="glass-card h-72 animate-pulse rounded-3xl" /></div>
			<div className="space-y-6">
				<div className="glass-card h-40 animate-pulse rounded-[2rem]" />
				<div className="glass-card h-64 animate-pulse rounded-[2rem]" />
				<div className="glass-card h-48 animate-pulse rounded-[2rem]" />
			</div>
		</div>
	);
}

function ErrorState({ onRetry }) {
	return (
		<section className="glass-card rounded-[2rem] p-8 text-center sm:p-10">
			<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-200"><AlertTriangle className="h-8 w-8" aria-hidden="true" /></div>
			<h2 className="mt-6 text-2xl font-semibold text-white">Unable to load settings</h2>
			<p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-300">We couldn't retrieve your settings. Please try again.</p>
			<button type="button" onClick={onRetry} className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">Retry</button>
		</section>
	);
}

function Field({ label, children }) {
	return (
		<label className="block">
			<span className="mb-2 block text-sm font-medium text-slate-200">{label}</span>
			{children}
		</label>
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
			onClick={() => !disabled && onChange(!checked)}
			className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${checked ? 'bg-rose-500' : 'bg-white/15'} ${disabled ? 'opacity-60' : ''}`}
		>
			<span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
		</button>
	);
}

function SaveButton({ onSave, saving, hasChanges, label }) {
	return (
		<button
			type="button"
			onClick={onSave}
			disabled={saving || !hasChanges}
			className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
		>
			{saving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
			{saving ? 'Saving...' : label || 'Save Changes'}
		</button>
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
			<dd className="text-right text-sm font-medium text-white">{value}</dd>
		</div>
	);
}

function roleLabel(role) {
	const map = { seeker: 'Seeker', donor: 'Donor', bloodbank: 'Blood Bank', admin: 'Admin' };
	return map[role] || 'User';
}
