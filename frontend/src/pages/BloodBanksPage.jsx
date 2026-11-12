import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, LoaderCircle, MapPin, Phone, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function normalizeBank(b) {
	const inventory = Array.isArray(b.inventory) ? b.inventory : [];
	const available = inventory.filter((i) => (i.unitsAvailable ?? 0) > 0).map((i) => i.bloodGroup);
	return {
		id: b._id || b.id,
		name: b.name || 'Blood Bank',
		address: b.address || '',
		city: b.city || '',
		district: b.district || '',
		state: b.state || '',
		phone: b.phone || b.emergencyPhone || '',
		verified: Boolean(b.isVerified || b.verification?.status === 'VERIFIED'),
		openingHours: b.openingHours || 'Contact for hours',
		distance: b.distance,
		updatedAt: b.updatedAt,
		available,
		inventory,
	};
}

export default function BloodBanksPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [banks, setBanks] = useState([]);
	const [query, setQuery] = useState('');
	const [city, setCity] = useState('');

	async function load() {
		if (!API_BASE_URL) {
			setError('API is not configured (VITE_API_BASE_URL).');
			setLoading(false);
			return;
		}
		setLoading(true);
		setError('');
		try {
			const params = new URLSearchParams();
			if (city.trim()) params.set('city', city.trim());
			const res = await fetch(`${API_BASE_URL}/api/blood-banks${params.toString() ? `?${params}` : ''}`);
			const json = await res.json().catch(() => null);
			if (!res.ok) throw new Error(json?.message || 'Failed to load blood banks');
			const list = Array.isArray(json?.data) ? json.data : [];
			setBanks(list.map(normalizeBank));
		} catch (err) {
			setError(err?.message || 'Unable to load blood banks.');
			setBanks([]);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return banks;
		return banks.filter((b) => [b.name, b.address, b.city, b.district, b.state].some((v) => String(v || '').toLowerCase().includes(q)));
	}, [banks, query]);

	return (
		<div className="min-h-screen bg-blood-radial text-slate-100">
			<div className="section-shell py-10">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">Directory</p>
						<h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Blood Banks</h1>
						<p className="mt-2 text-slate-300">Browse registered blood banks and view available inventory from live records.</p>
					</div>
					<Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">Home</Link>
				</div>

				<div className="mt-8 glass-card rounded-[2rem] p-4 sm:p-6">
					<div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
						<label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
							<Search className="h-4 w-4 text-slate-400" />
							<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, address, district..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
						</label>
						<label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
							<MapPin className="h-4 w-4 text-slate-400" />
							<input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (server filter)" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
						</label>
						<button type="button" onClick={load} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-5 py-3 text-sm font-semibold text-white">Apply</button>
					</div>
				</div>

				{loading ? (
					<div className="mt-10 flex items-center justify-center gap-3 text-slate-300"><LoaderCircle className="h-5 w-5 animate-spin" />Loading blood banks...</div>
				) : error ? (
					<div className="mt-10 glass-card rounded-[2rem] p-8 text-center">
						<p className="text-lg font-semibold text-white">Unable to load blood banks</p>
						<p className="mt-2 text-slate-300">{error}</p>
						<button type="button" onClick={load} className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950">Try again</button>
					</div>
				) : filtered.length === 0 ? (
					<div className="mt-10 glass-card rounded-[2rem] p-8 text-center">
						<Building2 className="mx-auto h-10 w-10 text-slate-500" />
						<p className="mt-4 text-lg font-semibold text-white">No blood banks found</p>
						<p className="mt-2 text-slate-300">No registered blood banks match your search, or none are available yet.</p>
					</div>
				) : (
					<div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
						{filtered.map((b) => (
							<article key={b.id} className="glass-card rounded-[1.75rem] p-6">
								<div className="flex items-start justify-between gap-3">
									<div>
										<h2 className="text-xl font-semibold text-white">{b.name}</h2>
										<p className="mt-1 text-sm text-slate-300">{[b.address, b.city, b.district, b.state].filter(Boolean).join(', ') || 'Address not available'}</p>
									</div>
									{b.verified ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" />Verified</span> : <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-300">Unverified</span>}
								</div>
								<div className="mt-4 space-y-2 text-sm text-slate-300">
									{b.phone ? <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-rose-300" />{b.phone}</p> : null}
									<p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-rose-300" />{b.distance != null ? `${Number(b.distance).toFixed(1)} km away` : 'Distance unavailable'}</p>
									<p className="text-slate-400">Hours: {b.openingHours}</p>
								</div>
								<div className="mt-4">
									<p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available groups (from inventory)</p>
									<div className="mt-2 flex flex-wrap gap-2">
										{b.available.length ? b.available.map((g) => <span key={g} className="rounded-full border border-rose-400/20 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-100">{g}</span>) : <span className="text-sm text-slate-400">No available stock reported</span>}
									</div>
								</div>
								<div className="mt-5 flex flex-wrap gap-2">
									<Link to={`/blood-banks/${b.id}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">View Details <ArrowRight className="h-4 w-4" /></Link>
									{b.phone ? <a href={`tel:${b.phone}`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">Contact</a> : null}
									<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([b.name, b.address, b.city, b.state].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">Directions</a>
								</div>
							</article>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
