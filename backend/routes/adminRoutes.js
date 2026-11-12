import { Router } from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
	getDashboard,
	listUsers,
	verifyUser,
	setUserStatus,
	verifyBloodBank,
	listBloodBanksAdmin,
	listRequestsAdmin,
	getAnalytics,
	getSystemHealth,
} from '../controllers/adminController.js';

const router = Router();
router.use(authRequired, requireRole('admin'));
router.get('/dashboard', getDashboard);
router.get('/dashboard/health', getSystemHealth);
router.get('/users', listUsers);
router.put('/users/:id/verify', verifyUser);
router.put('/users/:id/status', setUserStatus);
router.get('/blood-banks', listBloodBanksAdmin);
router.put('/blood-banks/:id/verify', verifyBloodBank);
router.get('/requests', listRequestsAdmin);
router.get('/analytics', getAnalytics);

export default router;
