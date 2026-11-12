import { Inventory } from '../models/Inventory.js';
import { ApiError } from '../middleware/errorMiddleware.js';

export async function getInventoryForBank(bloodBankId) {
	return Inventory.find({ bloodBankId }).sort({ bloodGroup: 1 });
}

export async function upsertInventory({ bloodBankId, bloodGroup, unitsAvailable, lowStockThreshold, criticalStockThreshold }) {
	const update = { lastUpdated: new Date() };
	if (unitsAvailable != null) update.unitsAvailable = unitsAvailable;
	if (lowStockThreshold != null) update.lowStockThreshold = lowStockThreshold;
	if (criticalStockThreshold != null) update.criticalStockThreshold = criticalStockThreshold;
	return Inventory.findOneAndUpdate(
		{ bloodBankId, bloodGroup },
		{ $set: update, $setOnInsert: { bloodBankId, bloodGroup, unitsReserved: 0 } },
		{ upsert: true, new: true, setDefaultsOnInsert: true }
	);
}

export async function reserveUnits({ bloodBankId, bloodGroup, units }) {
	if (units <= 0) throw new ApiError(400, 'units must be positive');
	const item = await Inventory.findOne({ bloodBankId, bloodGroup });
	if (!item) throw new ApiError(404, 'Inventory entry not found');
	if (item.unitsAvailable < units) throw new ApiError(409, `Only ${item.unitsAvailable} units available`);
	item.unitsAvailable -= units;
	item.unitsReserved += units;
	item.lastUpdated = new Date();
	await item.save();
	return item;
}

export async function releaseUnits({ bloodBankId, bloodGroup, units }) {
	if (units <= 0) throw new ApiError(400, 'units must be positive');
	const item = await Inventory.findOne({ bloodBankId, bloodGroup });
	if (!item) throw new ApiError(404, 'Inventory entry not found');
	const release = Math.min(units, item.unitsReserved);
	item.unitsAvailable += release;
	item.unitsReserved -= release;
	item.lastUpdated = new Date();
	await item.save();
	return item;
}

export async function issueUnits({ bloodBankId, bloodGroup, units }) {
	if (units <= 0) throw new ApiError(400, 'units must be positive');
	const item = await Inventory.findOne({ bloodBankId, bloodGroup });
	if (!item) throw new ApiError(404, 'Inventory entry not found');
	if (item.unitsReserved < units) throw new ApiError(409, `Only ${item.unitsReserved} units reserved`);
	item.unitsReserved -= units;
	item.lastUpdated = new Date();
	await item.save();
	return item;
}
