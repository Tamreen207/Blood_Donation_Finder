import { User } from '../models/User.js';
import { Donor } from '../models/Donor.js';
import { BloodBank } from '../models/BloodBank.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';

function buildProfile(user) {
	return {
		_id: user._id,
		name: user.name,
		email: user.email,
		phone: user.phone || '',
		role: user.role,
		city: user.city || '',
		isActive: user.isActive,
		isVerified: user.isVerified,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
	};
}

export const getMyProfile = asyncHandler(async (req, res) => {
	const user = req.user;
	const profile = buildProfile(user);
	if (user.role === 'donor') {
		const donor = await Donor.findOne({ userId: user._id });
		profile.donor = donor ? {
			bloodGroup: donor.bloodGroup,
			availability: donor.isAvailable ? 'AVAILABLE' : 'NOT_AVAILABLE',
			isAvailable: donor.isAvailable,
			isVerified: donor.isVerified,
			totalDonations: donor.totalDonations || 0,
			lastDonationDate: donor.lastDonationDate || null,
			preferredLocation: donor.location || donor.city || '',
			phone: donor.phone || user.phone || '',
		} : null;
	}
	if (user.role === 'bloodbank') {
		const bank = await BloodBank.findOne({ userId: user._id });
		profile.bloodBank = bank || null;
	}
	res.json({ success: true, data: profile });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
	const user = req.user;
	const allowedUser = ['name', 'email', 'phone', 'city'];
	allowedUser.forEach((k) => { if (req.body[k] !== undefined) user[k] = req.body[k]; });
	await user.save();

	if (user.role === 'donor' && req.body.donor) {
		const donor = await Donor.findOne({ userId: user._id });
		if (donor) {
			const d = req.body.donor;
			if (d.bloodGroup !== undefined) donor.bloodGroup = d.bloodGroup;
			if (d.isAvailable !== undefined) donor.isAvailable = d.isAvailable;
			if (d.preferredLocation !== undefined) donor.location = d.preferredLocation;
			await donor.save();
		}
	}
	res.json({ success: true, data: buildProfile(user), message: 'Profile updated' });
});

export const updateDonorStatus = asyncHandler(async (req, res) => {
	const { isAvailable } = req.body;
	if (typeof isAvailable !== 'boolean') throw new ApiError(400, 'isAvailable boolean required');
	const donor = await Donor.findOneAndUpdate({ userId: req.user._id }, { isAvailable }, { new: true });
	if (!donor) throw new ApiError(404, 'Donor profile not found');
	res.json({ success: true, data: { isAvailable: donor.isAvailable }, message: 'Availability updated' });
});

export const updatePreferences = asyncHandler(async (req, res) => {
	// Preferences are accepted and acknowledged (persistence handled client-side for demo).
	res.json({ success: true, data: req.body, message: 'Preferences updated' });
});

export const uploadProfilePhoto = asyncHandler(async (req, res) => {
	// No file storage configured; acknowledge with a placeholder URL.
	res.json({ success: true, data: { photoUrl: '' }, message: 'Photo upload is not configured' });
});

export const deleteProfilePhoto = asyncHandler(async (_req, res) => {
	res.json({ success: true, message: 'Photo removed' });
});

export const deleteMyAccount = asyncHandler(async (req, res) => {
	req.user.isActive = false;
	await req.user.save();
	res.json({ success: true, message: 'Account deactivated' });
});