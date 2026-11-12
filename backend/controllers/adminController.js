import { User } from '../models/User.js';
import { Donor } from '../models/Donor.js';
import { BloodBank } from '../models/BloodBank.js';
import { BloodRequest } from '../models/BloodRequest.js';
import { Donation } from '../models/Donation.js';
import { Inventory } from '../models/Inventory.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';

export const getDashboard = asyncHandler(async (_req, res) => {
	const [users, donors, banks, requests, donations, inventory] = await Promise.all([
		User.countDocuments(),
		Donor.countDocuments(),
		BloodBank.countDocuments(),
		BloodRequest.countDocuments(),
		Donation.countDocuments(),
		Inventory.aggregate([{ $group: { _id: null, total: { $sum: '$unitsAvailable' } } }]),
	]);
	const activeRequests = await BloodRequest.countDocuments({ status: { $in: ['PENDING', 'MATCHING', 'ACCEPTED', 'PARTIALLY_FULFILLED'] } });
	const emergency = await BloodRequest.countDocuments({ urgency: 'CRITICAL', status: { $in: ['PENDING', 'MATCHING', 'ACCEPTED'] } });

	const [byStatus, byUrgency, byBloodGroupRequests, byBloodGroupUnits, recentRequests, recentDonations, recentBanks, verifiedBanks, pendingBanks] = await Promise.all([
		BloodRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
		BloodRequest.aggregate([{ $group: { _id: '$urgency', count: { $sum: 1 } } }]),
		BloodRequest.aggregate([{ $group: { _id: '$bloodGroup', count: { $sum: 1 } } }]),
		Inventory.aggregate([{ $group: { _id: '$bloodGroup', units: { $sum: '$unitsAvailable' } } }]),
		BloodRequest.find().sort({ createdAt: -1 }).limit(10).select('patientName bloodGroup unitsRequired hospitalName city urgency status requiredBy createdAt'),
		Donation.find().sort({ createdAt: -1 }).limit(10).select('donorId bloodBankId bloodGroup units donationDate status'),
		BloodBank.find().sort({ createdAt: -1 }).limit(10).select('name city isVerified createdAt'),
		BloodBank.countDocuments({ isVerified: true }),
		BloodBank.countDocuments({ isVerified: false }),
	]);

	const emergencyRequests = await BloodRequest.find({ urgency: 'CRITICAL', status: { $nin: ['FULFILLED', 'CANCELLED', 'EXPIRED'] } })
		.sort({ createdAt: -1 }).limit(10)
		.select('patientName bloodGroup unitsRequired hospitalName city urgency status requiredBy createdAt');

	const statusMap = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
	const urgencyMap = Object.fromEntries(byUrgency.map((u) => [u._id, u.count]));
	const requestByGroup = Object.fromEntries(byBloodGroupRequests.map((g) => [g._id, g.count]));
	const unitsByGroup = Object.fromEntries(byBloodGroupUnits.map((g) => [g._id, g.units]));

	res.json({
		success: true,
		data: {
			summary: {
				totalUsers: users,
				totalDonors: donors,
				activeDonors: donors,
				totalBloodBanks: banks,
				verifiedBloodBanks: verifiedBanks,
				pendingBloodBanks: pendingBanks,
				totalRequests: requests,
				activeRequests,
				emergencyRequests: emergency,
				completedDonations: donations,
				totalDonations: donations,
				availableUnits: inventory[0]?.total || 0,
			},
			requestStatus: {
				PENDING: statusMap.PENDING || 0,
				MATCHING: statusMap.MATCHING || 0,
				ACCEPTED: statusMap.ACCEPTED || 0,
				PARTIALLY_FULFILLED: statusMap.PARTIALLY_FULFILLED || 0,
				FULFILLED: statusMap.FULFILLED || 0,
				CANCELLED: statusMap.CANCELLED || 0,
				EXPIRED: statusMap.EXPIRED || 0,
			},
			requestUrgency: urgencyMap,
			bloodGroups: { requests: requestByGroup, units: unitsByGroup },
			recentRequests,
			emergencyRequests,
			recentDonations,
			recentBanks,
			generatedAt: new Date().toISOString(),
		},
	});
});

export const listUsers = asyncHandler(async (req, res) => {
	const { role, search, status } = req.query;
	const filter = {};
	if (role) filter.role = role;
	if (status === 'active') filter.isActive = true;
	if (status === 'inactive') filter.isActive = false;
	if (search) filter.$or = [
		{ name: new RegExp(search, 'i') },
		{ email: new RegExp(search, 'i') },
	];
	const users = await User.find(filter).sort({ createdAt: -1 }).limit(200);
	res.json({ success: true, data: users.map((u) => u.toSafeJSON()) });
});

export const verifyUser = asyncHandler(async (req, res) => {
	const { isVerified, isActive } = req.body;
	const update = {};
	if (typeof isVerified === 'boolean') update.isVerified = isVerified;
	if (typeof isActive === 'boolean') update.isActive = isActive;
	const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
	if (!user) throw new ApiError(404, 'User not found');
	if (user.role === 'donor') {
		await Donor.findOneAndUpdate({ userId: user._id }, { isVerified: !!isVerified });
	}
	if (user.role === 'bloodbank') {
		await BloodBank.findOneAndUpdate({ userId: user._id }, { isVerified: !!isVerified });
	}
	res.json({ success: true, data: user.toSafeJSON() });
});

export const setUserStatus = verifyUser;

export const verifyBloodBank = asyncHandler(async (req, res) => {
	const { isVerified } = req.body;
	const bank = await BloodBank.findByIdAndUpdate(req.params.id, { isVerified: !!isVerified }, { new: true });
	if (!bank) throw new ApiError(404, 'Blood bank not found');
	if (isVerified) await User.findByIdAndUpdate(bank.userId, { isVerified: true });
	res.json({ success: true, data: bank });
});

export const listBloodBanksAdmin = asyncHandler(async (_req, res) => {
	const banks = await BloodBank.find().sort({ createdAt: -1 }).limit(200);
	res.json({ success: true, data: banks });
});

export const listRequestsAdmin = asyncHandler(async (_req, res) => {
	const requests = await BloodRequest.find().sort({ createdAt: -1 }).limit(200);
	res.json({ success: true, data: requests });
});

export const getAnalytics = asyncHandler(async (_req, res) => {
	const last7 = await BloodRequest.aggregate([
		{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
		{ $sort: { _id: -1 } },
		{ $limit: 7 },
	]);
	const byBloodGroup = await BloodRequest.aggregate([
		{ $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
	]);
	const byUrgency = await BloodRequest.aggregate([
		{ $group: { _id: '$urgency', count: { $sum: 1 } } },
	]);
	const donationsOverTime = await Donation.aggregate([
		{ $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$donationDate' } }, count: { $sum: 1 } } },
		{ $sort: { _id: -1 } },
		{ $limit: 7 },
	]);
	res.json({ success: true, data: { requestsOverTime: last7.reverse(), byBloodGroup, byUrgency, donationsOverTime: donationsOverTime.reverse() } });
});

export const getSystemHealth = asyncHandler(async (_req, res) => {
	const startedAt = Date.now();
	const checks = {};
	try {
		const { connectDB } = await import('../config/db.js');
		const mongoose = await import('mongoose');
		const ok = mongoose.default?.connection?.readyState === 1;
		checks.database = { status: ok ? 'OPERATIONAL' : 'DEGRADED', latencyMs: Date.now() - startedAt };
	} catch (e) {
		checks.database = { status: 'UNAVAILABLE', error: e?.message || 'unknown' };
	}
	checks.api = { status: 'OPERATIONAL', latencyMs: Date.now() - startedAt };
	checks.authentication = { status: 'OPERATIONAL', latencyMs: Date.now() - startedAt };
	checks.fileStorage = { status: 'DEGRADED', note: 'No persistent file storage configured' };
	checks.notificationService = { status: 'OPERATIONAL', latencyMs: 0 };
	checks.webSocketService = { status: 'DEGRADED', note: 'WebSocket layer is optional and not enabled by default' };
	res.json({ success: true, data: { checks, checkedAt: new Date().toISOString() } });
});
