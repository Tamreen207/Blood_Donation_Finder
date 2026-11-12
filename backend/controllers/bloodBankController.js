import { BloodBank } from '../models/BloodBank.js';
import { User } from '../models/User.js';
import { Inventory } from '../models/Inventory.js';
import { haversineKm } from '../utils/distance.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';
import { findMatchingBloodBanks } from '../services/matchingService.js';

export const getMyBank = asyncHandler(async (req, res) => {
	const bank = await BloodBank.findOne({ userId: req.user._id });
	if (!bank) throw new ApiError(404, 'Blood bank profile not found');
	res.json({ success: true, data: bank });
});

export const updateMyBank = asyncHandler(async (req, res) => {
	const allowed = [
		'name', 'registrationNumber', 'address', 'city', 'phone', 'latitude', 'longitude', 'openingHours',
		'bloodBankType', 'description', 'establishedYear',
		'email', 'website', 'emergencyPhone',
		'district', 'state', 'postalCode', 'country',
		'hoursByDay', 'services', 'components',
		'emergencySupport', 'emergencyHours', 'logoUrl',
	];
	const update = {};
	allowed.forEach((k) => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
	if (update.bloodBankType) {
		const { BLOOD_BANK_TYPES } = await import('../models/BloodBank.js');
		if (!BLOOD_BANK_TYPES.includes(update.bloodBankType)) delete update.bloodBankType;
	}
	const bank = await BloodBank.findOneAndUpdate({ userId: req.user._id }, update, { new: true });
	if (!bank) throw new ApiError(404, 'Blood bank profile not found');
	res.json({ success: true, data: bank });
});

export const getBloodBankById = asyncHandler(async (req, res) => {
	const bank = await BloodBank.findById(req.params.id);
	if (!bank) throw new ApiError(404, 'Blood bank not found');
	const user = await User.findById(bank.userId);
	const inventory = await Inventory.find({ bloodBankId: bank._id });
	res.json({ success: true, data: { ...bank.toObject(), user: user ? { name: user.name, email: user.email } : null, inventory } });
});

export const listBloodBanks = asyncHandler(async (req, res) => {
	const { city, latitude, longitude, radiusKm } = req.query;
	const filter = {};
	if (city) filter.city = new RegExp(`^${String(city).trim()}$`, 'i');
	const banks = await BloodBank.find(filter).limit(100);
	const inventory = await Inventory.find({ bloodBankId: { $in: banks.map((b) => b._id) } });
	const invByBank = new Map();
	inventory.forEach((i) => {
		const key = String(i.bloodBankId);
		if (!invByBank.has(key)) invByBank.set(key, []);
		invByBank.get(key).push({ bloodGroup: i.bloodGroup, unitsAvailable: i.unitsAvailable, status: i.status });
	});
	const lat = latitude ? Number(latitude) : null;
	const lng = longitude ? Number(longitude) : null;
	const rad = radiusKm ? Number(radiusKm) : null;
	const result = banks.map((b) => {
		const obj = b.toObject();
		const distance = lat != null && lng != null && b.latitude != null && b.longitude != null
			? haversineKm({ lat, lng }, { lat: b.latitude, lng: b.longitude })
			: null;
		if (rad != null && distance != null && distance > rad) return null;
		return { ...obj, distance: distance != null ? +distance.toFixed(2) : null, inventory: invByBank.get(String(b._id)) || [] };
	}).filter(Boolean).sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
	res.json({ success: true, data: result });
});

export const getNearbyBloodBanks = asyncHandler(async (req, res) => {
	const { latitude, longitude, bloodGroup, radiusKm } = req.query;
	if (!latitude || !longitude) throw new ApiError(400, 'latitude and longitude required');
	const matches = await findMatchingBloodBanks({
		bloodGroup: bloodGroup || 'O+',
		latitude: Number(latitude),
		longitude: Number(longitude),
		radiusKm: radiusKm ? Number(radiusKm) : 10,
	});
	res.json({ success: true, data: matches });
});
