import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		type: {
			type: String,
			enum: [
				'NEW_REQUEST',
				'EMERGENCY_REQUEST',
				'REQUEST_ACCEPTED',
				'REQUEST_REJECTED',
				'REQUEST_COMPLETED',
				'LOW_STOCK',
				'ACCOUNT_VERIFIED',
				'SYSTEM',
			],
			default: 'SYSTEM',
		},
		title: { type: String, required: true },
		message: { type: String, default: '' },
		relatedRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest' },
		isRead: { type: Boolean, default: false, index: true },
	},
	{ timestamps: true }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
