import mongoose from 'mongoose';
import { BLOOD_GROUPS } from './Donor.js';

export const DONATION_STATUS = [
	'SCHEDULED',
	'CHECKED_IN',
	'SCREENING',
	'APPROVED',
	'COLLECTED',
	'REJECTED',
	'DEFERRED',
	'CANCELLED',
];

export const SCREENING_STATUS = ['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED', 'REQUIRES_REVIEW'];

export const DONATION_TYPES = ['WHOLE_BLOOD', 'PLASMA', 'PLATELETS', 'OTHER'];

const donationSchema = new mongoose.Schema(
	{
		donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true, index: true },
		donorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest' },
		bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank', index: true },
		donationDate: { type: Date, default: Date.now, index: true },
		bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
		donationType: { type: String, enum: DONATION_TYPES, default: 'WHOLE_BLOOD' },
		units: { type: Number, default: 1, min: 1 },
		notes: { type: String, default: '' },
		status: { type: String, enum: DONATION_STATUS, default: 'SCHEDULED', index: true },
		screeningStatus: { type: String, enum: SCREENING_STATUS, default: 'PENDING' },
		checkedInAt: { type: Date },
		screeningStartedAt: { type: Date },
		approvedAt: { type: Date },
		collectedAt: { type: Date },
		completedAt: { type: Date },
		cancelledAt: { type: Date },
		rejectionReason: { type: String, default: '' },
		deferralReason: { type: String, default: '' },
		inventoryBatchId: { type: String, default: '' },
	},
	{ timestamps: true }
);

donationSchema.index({ bloodBankId: 1, donationDate: -1 });

export const Donation = mongoose.model('Donation', donationSchema);
