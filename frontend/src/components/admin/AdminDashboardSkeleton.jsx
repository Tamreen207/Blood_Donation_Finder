function Skeleton({ className = '' }) {
	return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;
}

export default function AdminDashboardSkeleton() {
	return (
		<div className="space-y-5">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
				{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
			</div>
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<Skeleton className="h-64 w-full rounded-2xl" />
				<Skeleton className="h-64 w-full rounded-2xl" />
			</div>
			<Skeleton className="h-72 w-full rounded-2xl" />
		</div>
	);
}
