import { User, ROLES_LIST } from '../models/User.js';
import { Donor } from '../models/Donor.js';
import { BloodBank } from '../models/BloodBank.js';
import { signToken } from '../utils/jwt.js';
import { validateLogin, validateRegister } from '../utils/validators.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';

function buildUserResponse(user) {
	const token = signToken({ id: user._id, role: user.role });
	return { user: user.toSafeJSON(), token };
}

export const register = asyncHandler(async (req, res) => {
	const errors = validateRegister(req.body);
	if (errors.length) throw new ApiError(400, errors.join('; '));

	const { name, email, password, role, phone, city } = req.body;
	const existing = await User.findOne({ email: email.toLowerCase() });
	if (existing) throw new ApiError(409, 'An account with this email already exists');

	const user = await User.create({ name, email, password, role, phone, city });

	// role-specific profile
	if (role === 'donor') {
		const { bloodGroup, age, gender, latitude, longitude, lastDonationDate } = req.body;
		if (!bloodGroup) throw new ApiError(400, 'bloodGroup is required for donors');
		await Donor.create({
			userId: user._id,
			bloodGroup,
			age,
			gender,
			latitude,
			longitude,
			location: req.body.location || city || '',
			city: city || '',
			phone: phone || '',
			lastDonationDate: lastDonationDate || null,
			isAvailable: true,
		});
	} else if (role === 'bloodbank') {
		const { name: bankName, registrationNumber, address, latitude, longitude, openingHours } = req.body;
		if (!bankName) throw new ApiError(400, 'name (blood bank name) is required');
		await BloodBank.create({
			userId: user._id,
			name: bankName,
			registrationNumber,
			address,
			city: city || '',
			phone: phone || '',
			latitude,
			longitude,
			openingHours: openingHours || '24/7',
		});
	}

	res.status(201).json({ success: true, message: 'Registration successful', data: buildUserResponse(user) });
});

export const login = asyncHandler(async (req, res) => {
	const errors = validateLogin(req.body);
	if (errors.length) throw new ApiError(400, errors.join('; '));
	const { email, password } = req.body;
	const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
	if (!user) throw new ApiError(401, 'Invalid email or password');
	if (!user.isActive) throw new ApiError(403, 'Account is suspended');
	const ok = await user.comparePassword(password);
	if (!ok) throw new ApiError(401, 'Invalid email or password');
	user.lastLoginAt = new Date();
	await user.save();
	res.json({ success: true, message: 'Login successful', data: buildUserResponse(user) });
});

export const me = asyncHandler(async (req, res) => {
	const user = req.user;
	let profile = null;
	if (user.role === 'donor') profile = await Donor.findOne({ userId: user._id });
	if (user.role === 'bloodbank') profile = await BloodBank.findOne({ userId: user._id });
	res.json({ success: true, data: { user: user.toSafeJSON(), profile } });
});

export const roles = asyncHandler(async (_req, res) => {
	res.json({ success: true, data: ROLES_LIST });
});
