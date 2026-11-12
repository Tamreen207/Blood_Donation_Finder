import { Router } from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { listMyNotifications, markRead, markAllRead } from '../controllers/notificationController.js';

const router = Router();
router.use(authRequired);
router.get('/', listMyNotifications);
router.put('/:id/read', markRead);
router.put('/read-all', markAllRead);

export default router;
