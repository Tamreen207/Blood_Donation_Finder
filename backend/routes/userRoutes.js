import { Router } from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import {
	getMyProfile,
	updateMyProfile,
	updateDonorStatus,
	updatePreferences,
	uploadProfilePhoto,
	deleteProfilePhoto,
	deleteMyAccount,
} from '../controllers/userController.js';

const router = Router();
router.use(authRequired);

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
router.patch('/me/donor-status', updateDonorStatus);
router.patch('/me/preferences', updatePreferences);
router.post('/me/profile-photo', uploadProfilePhoto);
router.delete('/me/profile-photo', deleteProfilePhoto);
router.delete('/me', deleteMyAccount);

export default router;