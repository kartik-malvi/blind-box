import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { ShoplineConfig, Shop } from '../models';

function makeSign(appSecret: string, appKey: string, timestamp: string): string {
  // Shopline sign: HMAC-SHA256(appSecret, appKey + timestamp)
  return crypto
    .createHmac('sha256', appSecret)
    .update(appKey + timestamp)
    .digest('hex');
}

// Step 1 — Redirect merchant to Shopline OAuth consent screen
export async function install(req: Request, res: Response): Promise<void> {
  try {
    const shopDomain = req.query.shop as string; // e.g. mystore.myshopline.com
    if (!shopDomain) {
      res.status(400).json({ message: 'Missing shop parameter (e.g. ?shop=mystore.myshopline.com)' });
      return;
    }

    const config = await ShoplineConfig.findOne();
    if (!config) {
      res.status(500).json({ message: 'Shopline app not configured. Go to Admin > Shopline Settings.' });
      return;
    }

    // Build Shopline authorization URL
    // Format: https://{shop}/admin/oauth-web/#/oauth/authorize?appKey=...&responseType=code&scope=...&redirectUri=...
    const params = new URLSearchParams({
      appKey: config.clientId,
      responseType: 'code',
      scope: config.scopes,
      redirectUri: config.redirectUri,
    });

    const authUrl = `https://${shopDomain}/admin/oauth-web/#/oauth/authorize?${params.toString()}`;
    res.redirect(authUrl);
  } catch (err) {
    res.status(500).json({ message: 'Install failed', error: (err as Error).message });
  }
}

// Step 2 — Shopline redirects back with code + handle
export async function callback(req: Request, res: Response): Promise<void> {
  try {
    // Shopline sends: code, handle (store identifier), timestamp, sign
    const { code, handle, timestamp, sign } = req.query as Record<string, string>;

    if (!code || !handle) {
      res.status(400).json({ message: 'Missing code or handle from Shopline callback' });
      return;
    }

    const config = await ShoplineConfig.findOne();
    if (!config) {
      res.status(500).json({ message: 'App not configured' });
      return;
    }

    // Optional: verify the sign from Shopline
    if (sign && timestamp) {
      const expectedSign = makeSign(config.clientSecret, config.clientId, timestamp);
      if (sign !== expectedSign) {
        res.status(400).json({ message: 'Invalid signature' });
        return;
      }
    }

    const shopDomain = `${handle}.myshopline.com`;
    const ts = Date.now().toString();
    const reqSign = makeSign(config.clientSecret, config.clientId, ts);

    // Exchange code for access token
    const tokenResponse = await axios.post(
      `https://${shopDomain}/admin/oauth/token/create`,
      { code },
      {
        headers: {
          'Content-Type': 'application/json',
          appkey: config.clientId,
          timestamp: ts,
          sign: reqSign,
        },
      }
    );

    const tokenData = tokenResponse.data;
    const accessToken: string = tokenData?.data?.accessToken;

    if (!accessToken) {
      res.status(500).json({ message: 'No access token in Shopline response', raw: tokenData });
      return;
    }

    // Upsert shop record
    await Shop.upsert({
      shopDomain,
      accessToken,
      isActive: true,
      installedAt: new Date(),
    } as any);

    // Register ScriptTag so the blind box widget appears on the storefront
    const widgetSrc = `${process.env.BACKEND_URL || `https://${req.headers.host}`}/api/shopline/widget.js`;
    try {
      await axios.post(
        `https://${shopDomain}/admin/open/2022-01/script_tags.json`,
        { script_tag: { event: 'onload', src: widgetSrc } },
        { headers: { 'X-Shopline-Access-Token': accessToken } }
      );
    } catch {
      // ScriptTag registration is best-effort; don't block install
    }

    // Redirect merchant to their Shopline admin
    res.redirect(`https://${shopDomain}/admin`);
  } catch (err) {
    res.status(500).json({ message: 'OAuth callback failed', error: (err as Error).message });
  }
}
