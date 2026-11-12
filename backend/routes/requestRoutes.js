import { Router } from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import {
	createRequest,
	listRequests,
	getRequest,
	updateRequest,
	cancelRequest,
	respondToRequest,
} from '../controllers/requestController.js';

const router = Router();
router.use(authRequired);
router.post('/', createRequest);
router.get('/', listRequests);
router.get('/:id', getRequest);
router.put('/:id', updateRequest);
router.delete('/:id', cancelRequest);
router.post('/:id/respond', respondToRequest);

export default router;
