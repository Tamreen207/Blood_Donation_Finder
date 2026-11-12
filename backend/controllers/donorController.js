import { Donor } from '../models/Donor.js';
import { User } from '../models/User.js';
import { findMatchingDonors } from '../services/matchingService.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';

export const getMyDonorProfile = asyncHandler(async (req, res) => {
	const profile = await Donor.findOne({ userId: req.user._id });
	if (!profile) throw new ApiError(404, 'Donor profile not found');
	res.json({ success: true, data: profile });
});

export const updateMyDonorProfile = asyncHandler(async (req, res) => {
	const allowed = ['age', 'gender', 'bloodGroup', 'city', 'location', 'latitude', 'longitude', 'phone', 'lastDonationDate'];
	const update = {};
	allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
	const profile = await Donor.findOneAndUpdate({ userId: req.user._id }, update, { new: true });
	if (!profile) throw new ApiError(404, 'Donor profile not found');
	if (update.bloodGroup) await User.findByIdAndUpdate(req.user._id, {});
	res.json({ success: true, data: profile });
});

export const setAvailability = asyncHandler(async (req, res) => {
	const { isAvailable } = req.body;
	if (typeof isAvailable !== 'boolean') throw new ApiError(400, 'isAvailable boolean required');
	const profile = await Donor.findOneAndUpdate({ userId: req.user._id }, { isAvailable }, { new: true });
	if (!profile) throw new ApiError(404, 'Donor profile not found');
	res.json({ success: true, data: profile });
});

export const getDonorById = asyncHandler(async (req, res) => {
	const profile = await Donor.findById(req.params.id);
	if (!profile) throw new ApiError(404, 'Donor not found');
	const user = await User.findById(profile.userId);
	res.json({ success: true, data: { ...profile.toObject(), user: user ? user.toSafeJSON() : null } });
});

export const searchDonors = asyncHandler(async (req, res) => {
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
	const userIds = matches.map((m) => m.donor.userId);
	const users = await User.find({ _id: { $in: userIds } });
	const byId = new Map(users.map((u) => [String(u._id), u]));
	const result = matches.map((m) => {
		const u = byId.get(String(m.donor.userId));
		return {
			id: m.donor._id,
			userId: m.donor.userId,
			displayName: u?.name?.split(' ')[0] || 'Donor',
			fullName: u?.name,
			bloodGroup: m.donor.bloodGroup,
			verified: m.donor.isVerified,
			available: m.donor.isAvailable,
			distanceKm: m.distance,
			city: m.donor.city,
			area: m.donor.location || m.donor.city || '',
			lastDonation: m.donor.lastDonationDate,
			score: m.score,
		};
	});
	res.json({ success: true, data: result });
});

export const getNearbyDonors = searchDonors;
