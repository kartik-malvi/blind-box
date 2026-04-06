import { Router } from 'express';
import {
  getAllBlindBoxes,
  getBlindBoxById,
  createBlindBox,
  updateBlindBox,
  deleteBlindBox,
  addPoolItem,
  updatePoolItem,
  deletePoolItem,
  autoCreateBlindBox,
} from '../controllers/blindBoxController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public
router.get('/', getAllBlindBoxes);
router.get('/:id', getBlindBoxById);

// Admin only
router.post('/auto-create', authenticate, requireAdmin, autoCreateBlindBox);
router.post('/', authenticate, requireAdmin, createBlindBox);
router.put('/:id', authenticate, requireAdmin, updateBlindBox);
router.delete('/:id', authenticate, requireAdmin, deleteBlindBox);

// Pool items (admin)
router.post('/:id/items', authenticate, requireAdmin, addPoolItem);
router.put('/:id/items/:itemId', authenticate, requireAdmin, updatePoolItem);
router.delete('/:id/items/:itemId', authenticate, requireAdmin, deletePoolItem);

export default router;
