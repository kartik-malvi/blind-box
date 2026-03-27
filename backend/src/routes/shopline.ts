import { Router } from 'express';
import { install, callback } from '../controllers/shoplineOAuthController';
import {
  getConfig,
  saveConfig,
  getInstalledShops,
  deactivateShop,
} from '../controllers/shoplineConfigController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// OAuth flow (public — merchants hit these)
router.get('/install', install);
router.get('/callback', callback);

// Admin config CRUD
router.get('/config', authenticate, requireAdmin, getConfig);
router.post('/config', authenticate, requireAdmin, saveConfig);

// Installed shops management
router.get('/shops', authenticate, requireAdmin, getInstalledShops);
router.delete('/shops/:shopId', authenticate, requireAdmin, deactivateShop);

export default router;
