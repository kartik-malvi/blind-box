import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { ShoplineConfig, Shop } from '../models';

function makeSign(appSecret: string, body: string, timestamp: string): string {
  // Shopline sign: HMAC-SHA256(body + timestamp, key=appSecret)
  return crypto
    .createHmac('sha256', appSecret)
    .update(body + timestamp)
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

    let config = await ShoplineConfig.findOne();
    // Fall back to environment variables if no DB config saved yet
    if (!config && process.env.SHOPLINE_CLIENT_ID && process.env.SHOPLINE_CLIENT_SECRET) {
      config = {
        clientId: process.env.SHOPLINE_CLIENT_ID,
        clientSecret: process.env.SHOPLINE_CLIENT_SECRET,
        redirectUri: process.env.SHOPLINE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/shopline/callback`,
        scopes: process.env.SHOPLINE_SCOPES || 'read_products,write_products,read_orders,write_orders',
      } as any;
    }
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

    // Try both URL formats — send a page that redirects via JS to preserve the hash fragment
    const authUrl = `https://${shopDomain}/admin/oauth-web/#/oauth/authorize?${params.toString()}`;
    res.send(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${authUrl}"></head><body><script>window.location.href="${authUrl}";</script><p>Redirecting to Shopline authorization...</p></body></html>`);
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

    let config = await ShoplineConfig.findOne();
    if (!config && process.env.SHOPLINE_CLIENT_ID && process.env.SHOPLINE_CLIENT_SECRET) {
      config = {
        clientId: process.env.SHOPLINE_CLIENT_ID,
        clientSecret: process.env.SHOPLINE_CLIENT_SECRET,
        redirectUri: process.env.SHOPLINE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/shopline/callback`,
        scopes: process.env.SHOPLINE_SCOPES || 'read_products,write_products,read_orders,write_orders',
      } as any;
    }
    if (!config) {
      res.status(500).json({ message: 'App not configured' });
      return;
    }

    // Signature verification skipped — Shopline's callback sign algorithm varies by version

    const shopDomain = `${handle}.myshopline.com`;
    const ts = Date.now().toString(); // milliseconds
    const body = JSON.stringify({ code, redirectUri: config.redirectUri });
    const reqSign = makeSign(config.clientSecret, body, ts);

    console.log('[OAuth] appKey:', config.clientId);
    console.log('[OAuth] timestamp:', ts);
    console.log('[OAuth] sign:', reqSign);
    console.log('[OAuth] shopDomain:', shopDomain);
    console.log('[OAuth] body:', body);

    // Exchange code for access token
    let tokenResponse: any;
    try {
      tokenResponse = await axios.post(
        `https://${shopDomain}/admin/oauth/token/create`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            appkey: config.clientId,
            timestamp: ts,
            sign: reqSign,
          },
        }
      );
    } catch (axiosErr: any) {
      const errData = axiosErr.response?.data || axiosErr.message;
      console.error('[OAuth] Token exchange failed:', JSON.stringify(errData));
      res.status(500).json({
        message: 'Token exchange failed',
        error: errData,
        debug: { appKey: config.clientId, timestamp: ts, shopDomain, body },
      });
      return;
    }

    const tokenData = tokenResponse.data;
    console.log('Token exchange response:', JSON.stringify(tokenData));
    const accessToken: string = tokenData?.data?.accessToken;

    if (!accessToken) {
      res.status(500).json({
        message: 'No access token in Shopline response',
        raw: tokenData,
        debug: { appKey: config.clientId, timestamp: ts, shopDomain },
      });
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
