import { Router } from 'express';
import { register, login, me, roles } from '../controllers/authController.js';
import { authRequired } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/roles', roles);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authRequired, me);

export default router;
