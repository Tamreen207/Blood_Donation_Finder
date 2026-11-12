function Skeleton({ className = '' }) {
	return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;
}

export default function BloodBankDashboardSkeleton() {
	return (
		<div className="space-y-5">
			<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
				<div className="flex items-start gap-4">
					<Skeleton className="h-12 w-12 rounded-xl" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-3 w-32" />
						<Skeleton className="h-6 w-64" />
						<Skeleton className="h-4 w-80" />
					</div>
				</div>
			</div>

			<Skeleton className="h-20 w-full rounded-2xl" />

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
			</div>

			<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<Skeleton className="h-72 w-full rounded-2xl" />
				<Skeleton className="h-72 w-full rounded-2xl" />
			</div>
			<Skeleton className="h-56 w-full rounded-2xl" />
		</div>
	);
}
