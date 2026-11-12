import mongoose from 'mongoose';

export const BLOOD_BANK_TYPES = ['GOVERNMENT', 'PRIVATE', 'HOSPITAL', 'NGO_TRUST', 'OTHER'];
export const SERVICES = [
	'BLOOD_DONATION',
	'BLOOD_COLLECTION',
	'BLOOD_STORAGE',
	'BLOOD_TESTING',
	'COMPONENT_SEPARATION',
	'BLOOD_ISSUANCE',
	'EMERGENCY_SUPPORT',
	'PLASMA_AVAILABILITY',
	'PLATELET_AVAILABILITY',
];
export const COMPONENTS = ['WHOLE_BLOOD', 'PACKED_RBC', 'PLASMA', 'PLATELETS', 'CRYOPRECIPITATE'];
export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export const VERIFICATION_STATUS = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'];

const dayHoursSchema = new mongoose.Schema(
	{
		open: { type: String, default: '09:00' },
		close: { type: String, default: '18:00' },
		closed: { type: Boolean, default: false },
		is24Hours: { type: Boolean, default: false },
	},
	{ _id: false }
);

const bloodBankSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
		name: { type: String, required: true, trim: true },
		registrationNumber: { type: String, default: '' },
		bloodBankType: { type: String, enum: BLOOD_BANK_TYPES, default: 'OTHER' },
		description: { type: String, default: '', maxlength: 1000 },
		establishedYear: { type: Number, min: 1800, max: 2100 },
		email: { type: String, default: '' },
		website: { type: String, default: '' },
		emergencyPhone: { type: String, default: '' },
		address: { type: String, default: '' },
		city: { type: String, default: '', index: true },
		district: { type: String, default: '' },
		state: { type: String, default: '' },
		postalCode: { type: String, default: '' },
		country: { type: String, default: 'India' },
		phone: { type: String, default: '' },
		latitude: { type: Number },
		longitude: { type: Number },
		openingHours: { type: String, default: '24/7' },
		hoursByDay: {
			monday: { type: dayHoursSchema, default: () => ({}) },
			tuesday: { type: dayHoursSchema, default: () => ({}) },
			wednesday: { type: dayHoursSchema, default: () => ({}) },
			thursday: { type: dayHoursSchema, default: () => ({}) },
			friday: { type: dayHoursSchema, default: () => ({}) },
			saturday: { type: dayHoursSchema, default: () => ({}) },
			sunday: { type: dayHoursSchema, default: () => ({}) },
		},
		services: { type: [String], default: [] },
		components: { type: [String], default: [] },
		emergencySupport: { type: Boolean, default: false },
		emergencyHours: { type: String, default: '' },
		logoUrl: { type: String, default: '' },
		verification: {
			status: { type: String, enum: VERIFICATION_STATUS, default: 'UNVERIFIED' },
			verifiedAt: { type: Date },
			authority: { type: String, default: '' },
			notes: { type: String, default: '' },
		},
		documents: {
			license: { status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED', 'NOT_SUBMITTED'], default: 'NOT_SUBMITTED' }, url: { type: String, default: '' } },
			registration: { status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED', 'NOT_SUBMITTED'], default: 'NOT_SUBMITTED' }, url: { type: String, default: '' } },
			verification: { status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED', 'NOT_SUBMITTED'], default: 'NOT_SUBMITTED' }, url: { type: String, default: '' } },
		},
		isVerified: { type: Boolean, default: false, index: true },
		isActive: { type: Boolean, default: true, index: true },
		geo: {
			type: { type: String, enum: ['Point'], default: 'Point' },
			coordinates: { type: [Number], default: undefined },
		},
	},
	{ timestamps: true }
);

bloodBankSchema.index({ geo: '2dsphere' });
bloodBankSchema.pre('save', function setGeo(next) {
	if (this.latitude != null && this.longitude != null) {
		this.geo = { type: 'Point', coordinates: [this.longitude, this.latitude] };
	}
	next();
});

export const BloodBank = mongoose.model('BloodBank', bloodBankSchema);
