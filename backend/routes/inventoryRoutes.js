import { Router } from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import {
	listMyInventory,
	createInventoryItem,
	updateInventoryItem,
	deleteInventoryItem,
} from '../controllers/inventoryController.js';

const router = Router();
router.use(authRequired, requireRole('bloodbank'));
router.get('/', listMyInventory);
router.post('/', createInventoryItem);
router.put('/:id', updateInventoryItem);
router.delete('/:id', deleteInventoryItem);

export default router;
