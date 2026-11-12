import { Router } from 'express';
import { listBloodBanks, getBloodBankById, getNearbyBloodBanks } from '../controllers/bloodBankController.js';
import { searchDonors } from '../controllers/donorController.js';

const router = Router();
// Public read endpoints - no auth required for the marketing/landing pages
router.get('/blood-banks', listBloodBanks);
router.get('/blood-banks/nearby', getNearbyBloodBanks);
router.get('/blood-banks/:id', getBloodBankById);
router.get('/donors', searchDonors);

export default router;
