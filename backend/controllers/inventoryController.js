import { Inventory } from '../models/Inventory.js';
import { BloodBank } from '../models/BloodBank.js';
import { ApiError, asyncHandler } from '../middleware/errorMiddleware.js';
import { getInventoryForBank, upsertInventory } from '../services/inventoryService.js';
import { BLOOD_GROUPS } from '../models/Donor.js';

async function requireOwnedBank(userId) {
	const bank = await BloodBank.findOne({ userId });
	if (!bank) throw new ApiError(404, 'Blood bank profile not found for this user');
	return bank;
}

export const listMyInventory = asyncHandler(async (req, res) => {
	const bank = await requireOwnedBank(req.user._id);
	const items = await getInventoryForBank(bank._id);
	res.json({ success: true, data: items });
});

export const createInventoryItem = asyncHandler(async (req, res) => {
	const bank = await requireOwnedBank(req.user._id);
	const { bloodGroup, unitsAvailable, lowStockThreshold, criticalStockThreshold } = req.body;
	if (!BLOOD_GROUPS.includes(bloodGroup)) throw new ApiError(400, 'Invalid blood group');
	const item = await upsertInventory({ bloodBankId: bank._id, bloodGroup, unitsAvailable, lowStockThreshold, criticalStockThreshold });
	res.status(201).json({ success: true, data: item });
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
	const bank = await requireOwnedBank(req.user._id);
	const item = await Inventory.findOne({ _id: req.params.id, bloodBankId: bank._id });
	if (!item) throw new ApiError(404, 'Inventory item not found');
	const allowed = ['unitsAvailable', 'lowStockThreshold', 'criticalStockThreshold'];
	allowed.forEach((k) => { if (req.body[k] !== undefined) item[k] = req.body[k]; });
	item.lastUpdated = new Date();
	await item.save();
	res.json({ success: true, data: item });
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
	const bank = await requireOwnedBank(req.user._id);
	const item = await Inventory.findOneAndDelete({ _id: req.params.id, bloodBankId: bank._id });
	if (!item) throw new ApiError(404, 'Inventory item not found');
	res.json({ success: true, message: 'Inventory item removed' });
});
