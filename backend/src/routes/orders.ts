import { Router } from 'express';
import { purchaseBlindBox, getMyOrders, getAllOrders } from '../controllers/orderController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/purchase', authenticate, purchaseBlindBox);
router.get('/my', authenticate, getMyOrders);
router.get('/', authenticate, requireAdmin, getAllOrders);

export default router;
