import { Router } from 'express';
import { purchaseBlindBox, getMyOrders, getAllOrders, guestPurchase } from '../controllers/orderController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/purchase', authenticate, purchaseBlindBox);
router.post('/guest-purchase', guestPurchase);   // public — no auth required
router.get('/my', authenticate, getMyOrders);
router.get('/', authenticate, requireAdmin, getAllOrders);

export default router;
