import { Router } from 'express';
import {
	getMyBank,
	updateMyBank,
	getBloodBankById,
	listBloodBanks,
	getNearbyBloodBanks,
} from '../controllers/bloodBankController.js';
import {
	listBankRequests,
	bankRequestsSummary,
	getRequest,
	getRequestActivity,
	bankRespond,
} from '../controllers/requestController.js';
import {
	listBankDonations,
	bankDonationsSummary,
	getBankDonation,
	getDonationActivity,
	listBankDonors,
	createBankDonation,
	transitionBankDonation,
} from '../controllers/bloodBankDonationController.js';
import { authRequired } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = Router();
router.get('/', listBloodBanks);
router.get('/nearby', getNearbyBloodBanks);
router.get('/me', authRequired, requireRole('bloodbank'), getMyBank);
router.put('/me', authRequired, requireRole('bloodbank'), updateMyBank);
router.get('/me/requests/summary', authRequired, requireRole('bloodbank'), bankRequestsSummary);
router.get('/me/requests', authRequired, requireRole('bloodbank'), listBankRequests);
router.get('/me/requests/:id', authRequired, requireRole('bloodbank'), getRequest);
router.get('/me/requests/:id/activity', authRequired, requireRole('bloodbank'), getRequestActivity);
router.post('/me/requests/:id/respond', authRequired, requireRole('bloodbank'), bankRespond);
router.get('/me/donations/summary', authRequired, requireRole('bloodbank'), bankDonationsSummary);
router.get('/me/donors', authRequired, requireRole('bloodbank'), listBankDonors);
router.get('/me/donations', authRequired, requireRole('bloodbank'), listBankDonations);
router.post('/me/donations', authRequired, requireRole('bloodbank'), createBankDonation);
router.get('/me/donations/:id', authRequired, requireRole('bloodbank'), getBankDonation);
router.get('/me/donations/:id/activity', authRequired, requireRole('bloodbank'), getDonationActivity);
router.post('/me/donations/:id/transition', authRequired, requireRole('bloodbank'), transitionBankDonation);
router.get('/:id', getBloodBankById);

export default router;
