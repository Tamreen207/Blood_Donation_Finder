import { BloodRequest } from '../models/BloodRequest.js';
import { Donor } from '../models/Donor.js';
import { BloodBank } from '../models/BloodBank.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';
import { findMatchingDonors, findMatchingBloodBanks } from '../services/matchingService.js';

export const matchDonors = asyncHandler(async (req, res) => {
	const { bloodGroup, latitude, longitude, radiusKm, urgency } = req.query;
	if (!bloodGroup) throw new ApiError(400, 'bloodGroup is required');
	const matches = await findMatchingDonors({
		bloodGroup,
		latitude: latitude ? Number(latitude) : null,
		longitude: longitude ? Number(longitude) : null,
		radiusKm: radiusKm ? Number(radiusKm) : 10,
		urgency: urgency || 'MEDIUM',
		limit: 50,
	});
	res.json({ success: true, data: matches.map((m) => ({ donorId: m.donor._id, distance: m.distance, score: m.score, bloodGroup: m.donor.bloodGroup, city: m.donor.city, isAvailable: m.donor.isAvailable })) });
});

export const matchBloodBanks = asyncHandler(async (req, res) => {
	const { bloodGroup, latitude, longitude, radiusKm } = req.query;
	if (!bloodGroup) throw new ApiError(400, 'bloodGroup is required');
	const matches = await findMatchingBloodBanks({
		bloodGroup,
		latitude: latitude ? Number(latitude) : null,
		longitude: longitude ? Number(longitude) : null,
		radiusKm: radiusKm ? Number(radiusKm) : 10,
	});
	res.json({ success: true, data: matches });
});
