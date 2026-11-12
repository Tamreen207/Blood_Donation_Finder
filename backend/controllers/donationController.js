import { Donation } from '../models/Donation.js';
import { Donor } from '../models/Donor.js';
import { BloodBank } from '../models/BloodBank.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';

export const createDonation = asyncHandler(async (req, res) => {
	const donor = await Donor.findOne({ userId: req.user._id });
	if (!donor) throw new ApiError(404, 'Donor profile not found');
	const donation = await Donation.create({
		donorId: donor._id,
		donorUserId: req.user._id,
		bloodBankId: req.body.bloodBankId,
		bloodGroup: req.body.bloodGroup || donor.bloodGroup,
		units: req.body.units || 1,
		notes: req.body.notes || '',
	});
	donor.totalDonations = (donor.totalDonations || 0) + 1;
	donor.lastDonationDate = new Date();
	await donor.save();
	res.status(201).json({ success: true, data: donation });
});

export const listMyDonations = asyncHandler(async (req, res) => {
	const donor = await Donor.findOne({ userId: req.user._id });
	if (!donor) return res.json({ success: true, data: [] });
	const items = await Donation.find({ donorId: donor._id }).sort({ donationDate: -1 }).limit(50);
	res.json({ success: true, data: items });
});

export const listAllDonations = asyncHandler(async (_req, res) => {
	const items = await Donation.find().sort({ donationDate: -1 }).limit(200);
	res.json({ success: true, data: items });
});

export const getDonation = asyncHandler(async (req, res) => {
	const d = await Donation.findById(req.params.id);
	if (!d) throw new ApiError(404, 'Donation not found');
	res.json({ success: true, data: d });
});
