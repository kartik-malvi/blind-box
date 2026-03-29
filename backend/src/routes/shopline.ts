import { Router, Request, Response } from 'express';
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

// Storefront embed script — injected into every page via ScriptTag
router.get('/widget.js', (req: Request, res: Response) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://blind-box-beta.vercel.app';
  const js = `
(function() {
  if (window.__blindBoxWidget) return;
  window.__blindBoxWidget = true;

  // Inject styles
  var style = document.createElement('style');
  style.textContent = '#bb-btn{position:fixed;bottom:24px;right:24px;z-index:99999;background:#7c3aed;color:#fff;border:none;border-radius:50px;padding:14px 22px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(124,58,237,.4);display:flex;align-items:center;gap:8px;font-family:system-ui,sans-serif}#bb-btn:hover{background:#6d28d9}#bb-modal{display:none;position:fixed;inset:0;z-index:99998;background:rgba(0,0,0,.55);align-items:center;justify-content:center}#bb-modal.open{display:flex}#bb-frame{border:none;border-radius:20px;width:100%;max-width:720px;height:85vh;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,.3)}#bb-close{position:absolute;top:16px;right:20px;background:#fff;border:none;border-radius:50%;width:36px;height:36px;font-size:20px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center}';
  document.head.appendChild(style);

  // Button
  var btn = document.createElement('button');
  btn.id = 'bb-btn';
  btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> Blind Box';
  document.body.appendChild(btn);

  // Modal
  var modal = document.createElement('div');
  modal.id = 'bb-modal';
  modal.style.position = 'fixed';
  modal.innerHTML = '<button id="bb-close" onclick="document.getElementById(\\\"bb-modal\\\").classList.remove(\\\"open\\\")">&#x2715;</button><iframe id="bb-frame" src="${frontendUrl}/widget" allow="payment"></iframe>';
  document.body.appendChild(modal);

  btn.onclick = function() { modal.classList.add('open'); };
  modal.onclick = function(e) { if(e.target===modal) modal.classList.remove('open'); };
})();
  `.trim();
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(js);
});

// Admin config CRUD
router.get('/config', authenticate, requireAdmin, getConfig);
router.post('/config', authenticate, requireAdmin, saveConfig);

// Installed shops management
router.get('/shops', authenticate, requireAdmin, getInstalledShops);
router.delete('/shops/:shopId', authenticate, requireAdmin, deactivateShop);

export default router;
