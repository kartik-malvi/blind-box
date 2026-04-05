import { Router, Request, Response } from 'express';
import axios from 'axios';
import { install, callback } from '../controllers/shoplineOAuthController';
import {
  getConfig,
  saveConfig,
  getInstalledShops,
  deactivateShop,
} from '../controllers/shoplineConfigController';
import { Shop } from '../models';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// OAuth flow (public — merchants hit these)
router.get('/install', install);
router.get('/callback', callback);

// Debug — check what params Shopline sends (remove after testing)
router.get('/debug-callback', (req: Request, res: Response) => {
  res.json({ query: req.query, code_version: 'v5_with_manual_scripttag' });
});

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

// Fetch products from the installed Shopline store (for pool item picker)
// GET /api/shopline/store-products?shopDomain=testlive.myshopline.com&search=shirt
router.get('/store-products', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const { shopDomain, search } = req.query as { shopDomain?: string; search?: string };
  if (!shopDomain) {
    res.status(400).json({ message: 'shopDomain query param required' });
    return;
  }
  const shop = await Shop.findOne({ where: { shopDomain } } as any);
  if (!shop) {
    res.status(404).json({ message: 'Shop not installed. Complete OAuth first.' });
    return;
  }
  try {
    const params: Record<string, string> = { limit: '50' };
    if (search) params.title = search;
    const { data } = await axios.get(
      `https://${shopDomain}/admin/open/2022-01/products.json`,
      {
        headers: { 'X-Shopline-Access-Token': (shop as any).accessToken },
        params,
      }
    );
    // Normalize: return array of { id, title, image, variants: [{id, title, inventory_quantity, price}] }
    const products = (data?.products || data?.data?.products || []).map((p: any) => ({
      id: String(p.id),
      title: p.title,
      image: p.image?.src || p.images?.[0]?.src || null,
      variants: (p.variants || []).map((v: any) => ({
        id: String(v.id),
        title: v.title,
        price: v.price,
        inventory_quantity: v.inventory_quantity ?? v.inventoryQuantity ?? 0,
      })),
    }));
    res.json({ products });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch products', error: err.response?.data || err.message });
  }
});

// Manual ScriptTag registration — call this if OAuth completed but ScriptTag wasn't registered
// POST /api/shopline/register-scripttag  body: { shopDomain, accessToken }
router.post('/register-scripttag', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const { shopDomain, accessToken } = req.body as { shopDomain?: string; accessToken?: string };
  if (!shopDomain || !accessToken) {
    res.status(400).json({ message: 'shopDomain and accessToken are required' });
    return;
  }
  const widgetSrc = `${process.env.BACKEND_URL}/api/shopline/widget.js`;
  try {
    const result = await axios.post(
      `https://${shopDomain}/admin/open/2022-01/script_tags.json`,
      { script_tag: { event: 'onload', src: widgetSrc } },
      { headers: { 'X-Shopline-Access-Token': accessToken } }
    );
    // Save/update the shop record with the access token
    await Shop.upsert({ shopDomain, accessToken, isActive: true, installedAt: new Date() } as any);
    res.json({ message: 'ScriptTag registered', data: result.data });
  } catch (err: any) {
    res.status(500).json({ message: 'ScriptTag registration failed', error: err.response?.data || err.message });
  }
});

// Check if shop is installed and has ScriptTag
router.get('/shop-status', authenticate, requireAdmin, async (req: Request, res: Response) => {
  const { shopDomain } = req.query as { shopDomain?: string };
  if (!shopDomain) {
    res.status(400).json({ message: 'shopDomain query param required' });
    return;
  }
  const shop = await Shop.findOne({ where: { shopDomain } } as any);
  if (!shop) {
    res.json({ installed: false, message: 'Shop not found in database' });
    return;
  }
  // Check ScriptTags currently registered
  try {
    const { data } = await axios.get(
      `https://${shopDomain}/admin/open/2022-01/script_tags.json`,
      { headers: { 'X-Shopline-Access-Token': (shop as any).accessToken } }
    );
    res.json({ installed: true, shopDomain, scriptTags: data });
  } catch (err: any) {
    res.json({ installed: true, shopDomain, scriptTagCheckFailed: err.response?.data || err.message });
  }
});

export default router;
