import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
	{
		reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		reason: { type: String, required: true },
		description: { type: String, default: '' },
		status: { type: String, enum: ['OPEN', 'REVIEWED', 'DISMISSED'], default: 'OPEN', index: true },
	},
	{ timestamps: true }
);

export const Report = mongoose.model('Report', reportSchema);
