import mongoose from 'mongoose';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const donorSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
		bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true, index: true },
		age: { type: Number, min: 18, max: 70 },
		gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
		location: { type: String, default: '' },
		city: { type: String, default: '', index: true },
		latitude: { type: Number },
		longitude: { type: Number },
		geo: {
			type: { type: String, enum: ['Point'], default: 'Point' },
			coordinates: { type: [Number], default: undefined },
		},
		lastDonationDate: { type: Date },
		isAvailable: { type: Boolean, default: true, index: true },
		isVerified: { type: Boolean, default: false, index: true },
		totalDonations: { type: Number, default: 0 },
		phone: { type: String, default: '' },
	},
	{ timestamps: true }
);

donorSchema.index({ geo: '2dsphere' });
donorSchema.pre('save', function setGeo(next) {
	if (this.latitude != null && this.longitude != null) {
		this.geo = { type: 'Point', coordinates: [this.longitude, this.latitude] };
	}
	next();
});

export const Donor = mongoose.model('Donor', donorSchema);
