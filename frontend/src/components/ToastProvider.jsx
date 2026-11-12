import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { subscribeToasts } from '../utils/toast';

const ToastContext = createContext({ toast: () => {} });

let counter = 0;

export function ToastProvider({ children }) {
	const [items, setItems] = useState([]);

	const dismiss = useCallback((id) => {
		setItems((current) => current.filter((t) => t.id !== id));
	}, []);

	const toast = useCallback((message, type = 'info', duration = 3000) => {
		counter += 1;
		const id = `toast-${counter}`;
		setItems((current) => [...current, { id, message, type, duration }]);
		window.setTimeout(() => dismiss(id), duration);
		return id;
	}, [dismiss]);

	useEffect(() => {
		return subscribeToasts((t) => {
			counter += 1;
			const id = t.id || `toast-${counter}`;
			setItems((current) => [...current, { ...t, id }]);
			window.setTimeout(() => dismiss(id), t.duration || 3000);
		});
	}, [dismiss]);

	const value = useMemo(() => ({ toast }), [toast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
				{items.map((t) => (
					<div
						key={t.id}
						role="status"
						aria-live="polite"
						className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur-xl ${toneClasses(t.type)}`}
					>
						<IconFor type={t.type} />
						<p className="flex-1 text-white">{t.message}</p>
						<button type="button" onClick={() => dismiss(t.id)} className="rounded-full p-1 text-slate-300 hover:bg-white/10" aria-label="Dismiss notification">
							<X className="h-3.5 w-3.5" />
						</button>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

function toneClasses(type) {
	if (type === 'success') return 'border-emerald-400/30 bg-emerald-500/15';
	if (type === 'error') return 'border-rose-400/30 bg-rose-500/15';
	if (type === 'warning') return 'border-amber-400/30 bg-amber-500/15';
	return 'border-sky-400/30 bg-sky-500/15';
}

function IconFor({ type }) {
	if (type === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-200" aria-hidden="true" />;
	if (type === 'error') return <AlertTriangle className="h-4 w-4 text-rose-200" aria-hidden="true" />;
	if (type === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-200" aria-hidden="true" />;
	return <Info className="h-4 w-4 text-sky-200" aria-hidden="true" />;
}

export function useToast() {
	return useContext(ToastContext);
}
