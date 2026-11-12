import { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Building2, Droplets, HeartPulse, LoaderCircle, ShieldCheck, User, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';
import { getDashboardRoute } from '../utils/routes';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function validate(values) {
	const errors = {};
	if (!values.name.trim() && values.role !== 'bloodbank') errors.name = 'Full name is required.';
	if (values.role === 'bloodbank' && !values.bloodBankName.trim()) errors.bloodBankName = 'Blood bank name is required.';
	if (!values.email.trim()) errors.email = 'Email is required.';
	else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
	if (!values.password) errors.password = 'Password is required.';
	else if (values.password.length < 6) errors.password = 'Password must be at least 6 characters.';
	if (values.password !== values.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
	if (!values.phone.trim()) errors.phone = 'Phone number is required.';
	if (values.role === 'donor' && !values.bloodGroup) errors.bloodGroup = 'Select your blood group.';
	return errors;
}

export default function RegisterPage() {
	const navigate = useNavigate();
	const [values, setValues] = useState({
		role: 'seeker',
		name: '',
		bloodBankName: '',
		email: '',
		phone: '',
		password: '',
		confirmPassword: '',
		city: '',
		bloodGroup: 'O+',
		registrationNumber: '',
		address: '',
	});
	const [touched, setTouched] = useState({});
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [formError, setFormError] = useState('');
	const errors = useMemo(() => validate(values), [values]);

	const setField = (name, value) => {
		setValues((c) => ({ ...c, [name]: value }));
		setFormError('');
	};

	const show = (key) => (touched[key] || submitted) && errors[key];

	async function handleSubmit(e) {
		e.preventDefault();
		setSubmitted(true);
		setFormError('');
		const v = validate(values);
		if (Object.keys(v).length) return;
		setSubmitting(true);
		try {
			const data = await registerUser(values);
			const user = data?.user || data?.data?.user;
			navigate(getDashboardRoute(user), { replace: true });
		} catch (err) {
			setFormError(err?.message || 'Registration failed. Please try again.');
		} finally {
			setSubmitting(false);
		}
	}

	const roles = [
		{ value: 'seeker', label: 'Patient / Seeker', icon: User, desc: 'Request blood and track status' },
		{ value: 'donor', label: 'Donor', icon: HeartPulse, desc: 'Donate and respond to requests' },
		{ value: 'bloodbank', label: 'Blood Bank', icon: Building2, desc: 'Manage inventory and requests' },
	];

	return (
		<div className="min-h-screen overflow-x-hidden bg-blood-radial text-slate-100">
			<div className="section-shell py-10 lg:py-14">
				<Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-white"><ArrowLeft className="h-4 w-4" />Back to Home</Link>
				<div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
					<section>
						<div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100"><ShieldCheck className="h-4 w-4" />Join LifeLink</div>
						<h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Create your account</h1>
						<p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Register as a patient, donor, or blood bank to connect with nearby support when it matters.</p>
						<div className="mt-8 space-y-3">
							{roles.map((r) => {
								const Icon = r.icon;
								const active = values.role === r.value;
								return (
									<button key={r.value} type="button" onClick={() => setField('role', r.value)} className={`flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition ${active ? 'border-rose-400/40 bg-rose-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
										<span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-rose-500/20 text-rose-200' : 'bg-white/10 text-slate-300'}`}><Icon className="h-5 w-5" /></span>
										<span>
											<span className="block font-semibold text-white">{r.label}</span>
											<span className="block text-sm text-slate-400">{r.desc}</span>
										</span>
									</button>
								);
							})}
						</div>
					</section>

					<section className="glass-card relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
						<div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-red-400 to-amber-400" />
						<div className="flex items-center gap-3">
							<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600"><Droplets className="h-6 w-6 text-white" /></span>
							<div>
								<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">Register</p>
								<h2 className="text-2xl font-semibold text-white">{roles.find((r) => r.value === values.role)?.label}</h2>
							</div>
						</div>

						<form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
							{values.role === 'bloodbank' ? (
								<Field label="Blood bank name" error={show('bloodBankName')} className="sm:col-span-2">
									<input value={values.bloodBankName} onChange={(e) => setField('bloodBankName', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, bloodBankName: true }))} className={inputCls(show('bloodBankName'))} placeholder="City Blood Bank" />
								</Field>
							) : (
								<Field label="Full name" error={show('name')} className="sm:col-span-2">
									<input value={values.name} onChange={(e) => setField('name', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))} className={inputCls(show('name'))} placeholder="Your full name" />
								</Field>
							)}
							<Field label="Email" error={show('email')}>
								<input type="email" value={values.email} onChange={(e) => setField('email', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, email: true }))} className={inputCls(show('email'))} placeholder="you@example.com" />
							</Field>
							<Field label="Phone" error={show('phone')}>
								<input value={values.phone} onChange={(e) => setField('phone', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, phone: true }))} className={inputCls(show('phone'))} placeholder="+91 98765 43210" />
							</Field>
							<Field label="City" className={values.role === 'donor' ? '' : 'sm:col-span-2'}>
								<input value={values.city} onChange={(e) => setField('city', e.target.value)} className={inputCls(false)} placeholder="City" />
							</Field>
							{values.role === 'donor' ? (
								<Field label="Blood group" error={show('bloodGroup')}>
									<select value={values.bloodGroup} onChange={(e) => setField('bloodGroup', e.target.value)} className={inputCls(show('bloodGroup'))}>
										{BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
									</select>
								</Field>
							) : null}
							{values.role === 'bloodbank' ? (
								<>
									<Field label="Registration number">
										<input value={values.registrationNumber} onChange={(e) => setField('registrationNumber', e.target.value)} className={inputCls(false)} placeholder="License / registration no." />
									</Field>
									<Field label="Address">
										<input value={values.address} onChange={(e) => setField('address', e.target.value)} className={inputCls(false)} placeholder="Address" />
									</Field>
								</>
							) : null}
							<Field label="Password" error={show('password')}>
								<input type="password" value={values.password} onChange={(e) => setField('password', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, password: true }))} className={inputCls(show('password'))} placeholder="Min 6 characters" />
							</Field>
							<Field label="Confirm password" error={show('confirmPassword')}>
								<input type="password" value={values.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)} onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))} className={inputCls(show('confirmPassword'))} placeholder="Re-enter password" />
							</Field>

							{formError ? <div className="sm:col-span-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{formError}</div> : null}

							<div className="sm:col-span-2 pt-2">
								<button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/25 disabled:cursor-not-allowed disabled:opacity-70">
									{submitting ? <><LoaderCircle className="h-4 w-4 animate-spin" />Creating account...</> : <><Users className="h-4 w-4" />Create account</>}
								</button>
							</div>
							<p className="sm:col-span-2 text-center text-sm text-slate-300">Already have an account? <Link to="/login" className="font-semibold text-rose-200 hover:text-white">Login</Link></p>
						</form>
					</section>
				</div>
			</div>
		</div>
	);
}

function Field({ label, error, children, className = '' }) {
	return (
		<div className={className}>
			<label className="mb-2 block text-sm font-medium text-slate-200">{label}</label>
			{children}
			{error ? <p className="mt-2 flex items-center gap-2 text-sm text-rose-300"><AlertCircle className="h-4 w-4" />{error}</p> : null}
		</div>
	);
}

function inputCls(hasError) {
	return `w-full rounded-2xl border bg-slate-950/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-rose-400/40 focus:ring-2 focus:ring-rose-500/20 ${hasError ? 'border-rose-400/50' : 'border-white/10'}`;
}
