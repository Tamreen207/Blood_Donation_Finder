import { Router } from 'express';
import {
	getMyDonorProfile,
	updateMyDonorProfile,
	setAvailability,
	getDonorById,
	searchDonors,
	getNearbyDonors,
} from '../controllers/donorController.js';
import { authRequired } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();
router.use(authRequired);
router.get('/me', requireRole('donor'), getMyDonorProfile);
router.put('/me', requireRole('donor'), updateMyDonorProfile);
router.put('/me/availability', requireRole('donor'), setAvailability);
router.get('/', searchDonors);
router.get('/nearby', getNearbyDonors);
router.get('/:id', getDonorById);

export default router;
