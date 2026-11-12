import { Router } from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { createDonation, listMyDonations, listAllDonations, getDonation } from '../controllers/donationController.js';

const router = Router();
router.use(authRequired);
router.post('/', requireRole('donor'), createDonation);
router.get('/mine', requireRole('donor'), listMyDonations);
router.get('/', requireRole('admin'), listAllDonations);
router.get('/:id', getDonation);

export default router;
