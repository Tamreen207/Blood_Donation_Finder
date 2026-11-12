import mongoose from 'mongoose';
import { BLOOD_GROUPS } from './Donor.js';

export const REQUEST_STATUS = ['PENDING', 'MATCHING', 'ACCEPTED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED', 'EXPIRED'];
export const URGENCY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const requestSchema = new mongoose.Schema(
	{
		requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		patientName: { type: String, required: true, trim: true },
		bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true, index: true },
		unitsRequired: { type: Number, required: true, min: 1, default: 1 },
		hospitalName: { type: String, required: true, trim: true },
		hospitalAddress: { type: String, default: '' },
		latitude: { type: Number },
		longitude: { type: Number },
		city: { type: String, default: '' },
		urgency: { type: String, enum: URGENCY, default: 'MEDIUM', index: true },
		requiredBy: { type: Date },
		contactPhone: { type: String, default: '' },
		message: { type: String, default: '' },
		status: { type: String, enum: REQUEST_STATUS, default: 'PENDING', index: true },
		unitsFulfilled: { type: Number, default: 0 },
		notifiedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		notifiedBloodBanks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' }],
	},
	{ timestamps: true }
);

requestSchema.index({ createdAt: -1 });

export const BloodRequest = mongoose.model('BloodRequest', requestSchema);
