import { Router } from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { matchDonors, matchBloodBanks } from '../controllers/matchingController.js';

const router = Router();
router.use(authRequired);
router.get('/donors', matchDonors);
router.get('/blood-banks', matchBloodBanks);

export default router;
