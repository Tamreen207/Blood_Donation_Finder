import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, LoaderCircle, MapPin, Navigation2, Phone, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchBloodAvailability, fetchNearbyDonors } from '../services/bloodSearchService';
import { getBrowserLocation } from '../services/locationService';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const RADII = ['5 km', '10 km', '25 km', '50 km', '100 km'];

function parseRadiusKm(r) {
	if (!r) return 25;
	if (typeof r === 'number') return r;
	const m = String(r).match(/(\d+)/);
	return m ? parseInt(m[1], 10) : 25;
}

function availabilityFor(bank, group) {
	return bank?.availability?.[group] || { label: 'Not Available', units: 0 };
}

export default function FindBloodPage() {
	const [bloodGroup, setBloodGroup] = useState('O+');
	const [locationText, setLocationText] = useState('');
	const [radius, setRadius] = useState('25 km');
	const [coords, setCoords] = useState({ latitude: null, longitude: null });
	const [locStatus, setLocStatus] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [banks, setBanks] = useState([]);
	const [donors, setDonors] = useState([]);
	const [searched, setSearched] = useState(false);

	async function runSearch(overrides = {}) {
		const params = {
			bloodGroup: overrides.bloodGroup ?? bloodGroup,
			radius: overrides.radius ?? radius,
			latitude: overrides.latitude ?? coords.latitude,
			longitude: overrides.longitude ?? coords.longitude,
			location: overrides.location ?? locationText,
		};
		setLoading(true);
		setError('');
		try {
			const [bRes, dRes] = await Promise.allSettled([
				searchBloodAvailability(params),
				fetchNearbyDonors(params),
			]);
			const b = bRes.status === 'fulfilled' ? (bRes.value?.results || []) : [];
			const d = dRes.status === 'fulfilled' ? (dRes.value || []) : [];
			setBanks(Array.isArray(b) ? b : []);
			setDonors(Array.isArray(d) ? d : []);
			setSearched(true);
		} catch (e) {
			setError(e?.message || 'Unable to retrieve blood availability.');
			setBanks([]);
			setDonors([]);
			setSearched(true);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { runSearch({}); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

	async function useMyLocation() {
		setLocStatus('Requesting location...');
		try {
			const loc = await getBrowserLocation();
			setCoords({ latitude: loc.latitude, longitude: loc.longitude });
			if (loc.city) setLocationText(loc.city);
			setLocStatus(loc.city ? `Using current location (${loc.city})` : 'Using current location');
			await runSearch({ latitude: loc.latitude, longitude: loc.longitude, location: loc.city || locationText });
		} catch (e) {
			setLocStatus('Location permission denied. Enter location manually.');
		}
	}

	const visibleBanks = useMemo(() => {
		return banks.filter((b) => {
			const a = availabilityFor(b, bloodGroup);
			// show all banks but availability reflects selected group; don't fabricate
			return true;
		});
	}, [banks, bloodGroup]);

	return (
		<div className="min-h-screen bg-blood-radial text-slate-100">
			<div className="section-shell py-8 sm:py-10">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">Search</p>
						<h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Find Blood</h1>
						<p className="mt-2 max-w-2xl text-slate-300">Search registered blood banks and compatible donors by blood group and location. Availability shown is from live inventory records when available.</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<Link to="/dashboard" className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Dashboard</Link>
						<Link to="/emergency-request" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white"><AlertTriangle className="h-4 w-4" />Emergency Request</Link>
					</div>
				</div>

				<section className="mt-8 glass-card rounded-[2rem] p-5 sm:p-6">
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
						<label className="block">
							<span className="mb-2 block text-sm font-medium text-slate-200">Blood group</span>
							<select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-rose-400/40">
								{BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
							</select>
						</label>
						<label className="block xl:col-span-2">
							<span className="mb-2 block text-sm font-medium text-slate-200">Location (city/area)</span>
							<input value={locationText} onChange={(e) => setLocationText(e.target.value)} placeholder="City, area, or hospital location" className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-rose-400/40" />
						</label>
						<label className="block">
							<span className="mb-2 block text-sm font-medium text-slate-200">Search radius</span>
							<select value={radius} onChange={(e) => setRadius(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-rose-400/40">
								{RADII.map((r) => <option key={r} value={r}>{r}</option>)}
							</select>
						</label>
						<div className="flex items-end gap-2">
							<button type="button" onClick={() => runSearch({})} disabled={loading} className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
								{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}Search
							</button>
						</div>
					</div>
					<div className="mt-4 flex flex-wrap items-center gap-3">
						<button type="button" onClick={useMyLocation} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"><Navigation2 className="h-4 w-4" />Use My Location</button>
						{locStatus ? <span className="text-sm text-slate-300">{locStatus}</span> : null}
						{coords.latitude != null ? <span className="text-xs text-emerald-300">GPS coordinates set</span> : null}
					</div>
				</section>

				{error ? (
					<div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
				) : null}

				{loading ? (
					<div className="mt-10 flex items-center justify-center gap-3 text-slate-300"><LoaderCircle className="h-5 w-5 animate-spin" />Searching...</div>
				) : (
					<div className="mt-8 grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
						<section>
							<div className="flex items-center justify-between">
								<h2 className="text-xl font-semibold text-white">Blood banks</h2>
								<span className="text-sm text-slate-400">{visibleBanks.length} result{visibleBanks.length === 1 ? '' : 's'}</span>
							</div>
							{searched && visibleBanks.length === 0 ? (
								<div className="mt-4 glass-card rounded-[2rem] p-8 text-center">
									<Building2 className="mx-auto h-10 w-10 text-slate-500" />
									<p className="mt-4 text-lg font-semibold text-white">No blood banks found</p>
									<p className="mt-2 text-slate-300">Try a different location, larger radius, or create an emergency request.</p>
									<div className="mt-5 flex flex-wrap justify-center gap-3">
										<button type="button" onClick={() => { setRadius('100 km'); runSearch({ radius: '100 km' }); }} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">Expand radius</button>
										<Link to="/emergency-request" className="rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2 text-sm font-semibold text-white">Create Emergency Request</Link>
									</div>
								</div>
							) : (
								<div className="mt-4 space-y-4">
									{visibleBanks.map((b) => {
										const a = availabilityFor(b, bloodGroup);
										const unitsKnown = typeof a.units === 'number';
										return (
											<article key={b.id} className="glass-card rounded-[1.75rem] p-5 sm:p-6">
												<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
													<div>
														<div className="flex flex-wrap items-center gap-2">
															<h3 className="text-xl font-semibold text-white">{b.name}</h3>
															{b.verified ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" />Verified</span> : <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-300">Unverified</span>}
														</div>
														<p className="mt-1 text-sm text-slate-300">{b.address || b.city || 'Address not available'}</p>
														<div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-400">
															{b.distanceLabel || b.distance ? <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4 text-rose-300" />{b.distanceLabel || b.distance}</span> : null}
															{b.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4 text-rose-300" />{b.phone}</span> : null}
														</div>
													</div>
													<div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4 sm:min-w-[220px]">
														<p className="text-xs uppercase tracking-[0.25em] text-slate-400">{bloodGroup} availability</p>
														<p className={`mt-2 text-lg font-semibold ${a.label === 'Available' ? 'text-emerald-300' : a.label === 'Low Stock' ? 'text-amber-300' : 'text-slate-300'}`}>{a.label}</p>
														<p className="mt-1 text-sm text-slate-300">{unitsKnown ? `${a.units} unit(s) reported` : 'Units not reported'}</p>
														<p className="mt-2 text-xs text-slate-500">Updated: {b.updated || '—'}</p>
													</div>
												</div>
												<div className="mt-4 flex flex-wrap gap-2">
													<Link to={`/blood-banks/${b.id}`} className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">View Details</Link>
													<Link to="/request-blood" state={{ bloodGroup, bloodBank: b }} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Request Blood</Link>
													{b.phone ? <a href={`tel:${b.phone}`} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Contact</a> : null}
													<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([b.name, b.address, b.city].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Directions</a>
												</div>
												<p className="mt-3 text-xs text-slate-500">Actual blood issue requires authorized blood bank confirmation and laboratory crossmatching.</p>
											</article>
										);
									})}
								</div>
							)}
						</section>

						<aside className="space-y-4">
							<section className="glass-card rounded-[2rem] p-6">
								<h2 className="text-xl font-semibold text-white">Compatible donors</h2>
								<p className="mt-1 text-sm text-slate-400">Donors matching {bloodGroup} compatibility from registered records.</p>
								{donors.length === 0 ? (
									<p className="mt-4 rounded-2xl border border-dashed border-white/15 bg-slate-950/30 px-4 py-5 text-sm text-slate-300">No compatible donors found for this search. Try expanding the radius or submitting an emergency request.</p>
								) : (
									<ul className="mt-4 space-y-3">
										{donors.slice(0, 10).map((d, i) => (
											<li key={d.id || d._id || i} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
												<div className="flex items-center justify-between gap-2">
													<p className="font-semibold text-white">{d.displayName || d.name || 'Donor'}</p>
													<span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">{d.bloodGroup}</span>
												</div>
												<p className="mt-1 text-sm text-slate-400">{d.city || d.area || 'Location not specified'}{d.distanceKm != null ? ` · ${Number(d.distanceKm).toFixed(1)} km` : ''}</p>
												<p className="mt-1 text-xs text-slate-400">{(d.available ?? d.isAvailable) ? 'Available' : 'Availability not confirmed'}{d.verified ? ' · Verified' : ''}</p>
											</li>
										))}
									</ul>
								)}
								<Link to="/find-donor" className="mt-4 inline-flex items-center text-sm font-semibold text-rose-200 hover:text-white">Open Find Donor</Link>
							</section>
							<section className="glass-card rounded-[2rem] p-6">
								<h3 className="text-lg font-semibold text-white">Need help now?</h3>
								<p className="mt-2 text-sm text-slate-300">Create an emergency request to notify matching donors and blood banks through the system.</p>
								<Link to="/emergency-request" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950">Create Emergency Request</Link>
							</section>
						</aside>
					</div>
				)}
			</div>
		</div>
	);
}
