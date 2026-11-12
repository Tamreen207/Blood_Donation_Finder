function Skeleton({ className = '' }) {
	return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;
}

export default function DonationSkeleton() {
	return (
		<div className="space-y-5">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
			</div>
			<Skeleton className="h-24 w-full rounded-2xl" />
			<Skeleton className="h-16 w-full rounded-2xl" />
			<div className="space-y-2">
				{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
			</div>
		</div>
	);
}
