export default function UnsavedChangesDialog({ open, onStay, onLeave }) {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="unsaved-title">
			<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
				<h3 id="unsaved-title" className="text-lg font-semibold text-slate-900">You have unsaved changes</h3>
				<p className="mt-1 text-sm text-slate-600">Are you sure you want to leave this page? Your changes will be lost.</p>
				<div className="mt-5 flex flex-wrap justify-end gap-2">
					<button type="button" onClick={onStay} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Stay</button>
					<button type="button" onClick={onLeave} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700">Leave Without Saving</button>
				</div>
			</div>
		</div>
	);
}
