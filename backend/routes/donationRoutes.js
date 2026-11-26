import { Router } from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
	createDonation,
	listMyDonations,
	listAllDonations,
	getDonation,
	myDonationHistory,
	getDonationByIdForMe,
	donationStatistics,
	donationEligibility,
	upcomingDonation,
	recordDonation,
	cancelDonation,
	exportDonations,
} from '../controllers/donationController.js';

const router = Router();
router.use(authRequired);

// Donor self-service endpoints (must be declared before /:id)
router.get('/my-history', myDonationHistory);
router.get('/my-history/:id', getDonationByIdForMe);
router.get('/statistics', donationStatistics);
router.get('/eligibility', donationEligibility);
router.get('/upcoming', upcomingDonation);
router.post('/record', requireRole('donor'), recordDonation);
router.get('/export', exportDonations);

router.post('/', requireRole('donor'), createDonation);
router.get('/mine', requireRole('donor'), listMyDonations);
router.get('/', requireRole('admin'), listAllDonations);
router.patch('/:id/cancel', cancelDonation);
router.get('/:id', getDonation);

export default router;