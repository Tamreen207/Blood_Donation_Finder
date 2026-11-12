import { Donation, DONATION_STATUS, SCREENING_STATUS, DONATION_TYPES } from '../models/Donation.js';
import { BloodBank } from '../models/BloodBank.js';
import { Donor } from '../models/Donor.js';
import { upsertInventory } from '../services/inventoryService.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';

function startOfDay(d) {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}

function endOfDay(d) {
	const x = new Date(d);
	x.setHours(23, 59, 59, 999);
	return x;
}

function withinRange(range) {
	if (!range || range === 'all') return null;
	const now = new Date();
	if (range === 'today') return { $gte: startOfDay(now), $lte: endOfDay(now) };
	if (range === 'week') {
		const start = new Date(now);
		start.setDate(now.getDate() - 7);
		return { $gte: start, $lte: now };
	}
	if (range === 'month') {
		const start = new Date(now);
		start.setMonth(now.getMonth() - 1);
		return { $gte: start, $lte: now };
	}
	return null;
}

export const listBankDonations = asyncHandler(async (req, res) => {
	const bank = await BloodBank.findOne({ userId: req.user._id });
	if (!bank) throw new ApiError(404, 'Blood bank profile not found');

	const { status, bloodGroup, donationType, search, from, to, sort = 'newest', page = 1, limit = 25 } = req.query;
	const filter = { bloodBankId: bank._id };
	if (status) {
		const statuses = String(status).split(',').map((s) => s.trim()).filter(Boolean);
		filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
	}
	if (bloodGroup) {
		const groups = String(bloodGroup).split(',').map((s) => s.trim()).filter(Boolean);
		filter.bloodGroup = groups.length > 1 ? { $in: groups } : groups[0];
	}
	if (donationType) filter.donationType = donationType;
	if (from || to) {
		filter.donationDate = {};
		if (from) filter.donationDate.$gte = new Date(from);
		if (to) filter.donationDate.$lte = new Date(to);
	}
	const range = withinRange(req.query.range);
	if (range) filter.donationDate = { ...(filter.donationDate || {}), ...range };
	if (search) {
		const re = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
		filter.$or = [
			{ _id: re },
			{ donorUserId: re },
			{ bloodGroup: re },
			{ notes: re },
		];
	}

	const sortMap = {
		newest: { donationDate: -1, createdAt: -1 },
		oldest: { donationDate: 1, createdAt: 1 },
		bloodGroup: { bloodGroup: 1, donationDate: -1 },
		status: { status: 1, donationDate: -1 },
	};
	const pageNum = Math.max(1, parseInt(page, 10) || 1);
	const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

	const [items, total] = await Promise.all([
		Donation.find(filter).sort(sortMap[sort] || sortMap.newest).skip((pageNum - 1) * limitNum).limit(limitNum),
		Donation.countDocuments(filter),
	]);

	// Enrich with donor name
	const donorIds = [...new Set(items.map((d) => String(d.donorId)))];
	const donors = await Donor.find({ _id: { $in: donorIds } }).select('userId bloodGroup isAvailable');
	const userIds = [...new Set(donors.map((d) => String(d.userId)))].filter(Boolean);
	let userMap = {};
	if (userIds.length) {
		const { User } = await import('../models/User.js');
		const users = await User.find({ _id: { $in: userIds } }).select('name email');
		userMap = Object.fromEntries(users.map((u) => [String(u._id), { name: u.name, email: u.email }]));
	}
	const donorMap = Object.fromEntries(donors.map((d) => [String(d._id), d]));

	const enriched = items.map((d) => {
		const obj = d.toObject();
		const donor = donorMap[String(d.donorId)];
		obj.donor = donor ? { ...userMap[String(donor.userId)], isAvailable: donor.isAvailable, bloodGroup: donor.bloodGroup } : null;
		return obj;
	});

	res.json({ success: true, data: { items: enriched, total, page: pageNum, limit: limitNum, pages: Math.max(1, Math.ceil(total / limitNum)) } });
});

export const bankDonationsSummary = asyncHandler(async (req, res) => {
	const bank = await BloodBank.findOne({ userId: req.user._id });
	if (!bank) throw new ApiError(404, 'Blood bank profile not found');
	const base = { bloodBankId: bank._id };
	const now = new Date();
	const todayStart = startOfDay(now);
	const todayEnd = endOfDay(now);

	const [total, today, pendingScreening, approved, unitsAgg, rejected, deferred, scheduled] = await Promise.all([
		Donation.countDocuments(base),
		Donation.countDocuments({ ...base, donationDate: { $gte: todayStart, $lte: todayEnd } }),
		Donation.countDocuments({ ...base, status: { $in: ['CHECKED_IN', 'SCREENING'] } }),
		Donation.countDocuments({ ...base, status: { $in: ['APPROVED', 'COLLECTED'] } }),
		Donation.aggregate([
			{ $match: { ...base, status: 'COLLECTED' } },
			{ $group: { _id: null, total: { $sum: '$units' } } },
		]),
		Donation.countDocuments({ ...base, status: 'REJECTED' }),
		Donation.countDocuments({ ...base, status: 'DEFERRED' }),
		Donation.countDocuments({ ...base, status: 'SCHEDULED' }),
	]);
	const unitsCollected = unitsAgg?.[0]?.total || 0;
	res.json({ success: true, data: { total, today, pendingScreening, approved, unitsCollected, rejected, deferred, scheduled } });
});

export const getBankDonation = asyncHandler(async (req, res) => {
	const bank = await BloodBank.findOne({ userId: req.user._id });
	if (!bank) throw new ApiError(404, 'Blood bank profile not found');
	const donation = await Donation.findOne({ _id: req.params.id, bloodBankId: bank._id });
	if (!donation) throw new ApiError(404, 'Donation not found');
	const donor = await Donor.findById(donation.donorId);
	let userInfo = null;
	if (donor?.userId) {
		const { User } = await import('../models/User.js');
		const user = await User.findById(donor.userId).select('name email');
		userInfo = user ? { name: user.name, email: user.email } : null;
	}
	const obj = donation.toObject();
	obj.donor = donor ? { ...userInfo, isAvailable: donor.isAvailable, bloodGroup: donor.bloodGroup, totalDonations: donor.totalDonations, lastDonationDate: donor.lastDonationDate } : null;
	res.json({ success: true, data: obj });
});

export const getDonationActivity = asyncHandler(async (req, res) => {
	const bank = await BloodBank.findOne({ userId: req.user._id });
	if (!bank) throw new ApiError(404, 'Blood bank profile not found');
	const donation = await Donation.findOne({ _id: req.params.id, bloodBankId: bank._id });
	if (!donation) throw new ApiError(404, 'Donation not found');
	const events = [];
	events.push({ type: 'SCHEDULED', label: 'Donation scheduled', at: donation.createdAt });
	if (donation.checkedInAt) events.push({ type: 'CHECKED_IN', label: 'Donor checked in', at: donation.checkedInAt });
	if (donation.screeningStartedAt) events.push({ type: 'SCREENING_STARTED', label: 'Screening started', at: donation.screeningStartedAt });
	if (donation.approvedAt) events.push({ type: 'APPROVED', label: 'Donation approved', at: donation.approvedAt });
	if (donation.collectedAt) events.push({ type: 'COLLECTED', label: 'Blood collected', at: donation.collectedAt });
	if (donation.completedAt && donation.status === 'COLLECTED') events.push({ type: 'INVENTORY_UPDATED', label: 'Inventory updated', at: donation.completedAt });
	if (donation.cancelledAt) events.push({ type: donation.status, label: `Donation ${donation.status.toLowerCase()}`, at: donation.cancelledAt });
	events.sort((a, b) => new Date(a.at) - new Date(b.at));
	res.json({ success: true, data: { events } });
});

export const listBankDonors = asyncHandler(async (req, res) => {
	const { User } = await import('../models/User.js');
	const donors = await Donor.find().limit(100);
	const userIds = donors.map((d) => d.userId).filter(Boolean);
	const users = await User.find({ _id: { $in: userIds }, role: 'donor', isActive: true }).select('name email');
	const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]));
	const items = donors
		.filter((d) => userMap[String(d.userId)])
		.map((d) => ({
			_id: d._id,
			userId: d.userId,
			name: userMap[String(d.userId)]?.name,
			email: userMap[String(d.userId)]?.email,
			bloodGroup: d.bloodGroup,
			isAvailable: d.isAvailable,
			totalDonations: d.totalDonations,
		}));
	res.json({ success: true, data: { items } });
});

export const createBankDonation = asyncHandler(async (req, res) => {
	const bank = await BloodBank.findOne({ userId: req.user._id });
	if (!bank) throw new ApiError(404, 'Blood bank profile not found');
	const { donorId, bloodGroup, donationType, units, donationDate, notes, status } = req.body;
	if (!donorId) throw new ApiError(400, 'Donor is required');
	const donor = await Donor.findById(donorId);
	if (!donor) throw new ApiError(404, 'Donor not found');
	const unitsNum = Math.max(1, Number(units) || 1);
	const donation = await Donation.create({
		donorId: donor._id,
		donorUserId: donor.userId,
		bloodBankId: bank._id,
		bloodGroup: bloodGroup || donor.bloodGroup,
		donationType: DONATION_TYPES.includes(donationType) ? donationType : 'WHOLE_BLOOD',
		units: unitsNum,
		donationDate: donationDate ? new Date(donationDate) : new Date(),
		notes: (notes || '').slice(0, 1000),
		status: DONATION_STATUS.includes(status) ? status : 'SCHEDULED',
	});
	res.status(201).json({ success: true, data: donation });
});

async function transitionDonation(donation, { status, screeningStatus, timestamp, reason, bloodBankId, bloodGroup, units }) {
	if (status) donation.status = status;
	if (screeningStatus) donation.screeningStatus = screeningStatus;
	if (timestamp) donation[timestamp] = new Date();
	if (reason !== undefined) {
		if (status === 'REJECTED') donation.rejectionReason = reason;
		if (status === 'DEFERRED') donation.deferralReason = reason;
	}
	if (status === 'COLLECTED') {
		donation.completedAt = new Date();
		// Atomic-ish: only credit inventory once. Use upsert.
		const batchId = `BATCH-${new Date().getFullYear()}-${String(donation._id).slice(-5).toUpperCase()}`;
		await upsertInventory({ bloodBankId, bloodGroup, unitsAvailable: (units || donation.units || 0) });
		donation.inventoryBatchId = batchId;
		if (donation.donorId) {
			const donor = await Donor.findById(donation.donorId);
			if (donor) {
				donor.totalDonations = (donor.totalDonations || 0) + 1;
				donor.lastDonationDate = new Date();
				await donor.save();
			}
		}
	}
	await donation.save();
	return donation;
}

export const transitionBankDonation = asyncHandler(async (req, res) => {
	const bank = await BloodBank.findOne({ userId: req.user._id });
	if (!bank) throw new ApiError(404, 'Blood bank profile not found');
	const donation = await Donation.findOne({ _id: req.params.id, bloodBankId: bank._id });
	if (!donation) throw new ApiError(404, 'Donation not found');
	const { action, reason, screeningStatus, units } = req.body;
	if (!['check-in', 'screen', 'approve', 'collect', 'reject', 'defer', 'cancel'].includes(action)) {
		throw new ApiError(400, 'Invalid action');
	}
	if (action === 'check-in') {
		if (!['SCHEDULED'].includes(donation.status)) throw new ApiError(400, 'Invalid state for check-in');
		await transitionDonation(donation, { status: 'CHECKED_IN', timestamp: 'checkedInAt', bloodBankId: bank._id });
	} else if (action === 'screen') {
		if (!['CHECKED_IN'].includes(donation.status)) throw new ApiError(400, 'Donation must be checked in first');
		await transitionDonation(donation, { status: 'SCREENING', screeningStatus: screeningStatus || 'IN_PROGRESS', timestamp: 'screeningStartedAt', bloodBankId: bank._id });
	} else if (action === 'approve') {
		if (!['SCREENING', 'CHECKED_IN'].includes(donation.status)) throw new ApiError(400, 'Donation must be screened first');
		await transitionDonation(donation, { status: 'APPROVED', screeningStatus: 'PASSED', timestamp: 'approvedAt', bloodBankId: bank._id });
	} else if (action === 'collect') {
		if (!['APPROVED'].includes(donation.status)) throw new ApiError(400, 'Donation must be approved first');
		await transitionDonation(donation, { status: 'COLLECTED', timestamp: 'collectedAt', bloodBankId: bank._id, bloodGroup: donation.bloodGroup, units: units || donation.units });
	} else if (action === 'reject') {
		if (['COLLECTED', 'CANCELLED', 'REJECTED'].includes(donation.status)) throw new ApiError(400, 'Donation cannot be rejected in this state');
		await transitionDonation(donation, { status: 'REJECTED', screeningStatus: 'FAILED', timestamp: 'cancelledAt', reason, bloodBankId: bank._id });
	} else if (action === 'defer') {
		if (['COLLECTED', 'CANCELLED'].includes(donation.status)) throw new ApiError(400, 'Donation cannot be deferred in this state');
		await transitionDonation(donation, { status: 'DEFERRED', screeningStatus: 'REQUIRES_REVIEW', timestamp: 'cancelledAt', reason, bloodBankId: bank._id });
	} else if (action === 'cancel') {
		if (['COLLECTED', 'CANCELLED'].includes(donation.status)) throw new ApiError(400, 'Donation cannot be cancelled in this state');
		await transitionDonation(donation, { status: 'CANCELLED', timestamp: 'cancelledAt', bloodBankId: bank._id });
	}
	res.json({ success: true, data: donation });
});
