import { Router } from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import {
	createRequest,
	listRequests,
	getRequest,
	updateRequest,
	cancelRequest,
	respondToRequest,
	getRequestActivity,
} from '../controllers/requestController.js';
import { matchDonors, matchBloodBanks } from '../controllers/matchingController.js';
import { BloodRequest } from '../models/BloodRequest.js';
import { asyncHandler, ApiError } from '../middleware/errorMiddleware.js';
import { findMatchingDonors, findMatchingBloodBanks } from '../services/matchingService.js';

const router = Router();
router.use(authRequired);
router.post('/', createRequest);
router.get('/', listRequests);
router.get('/:id/matches', asyncHandler(async (req, res) => {
	const request = await BloodRequest.findById(req.params.id);
	if (!request) throw new ApiError(404, 'Request not found');
	const [donors, banks] = await Promise.all([
		findMatchingDonors({ bloodGroup: request.bloodGroup, latitude: request.latitude, longitude: request.longitude, radiusKm: 25, urgency: request.urgency || 'MEDIUM', limit: 20 }),
		findMatchingBloodBanks({ bloodGroup: request.bloodGroup, latitude: request.latitude, longitude: request.longitude, radiusKm: 25, limit: 20 }),
	]);
	res.json({ success: true, data: { donors, banks } });
}));
router.get('/:id/activity', getRequestActivity);
router.get('/:id', getRequest);
router.put('/:id', updateRequest);
router.delete('/:id', cancelRequest);
router.post('/:id/respond', respondToRequest);

export default router;
