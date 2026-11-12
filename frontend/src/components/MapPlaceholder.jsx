import { MapPin, Navigation2 } from 'lucide-react';

export default function MapPlaceholder({
	title = 'Map view',
	subtitle = 'Map integration ready for Google Maps, Mapbox, or OpenStreetMap.',
	tags = ['Current location', 'Blood bank markers', 'Donor markers'],
}) {
	return (
		<div className="glass-card overflow-hidden rounded-[2rem] p-5 sm:p-6">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200/80">Map area</p>
					<h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
				</div>
				<div className="rounded-2xl bg-rose-500/10 p-3 text-rose-200">
					<MapPin className="h-5 w-5" aria-hidden="true" />
				</div>
			</div>

			<div className="mt-5 rounded-[1.75rem] border border-dashed border-white/15 bg-slate-950/40 p-6">
				<div className="flex min-h-[280px] flex-col items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-white/5 via-slate-950/40 to-white/5 p-6 text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 text-rose-200">
						<Navigation2 className="h-8 w-8" aria-hidden="true" />
					</div>
					<p className="mt-5 text-lg font-semibold text-white">Interactive map placeholder</p>
					<p className="mt-3 max-w-md text-sm leading-6 text-slate-300">{subtitle}</p>
					<div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
						{tags.map((tag) => (
							<span key={tag} className="rounded-full bg-white/5 px-3 py-1">
								{tag}
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
