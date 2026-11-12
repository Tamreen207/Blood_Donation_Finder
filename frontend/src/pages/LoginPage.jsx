import { useMemo, useState } from 'react';
import { AlertCircle, Droplets, Eye, EyeOff, HeartPulse, LoaderCircle, Mail, Phone, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';
import { getDashboardRoute } from '../utils/routes';

function validate(values) {
	const errors = {};
	if (!values.identifier.trim()) {
		errors.identifier = 'Email is required.';
	} else if (!/^\S+@\S+\.\S+$/.test(values.identifier.trim())) {
		errors.identifier = 'Enter a valid email address.';
	}
	if (!values.password) {
		errors.password = 'Password is required.';
	}
	return errors;
}

export default function LoginPage() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formError, setFormError] = useState('');
	const [values, setValues] = useState({ identifier: '', password: '' });
	const [touched, setTouched] = useState({});
	const [submitted, setSubmitted] = useState(false);

	const errors = useMemo(() => validate(values), [values]);
	const showIdentifierError = (touched.identifier || submitted) && errors.identifier;
	const showPasswordError = (touched.password || submitted) && errors.password;

	const handleChange = (event) => {
		const { name, value } = event.target;
		setValues((current) => ({ ...current, [name]: value }));
		setFormError('');
	};

	const handleBlur = (event) => {
		const { name } = event.target;
		setTouched((current) => ({ ...current, [name]: true }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setSubmitted(true);
		setFormError('');
		const v = validate(values);
		if (Object.keys(v).length) return;
		setIsSubmitting(true);
		try {
			const data = await loginUser({ identifier: values.identifier, password: values.password });
			const user = data?.user || data?.data?.user;
			navigate(getDashboardRoute(user), { replace: true });
		} catch (err) {
			setFormError(err?.message || 'Unable to sign in. Please check your credentials.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen overflow-x-hidden bg-blood-radial text-slate-100">
			<div className="section-shell grid min-h-screen items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
				<section className="order-2 lg:order-1">
					<div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100">
						<ShieldCheck className="h-4 w-4" aria-hidden="true" />
						Secure LifeLink access
					</div>
					<h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
						Sign in to continue saving lives.
					</h1>
					<p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
						Access donor profiles, request history, blood bank tools, and emergency support from one place.
					</p>
					<div className="mt-8 grid gap-4 sm:grid-cols-2">
						<div className="glass-card rounded-3xl p-5">
							<div className="flex items-center gap-3">
								<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-200">
									<HeartPulse className="h-5 w-5" aria-hidden="true" />
								</div>
								<div>
									<p className="font-semibold text-white">Emergency ready</p>
									<p className="text-sm text-slate-400">Fast access when time matters</p>
								</div>
							</div>
						</div>
						<div className="glass-card rounded-3xl p-5">
							<div className="flex items-center gap-3">
								<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-200">
									<Droplets className="h-5 w-5" aria-hidden="true" />
								</div>
								<div>
									<p className="font-semibold text-white">Donation network</p>
									<p className="text-sm text-slate-400">Manage requests and support</p>
								</div>
							</div>
						</div>
					</div>
					<div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-300">
						<span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2"><Mail className="h-4 w-4 text-rose-300" aria-hidden="true" />Email login</span>
						<span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2"><Phone className="h-4 w-4 text-rose-300" aria-hidden="true" />Phone on profile</span>
					</div>
				</section>

				<section className="order-1 lg:order-2">
					<div className="glass-card relative overflow-hidden rounded-[2rem] p-6 shadow-2xl sm:p-8 lg:p-10">
						<div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-red-400 to-amber-400" />
						<div className="flex items-center gap-3">
							<span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-glow shadow-rose-500/30">
								<Droplets className="h-6 w-6 text-white" aria-hidden="true" />
							</span>
							<div>
								<p className="text-sm uppercase tracking-[0.3em] text-rose-200/80">LifeLink</p>
								<h2 className="text-2xl font-semibold text-white">Welcome back</h2>
							</div>
						</div>

						<form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
							<div>
								<label htmlFor="identifier" className="mb-2 block text-sm font-medium text-slate-200">Email</label>
								<input
									id="identifier"
									name="identifier"
									type="email"
									autoComplete="email"
									value={values.identifier}
									onChange={handleChange}
									onBlur={handleBlur}
									placeholder="you@example.com"
									className={`w-full rounded-2xl border bg-slate-950/50 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-500 focus:border-rose-400/40 focus:ring-2 focus:ring-rose-500/20 ${showIdentifierError ? 'border-rose-400/50' : 'border-white/10'}`}
								/>
								{showIdentifierError ? (
									<p className="mt-2 flex items-center gap-2 text-sm text-rose-300"><AlertCircle className="h-4 w-4" aria-hidden="true" />{errors.identifier}</p>
								) : null}
							</div>

							<div>
								<label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">Password</label>
								<div className="relative">
									<input
										id="password"
										name="password"
										type={showPassword ? 'text' : 'password'}
										autoComplete="current-password"
										value={values.password}
										onChange={handleChange}
										onBlur={handleBlur}
										placeholder="Enter your password"
										className={`w-full rounded-2xl border bg-slate-950/50 px-4 py-3.5 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:border-rose-400/40 focus:ring-2 focus:ring-rose-500/20 ${showPasswordError ? 'border-rose-400/50' : 'border-white/10'}`}
									/>
									<button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 inline-flex items-center px-4 text-slate-400 transition hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
										{showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
									</button>
								</div>
								{showPasswordError ? (
									<p className="mt-2 flex items-center gap-2 text-sm text-rose-300"><AlertCircle className="h-4 w-4" aria-hidden="true" />{errors.password}</p>
								) : null}
							</div>

							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<label className="inline-flex items-center gap-3 text-sm text-slate-300">
									<input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-white/20 bg-slate-950 text-rose-500 focus:ring-rose-500/30" />
									Remember me
								</label>
								<Link to="/forgot-password" className="text-sm font-medium text-rose-200 transition hover:text-white">Forgot password?</Link>
							</div>

							{formError ? (
								<div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{formError}</div>
							) : null}

							<button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-500/25 disabled:cursor-not-allowed disabled:opacity-70">
								{isSubmitting ? <><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />Signing in...</> : 'Login'}
							</button>

							<p className="text-center text-sm text-slate-300">
								Don&apos;t have an account? <Link to="/register" className="font-semibold text-rose-200 transition hover:text-white">Register</Link>
							</p>
						</form>
					</div>
				</section>
			</div>
		</div>
	);
}
