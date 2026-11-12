import mongoose from 'mongoose';
import { BLOOD_GROUPS } from './Donor.js';

const inventorySchema = new mongoose.Schema(
	{
		bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank', required: true, index: true },
		bloodGroup: { type: String, enum: BLOOD_GROUPS, required: true, index: true },
		unitsAvailable: { type: Number, default: 0, min: 0 },
		unitsReserved: { type: Number, default: 0, min: 0 },
		lowStockThreshold: { type: Number, default: 5 },
		criticalStockThreshold: { type: Number, default: 2 },
		lastUpdated: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

inventorySchema.index({ bloodBankId: 1, bloodGroup: 1 }, { unique: true });

inventorySchema.virtual('status').get(function getStatus() {
	if (this.unitsAvailable <= 0) return 'OUT_OF_STOCK';
	if (this.unitsAvailable <= this.criticalStockThreshold) return 'CRITICAL';
	if (this.unitsAvailable <= this.lowStockThreshold) return 'LOW';
	return 'AVAILABLE';
});

inventorySchema.set('toJSON', { virtuals: true });
inventorySchema.set('toObject', { virtuals: true });

export const Inventory = mongoose.model('Inventory', inventorySchema);
