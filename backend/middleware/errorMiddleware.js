export function notFound(req, res, _next) {
	res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, _req, res, _next) {
	const status = err.status || err.statusCode || 500;
	const message = err.message || 'Internal server error';
	if (status >= 500) {
		console.error('[error]', err);
	}
	res.status(status).json({ success: false, message, data: err.data || undefined });
}

export function asyncHandler(fn) {
	return function wrapped(req, res, next) {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}

export class ApiError extends Error {
	constructor(status, message, data) {
		super(message);
		this.status = status;
		this.data = data;
	}
}
