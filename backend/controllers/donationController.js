import { Donation } from '../models/Donation.js';
import { Donor } from '../models/Donor.js';
import { BloodBank } from '../models/BloodBank.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';

const MIN_INTERVAL_DAYS = 90;

const FRONTEND_STATUS = {
	SCHEDULED: 'SCHEDULED',
	CHECKED_IN: 'SCHEDULED',
	SCREENING: 'SCHEDULED',
	APPROVED: 'SCHEDULED',
	COLLECTED: 'COMPLETED',
	COMPLETED: 'COMPLETED',
	REJECTED: 'CANCELLED',
	DEFERRED: 'CANCELLED',
	CANCELLED: 'CANCELLED',
};

function toFrontendStatus(status) {
	return FRONTEND_STATUS[status] || 'SCHEDULED';
}

function mapDonation(d, bankName) {
	const obj = d.toObject ? d.toObject() : d;
	return {
		id: obj._id,
		_id: obj._id,
		donationDate: obj.donationDate,
		bloodGroup: obj.bloodGroup,
		donationType: obj.donationType === 'WHOLE_BLOOD' ? 'Whole Blood' : obj.donationType === 'PLASMA' ? 'Plasma' : obj.donationType === 'PLATELETS' ? 'Platelets' : obj.donationType,
		units: obj.units || 1,
		status: toFrontendStatus(obj.status),
		bloodBankName: bankName || 'Blood Bank',
		bloodBankId: obj.bloodBankId,
		location: bankName || '',
		notes: obj.notes || '',
	};
}

async function getDonorForUser(userId) {
	return Donor.findOne({ userId });
}

export const createDonation = asyncHandler(async (req, res) => {
	const donor = await getDonorForUser(req.user._id);
	if (!donor) throw new ApiError(404, 'Donor profile not found');
	const donation = await Donation.create({
		donorId: donor._id,
		donorUserId: req.user._id,
		bloodBankId: req.body.bloodBankId,
		bloodGroup: req.body.bloodGroup || donor.bloodGroup,
		donationType: req.body.donationType || 'WHOLE_BLOOD',
		units: req.body.units || 1,
		notes: req.body.notes || '',
		status: 'COLLECTED',
		donationDate: req.body.donationDate ? new Date(req.body.donationDate) : new Date(),
		completedAt: new Date(),
	});
	donor.totalDonations = (donor.totalDonations || 0) + 1;
	donor.lastDonationDate = donation.donationDate;
	await donor.save();
	res.status(201).json({ success: true, data: donation });
});

export const listMyDonations = asyncHandler(async (req, res) => {
	const donor = await getDonorForUser(req.user._id);
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

// GET /api/donations/my-history?page=1&limit=20
export const myDonationHistory = asyncHandler(async (req, res) => {
	const donor = await getDonorForUser(req.user._id);
	const page = Math.max(1, Number(req.query.page) || 1);
	const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
	if (!donor) {
		return res.json({ success: true, data: { items: [], total: 0, page, limit } });
	}
	const total = await Donation.countDocuments({ donorId: donor._id });
	const items = await Donation.find({ donorId: donor._id })
		.sort({ donationDate: -1 })
		.skip((page - 1) * limit)
		.limit(limit);
	const bankIds = [...new Set(items.map((d) => String(d.bloodBankId)).filter(Boolean))];
	const banks = bankIds.length ? await BloodBank.find({ _id: { $in: bankIds } }, 'name') : [];
	const bankName = new Map(banks.map((b) => [String(b._id), b.name]));
	res.json({
		success: true,
		data: {
			items: items.map((d) => mapDonation(d, bankName.get(String(d.bloodBankId)))),
			total,
			page,
			limit,
		},
	});
});

export const getDonationByIdForMe = asyncHandler(async (req, res) => {
	const donor = await getDonorForUser(req.user._id);
	if (!donor) throw new ApiError(404, 'Donor profile not found');
	const d = await Donation.findOne({ _id: req.params.id, donorId: donor._id });
	if (!d) throw new ApiError(404, 'Donation not found');
	let bankName = '';
	if (d.bloodBankId) {
		const bank = await BloodBank.findById(d.bloodBankId, 'name');
		bankName = bank?.name || '';
	}
	res.json({ success: true, data: mapDonation(d, bankName) });
});

// GET /api/donations/statistics
export const donationStatistics = asyncHandler(async (req, res) => {
	const donor = await getDonorForUser(req.user._id);
	if (!donor) {
		return res.json({ success: true, data: { totalDonations: 0, livesHelped: 0, donationStreak: 0, lastDonationDate: null, nextEligibleDate: null, totalUnits: 0, byMonth: [] } });
	}
	const items = await Donation.find({ donorId: donor._id }).sort({ donationDate: -1 });
	const completed = items.filter((d) => ['COLLECTED', 'COMPLETED'].includes(d.status));
	const totalDonations = donor.totalDonations || completed.length;
	const totalUnits = completed.reduce((sum, d) => sum + (d.units || 1), 0);
	const livesHelped = totalUnits * 3;
	const lastDonationDate = donor.lastDonationDate || completed[0]?.donationDate || null;
	let nextEligibleDate = null;
	if (lastDonationDate) {
		const d = new Date(lastDonationDate);
		d.setDate(d.getDate() + MIN_INTERVAL_DAYS);
		nextEligibleDate = d.toISOString();
	}
	// streak: consecutive months (approx) with a donation in last 6 months
	const byMonth = [];
	const now = new Date();
	for (let i = 5; i >= 0; i -= 1) {
		const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const count = completed.filter((d) => {
			const dd = new Date(d.donationDate);
			return dd.getFullYear() === m.getFullYear() && dd.getMonth() === m.getMonth();
		}).length;
		byMonth.push({ month: m.toLocaleString(undefined, { month: 'short' }), count });
	}
	res.json({
		success: true,
		data: {
			totalDonations,
			livesHelped,
			donationStreak: byMonth.filter((m) => m.count > 0).length,
			lastDonationDate,
			nextEligibleDate,
			totalUnits,
			byMonth,
		},
	});
});

// GET /api/donations/eligibility
export const donationEligibility = asyncHandler(async (req, res) => {
	const donor = await getDonorForUser(req.user._id);
	const lastDonationDate = donor?.lastDonationDate || null;
	if (!lastDonationDate) {
		return res.json({ success: true, data: { eligible: true, lastDonationDate: null, nextEligibleDate: null, daysRemaining: 0 } });
	}
	const next = new Date(lastDonationDate);
	next.setDate(next.getDate() + MIN_INTERVAL_DAYS);
	const daysRemaining = Math.max(0, Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
	res.json({ success: true, data: { eligible: daysRemaining === 0, lastDonationDate, nextEligibleDate: next.toISOString(), daysRemaining } });
});

// GET /api/donations/upcoming
export const upcomingDonation = asyncHandler(async (req, res) => {
	const donor = await getDonorForUser(req.user._id);
	if (!donor) return res.json({ success: true, data: null });
	const up = await Donation.findOne({ donorId: donor._id, status: { $in: ['SCHEDULED', 'CHECKED_IN', 'SCREENING', 'APPROVED'] } }).sort({ donationDate: 1 });
	res.json({ success: true, data: up ? mapDonation(up) : null });
});

// POST /api/donations/record
export const recordDonation = asyncHandler(async (req, res) => {
	const donor = await getDonorForUser(req.user._id);
	if (!donor) throw new ApiError(404, 'Donor profile not found');
	const donation = await Donation.create({
		donorId: donor._id,
		donorUserId: req.user._id,
		bloodBankId: req.body.bloodBankId || undefined,
		bloodGroup: req.body.bloodGroup || donor.bloodGroup,
		donationType: req.body.donationType || 'WHOLE_BLOOD',
		units: req.body.units || 1,
		notes: req.body.notes || '',
		status: 'COLLECTED',
		donationDate: req.body.donationDate ? new Date(req.body.donationDate) : new Date(),
		completedAt: new Date(),
	});
	donor.totalDonations = (donor.totalDonations || 0) + 1;
	donor.lastDonationDate = donation.donationDate;
	await donor.save();
	res.status(201).json({ success: true, data: donation, message: 'Donation recorded' });
});

// PATCH /api/donations/:id/cancel
export const cancelDonation = asyncHandler(async (req, res) => {
	const donor = await getDonorForUser(req.user._id);
	if (!donor) throw new ApiError(404, 'Donor profile not found');
	const d = await Donation.findOne({ _id: req.params.id, donorId: donor._id });
	if (!d) throw new ApiError(404, 'Donation not found');
	d.status = 'CANCELLED';
	d.cancelledAt = new Date();
	await d.save();
	res.json({ success: true, data: d, message: 'Donation cancelled' });
});

// GET /api/donations/export?format=pdf
export const exportDonations = asyncHandler(async (req, res) => {
	const donor = await getDonorForUser(req.user._id);
	const items = donor ? await Donation.find({ donorId: donor._id }).sort({ donationDate: -1 }) : [];
	res.json({ success: true, message: 'Export prepared', data: { format: req.query.format || 'pdf', count: items.length, items } });
});