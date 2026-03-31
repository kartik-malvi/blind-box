import { Router } from 'express';
import { register, login, getMe, makeAdmin } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.post('/make-admin', authenticate, makeAdmin);

export default router;
