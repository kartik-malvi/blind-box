import { Request, Response } from 'express';
import { ShoplineConfig, Shop } from '../models';

// GET current config (masks the secret)
export async function getConfig(req: Request, res: Response): Promise<void> {
  try {
    const config = await ShoplineConfig.findOne();
    if (!config) {
      res.json(null);
      return;
    }
    res.json({
      id: config.id,
      clientId: config.clientId,
      clientSecret: maskSecret(config.clientSecret),
      redirectUri: config.redirectUri,
      scopes: config.scopes,
      installUrl: buildInstallUrl(config),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

// POST / PUT — upsert config
export async function saveConfig(req: Request, res: Response): Promise<void> {
  try {
    const { clientId, clientSecret, redirectUri, scopes } = req.body;
    if (!clientId || !clientSecret || !redirectUri) {
      res.status(400).json({ message: 'clientId, clientSecret and redirectUri are required' });
      return;
    }

    let config = await ShoplineConfig.findOne();
    if (config) {
      // Only update secret if a new (unmasked) one is provided
      const updatedSecret = clientSecret.includes('*') ? config.clientSecret : clientSecret;
      await config.update({ clientId, clientSecret: updatedSecret, redirectUri, scopes });
    } else {
      config = await ShoplineConfig.create({ clientId, clientSecret, redirectUri, scopes });
    }

    res.json({
      id: config.id,
      clientId: config.clientId,
      clientSecret: maskSecret(config.clientSecret),
      redirectUri: config.redirectUri,
      scopes: config.scopes,
      installUrl: buildInstallUrl(config),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

// GET list of installed shops
export async function getInstalledShops(req: Request, res: Response): Promise<void> {
  try {
    const shops = await Shop.findAll({
      attributes: ['id', 'shopDomain', 'isActive', 'installedAt'],
      order: [['installedAt', 'DESC']],
    });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

// DELETE — uninstall / deactivate a shop
export async function deactivateShop(req: Request, res: Response): Promise<void> {
  try {
    const shop = await Shop.findByPk(String(req.params.shopId));
    if (!shop) {
      res.status(404).json({ message: 'Shop not found' });
      return;
    }
    await shop.update({ isActive: false });
    res.json({ message: 'Shop deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function maskSecret(secret: string): string {
  if (secret.length <= 8) return '********';
  return secret.slice(0, 4) + '*'.repeat(secret.length - 8) + secret.slice(-4);
}

function buildInstallUrl(config: ShoplineConfig): string {
  // Merchants navigate to this URL to start the OAuth install flow
  const base = process.env.APP_BASE_URL || 'http://localhost:5000';
  return `${base}/api/shopline/install?shop=YOUR_STORE_DOMAIN`;
}
