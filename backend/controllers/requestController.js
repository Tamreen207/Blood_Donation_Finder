import { BloodRequest, URGENCY, REQUEST_STATUS } from '../models/BloodRequest.js';
import { findMatchingDonors, findMatchingBloodBanks, notifyTopMatches } from '../services/matchingService.js';
import { reserveUnits, releaseUnits, issueUnits } from '../services/inventoryService.js';
import { BloodBank } from '../models/BloodBank.js';
import { Donor } from '../models/Donor.js';
import { Donation } from '../models/Donation.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';
import { Notification } from '../models/Notification.js';

export const createRequest = asyncHandler(async (req, res) => {
	const required = ['patientName', 'bloodGroup', 'unitsRequired', 'hospitalName'];
	for (const k of required) {
		if (!req.body[k]) throw new ApiError(400, `${k} is required`);
	}
	const payload = {
		requesterId: req.user._id,
		patientName: req.body.patientName,
		bloodGroup: req.body.bloodGroup,
		unitsRequired: Number(req.body.unitsRequired) || 1,
		hospitalName: req.body.hospitalName,
		hospitalAddress: req.body.hospitalAddress || '',
		latitude: req.body.latitude != null ? Number(req.body.latitude) : undefined,
		longitude: req.body.longitude != null ? Number(req.body.longitude) : undefined,
		city: req.body.city || '',
		urgency: URGENCY.includes(req.body.urgency) ? req.body.urgency : 'MEDIUM',
		requiredBy: req.body.requiredBy || undefined,
		contactPhone: req.body.contactPhone || '',
		message: req.body.message || '',
		status: 'MATCHING',
	};
	const request = await BloodRequest.create(payload);

	const [donors, banks] = await Promise.all([
		findMatchingDonors({
			bloodGroup: payload.bloodGroup,
			latitude: payload.latitude,
			longitude: payload.longitude,
			radiusKm: 25,
			urgency: payload.urgency,
			limit: 25,
		}),
		findMatchingBloodBanks({
			bloodGroup: payload.bloodGroup,
			latitude: payload.latitude,
			longitude: payload.longitude,
			radiusKm: 25,
		}),
	]);

	request.notifiedDonors = donors.map((d) => d.donor.userId);
	request.notifiedBloodBanks = banks.map((b) => b._id);
	await request.save();

	const notified = await notifyTopMatches(request, donors, banks);

	res.status(201).json({
		success: true,
		message: 'Request created and matching started',
		data: { request, matches: { donors, banks }, notifiedCount: notified },
	});
});

export const listRequests = asyncHandler(async (req, res) => {
	const { status, bloodGroup, urgency, role } = req.query;
	const filter = {};
	if (status) filter.status = status;
	if (bloodGroup) filter.bloodGroup = bloodGroup;
	if (urgency) filter.urgency = urgency;
	if (role === 'seeker') filter.requesterId = req.user._id;
	const items = await BloodRequest.find(filter).sort({ createdAt: -1 }).limit(100);
	res.json({ success: true, data: items });
});

export const getRequest = asyncHandler(async (req, res) => {
	const request = await BloodRequest.findById(req.params.id);
	if (!request) throw new ApiError(404, 'Request not found');
	res.json({ success: true, data: request });
});

export const updateRequest = asyncHandler(async (req, res) => {
	const request = await BloodRequest.findById(req.params.id);
	if (!request) throw new ApiError(404, 'Request not found');
	if (String(request.requesterId) !== String(req.user._id) && req.user.role !== 'admin') {
		throw new ApiError(403, 'Not allowed to update this request');
	}
	const allowed = ['status', 'message', 'requiredBy', 'unitsFulfilled'];
	allowed.forEach((k) => { if (req.body[k] !== undefined) request[k] = req.body[k]; });
	await request.save();
	res.json({ success: true, data: request });
});

export const cancelRequest = asyncHandler(async (req, res) => {
	const request = await BloodRequest.findById(req.params.id);
	if (!request) throw new ApiError(404, 'Request not found');
	if (String(request.requesterId) !== String(req.user._id) && req.user.role !== 'admin') {
		throw new ApiError(403, 'Not allowed to cancel this request');
	}
	if (['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(request.status)) {
		throw new ApiError(400, 'Request cannot be cancelled in this state');
	}
	request.status = 'CANCELLED';
	await request.save();
	res.json({ success: true, data: request });
});

// Donor/Blood bank responds to a request
export const respondToRequest = asyncHandler(async (req, res) => {
	const request = await BloodRequest.findById(req.params.id);
	if (!request) throw new ApiError(404, 'Request not found');
	const { action, message, units } = req.body;
	if (!['ACCEPT', 'REJECT', 'RESERVE', 'ISSUE'].includes(action)) throw new ApiError(400, 'Invalid action');

	if (req.user.role === 'donor') {
		const donor = await Donor.findOne({ userId: req.user._id });
		if (!donor) throw new ApiError(404, 'Donor profile not found');
		if (action === 'ACCEPT') request.status = 'ACCEPTED';
		if (action === 'REJECT') {
			request.notifiedDonors = request.notifiedDonors.filter((id) => String(id) !== String(req.user._id));
		}
	} else if (req.user.role === 'bloodbank') {
		const bank = await BloodBank.findOne({ userId: req.user._id });
		if (!bank) throw new ApiError(404, 'Blood bank profile not found');
		if (action === 'RESERVE') {
			const updated = await reserveUnits({ bloodBankId: bank._id, bloodGroup: request.bloodGroup, units: units || request.unitsRequired });
			request.status = 'PARTIALLY_FULFILLED';
			request.unitsFulfilled = (request.unitsFulfilled || 0) + (units || request.unitsRequired);
			if (request.unitsFulfilled >= request.unitsRequired) request.status = 'FULFILLED';
			await updated;
		}
		if (action === 'ISSUE') {
			await issueUnits({ bloodBankId: bank._id, bloodGroup: request.bloodGroup, units: units || request.unitsFulfilled || 1 });
			request.status = 'FULFILLED';
			await Donation.create({
				donorId: bank._id,
				bloodBankId: bank._id,
				donorUserId: req.user._id,
				requestId: request._id,
				bloodGroup: request.bloodGroup,
				units: units || request.unitsFulfilled || 1,
				donationDate: new Date(),
			});
		}
	} else if (req.user.role === 'seeker' || req.user.role === 'admin') {
		if (action === 'CANCEL' || action === 'REJECT') request.status = 'CANCELLED';
	}

	await request.save();
	res.json({ success: true, data: request, message: `Action ${action} recorded` });
});

// Blood-bank scoped: list requests targeting this bank
export const listBankRequests = asyncHandler(async (req, res) => {
	const bank = await BloodBank.findOne({ userId: req.user._id });
	if (!bank) throw new ApiError(404, 'Blood bank profile not found');

	const { status, bloodGroup, urgency, search, from, to, sort = 'newest', page = 1, limit = 25 } = req.query;
	const filter = { notifiedBloodBanks: bank._id };
	if (status) {
		const statuses = String(status).split(',').map((s) => s.trim()).filter(Boolean);
		filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
	}
	if (bloodGroup) {
		const groups = String(bloodGroup).split(',').map((s) => s.trim()).filter(Boolean);
		filter.bloodGroup = groups.length > 1 ? { $in: groups } : groups[0];
	}
	if (urgency) {
		const urgencies = String(urgency).split(',').map((s) => s.trim()).filter(Boolean);
		filter.urgency = urgencies.length > 1 ? { $in: urgencies } : urgencies[0];
	}
	if (from || to) {
		filter.createdAt = {};
		if (from) filter.createdAt.$gte = new Date(from);
		if (to) filter.createdAt.$lte = new Date(to);
	}
	if (search) {
		const re = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
		filter.$or = [
			{ _id: re },
			{ patientName: re },
			{ hospitalName: re },
			{ hospitalAddress: re },
			{ city: re },
			{ bloodGroup: re },
		];
	}

	const sortMap = {
		newest: { createdAt: -1 },
		oldest: { createdAt: 1 },
		urgency: { urgency: -1, createdAt: -1 },
		units: { unitsRequired: -1, createdAt: -1 },
	};
	const pageNum = Math.max(1, parseInt(page, 10) || 1);
	const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));

	const [items, total] = await Promise.all([
		BloodRequest.find(filter).sort(sortMap[sort] || sortMap.newest).skip((pageNum - 1) * limitNum).limit(limitNum),
		BloodRequest.countDocuments(filter),
	]);

	res.json({ success: true, data: { items, total, page: pageNum, limit: limitNum, pages: Math.max(1, Math.ceil(total / limitNum)) } });
});

export const bankRequestsSummary = asyncHandler(async (req, res) => {
	const bank = await BloodBank.findOne({ userId: req.user._id });
	if (!bank) throw new ApiError(404, 'Blood bank profile not found');
	const base = { notifiedBloodBanks: bank._id };
	const [total, pending, emergency, accepted, fulfilled, declined] = await Promise.all([
		BloodRequest.countDocuments(base),
		BloodRequest.countDocuments({ ...base, status: { $in: ['PENDING', 'MATCHING'] } }),
		BloodRequest.countDocuments({ ...base, urgency: 'CRITICAL', status: { $nin: ['FULFILLED', 'CANCELLED', 'EXPIRED'] } }),
		BloodRequest.countDocuments({ ...base, status: { $in: ['ACCEPTED', 'PARTIALLY_FULFILLED'] } }),
		BloodRequest.countDocuments({ ...base, status: 'FULFILLED' }),
		BloodRequest.countDocuments({ ...base, status: 'CANCELLED' }),
	]);
	res.json({ success: true, data: { total, pending, emergency, accepted, fulfilled, declined } });
});

export const getRequestActivity = asyncHandler(async (req, res) => {
	const request = await BloodRequest.findById(req.params.id);
	if (!request) throw new ApiError(404, 'Request not found');
	const events = [];
	events.push({ type: 'REQUEST_CREATED', label: 'Request created', at: request.createdAt });
	if (request.notifiedBloodBanks?.length) {
		events.push({ type: 'REQUEST_RECEIVED', label: 'Request received by blood bank', at: request.createdAt });
	}
	if (['ACCEPTED', 'PARTIALLY_FULFILLED', 'FULFILLED'].includes(request.status)) {
		events.push({ type: 'REQUEST_ACCEPTED', label: 'Request accepted', at: request.updatedAt });
	}
	if (request.status === 'PARTIALLY_FULFILLED') {
		events.push({ type: 'PARTIAL_FULFILLMENT', label: 'Partial fulfillment recorded', at: request.updatedAt });
	}
	if (request.status === 'FULFILLED') {
		events.push({ type: 'REQUEST_FULFILLED', label: 'Request fulfilled', at: request.updatedAt });
	}
	if (request.status === 'CANCELLED') {
		events.push({ type: 'REQUEST_DECLINED', label: 'Request declined / cancelled', at: request.updatedAt });
	}
	events.sort((a, b) => new Date(a.at) - new Date(b.at));
	res.json({ success: true, data: { events } });
});

export const bankRespond = asyncHandler(async (req, res) => {
	const request = await BloodRequest.findById(req.params.id);
	if (!request) throw new ApiError(404, 'Request not found');
	const bank = await BloodBank.findOne({ userId: req.user._id });
	if (!bank) throw new ApiError(404, 'Blood bank profile not found');
	if (!request.notifiedBloodBanks?.some((id) => String(id) === String(bank._id))) {
		throw new ApiError(403, 'This request is not assigned to your blood bank');
	}
	const { action, units, reason, message } = req.body;
	if (!['ACCEPT', 'REJECT', 'PARTIAL', 'RESERVE', 'ISSUE'].includes(action)) {
		throw new ApiError(400, 'Invalid action');
	}
	if (['FULFILLED', 'CANCELLED', 'EXPIRED'].includes(request.status)) {
		throw new ApiError(400, 'Request can no longer be modified');
	}

	if (action === 'ACCEPT') {
		const alloc = Math.max(1, Math.min(request.unitsRequired - (request.unitsFulfilled || 0), Number(units) || request.unitsRequired));
		await reserveUnits({ bloodBankId: bank._id, bloodGroup: request.bloodGroup, units: alloc });
		request.unitsFulfilled = (request.unitsFulfilled || 0) + alloc;
		request.status = request.unitsFulfilled >= request.unitsRequired ? 'FULFILLED' : 'PARTIALLY_FULFILLED';
	} else if (action === 'PARTIAL') {
		const remaining = request.unitsRequired - (request.unitsFulfilled || 0);
		const alloc = Math.max(1, Math.min(remaining, Number(units) || 1));
		await reserveUnits({ bloodBankId: bank._id, bloodGroup: request.bloodGroup, units: alloc });
		request.unitsFulfilled = (request.unitsFulfilled || 0) + alloc;
		request.status = request.unitsFulfilled >= request.unitsRequired ? 'FULFILLED' : 'PARTIALLY_FULFILLED';
	} else if (action === 'RESERVE') {
		const alloc = Math.max(1, Number(units) || request.unitsRequired);
		await reserveUnits({ bloodBankId: bank._id, bloodGroup: request.bloodGroup, units: alloc });
		request.unitsFulfilled = (request.unitsFulfilled || 0) + alloc;
		request.status = request.unitsFulfilled >= request.unitsRequired ? 'FULFILLED' : 'PARTIALLY_FULFILLED';
	} else if (action === 'ISSUE') {
		const alloc = Math.max(1, Number(units) || request.unitsFulfilled || 1);
		await issueUnits({ bloodBankId: bank._id, bloodGroup: request.bloodGroup, units: alloc });
		request.unitsFulfilled = (request.unitsFulfilled || 0) + alloc;
		request.status = 'FULFILLED';
		await Donation.create({
			donorId: bank._id,
			bloodBankId: bank._id,
			donorUserId: req.user._id,
			requestId: request._id,
			bloodGroup: request.bloodGroup,
			units: alloc,
			donationDate: new Date(),
		});
	} else if (action === 'REJECT') {
		request.status = 'CANCELLED';
	}

	if (request.requesterId) {
		try {
			await Notification.create({
				userId: request.requesterId,
				type: action === 'REJECT' ? 'REQUEST_REJECTED' : 'REQUEST_ACCEPTED',
				title: `Request ${request._id} ${action === 'REJECT' ? 'declined' : 'updated'}`,
				message: `Blood bank ${bank.name || ''} ${action === 'REJECT' ? 'declined' : `accepted ${units || ''} units for`} your request for ${request.bloodGroup}`,
				relatedRequestId: request._id,
			});
		} catch (_) {}
	}

	await request.save();
	res.json({ success: true, data: request, message: `Action ${action} recorded` });
});
