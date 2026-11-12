import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';

export async function authRequired(req, res, next) {
	try {
		const header = req.headers.authorization || '';
		const [scheme, token] = header.split(' ');
		if (scheme !== 'Bearer' || !token) {
			return res.status(401).json({ success: false, message: 'Authentication required' });
		}
		const decoded = verifyToken(token);
		const user = await User.findById(decoded.id);
		if (!user || !user.isActive) {
			return res.status(401).json({ success: false, message: 'Invalid or inactive account' });
		}
		req.user = user;
		return next();
	} catch (err) {
		return res.status(401).json({ success: false, message: 'Invalid or expired token' });
	}
}

export function authOptional(req, _res, next) {
	try {
		const header = req.headers.authorization || '';
		const [scheme, token] = header.split(' ');
		if (scheme === 'Bearer' && token) {
			const decoded = verifyToken(token);
			User.findById(decoded.id).then((u) => {
				if (u && u.isActive) req.user = u;
				next();
			}).catch(() => next());
		} else next();
	} catch (_) {
		next();
	}
}
