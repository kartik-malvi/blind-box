import { Request, Response } from 'express';
import axios from 'axios';
import { ShoplineConfig, Shop } from '../models';

// Step 1 — Redirect merchant to Shopline OAuth consent screen
export async function install(req: Request, res: Response): Promise<void> {
  try {
    const shopDomain = req.query.shop as string;
    if (!shopDomain) {
      res.status(400).json({ message: 'Missing shop parameter' });
      return;
    }

    const config = await ShoplineConfig.findOne();
    if (!config) {
      res.status(500).json({ message: 'Shopline app not configured. Please set credentials in Admin > Shopline Settings.' });
      return;
    }

    const state = Buffer.from(JSON.stringify({ shopDomain, ts: Date.now() })).toString('base64');

    const authUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`);
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('scope', config.scopes);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);

    res.redirect(authUrl.toString());
  } catch (err) {
    res.status(500).json({ message: 'Install failed', error: err });
  }
}

// Step 2 — Shopline redirects back with code; exchange for access token
export async function callback(req: Request, res: Response): Promise<void> {
  try {
    const { code, state } = req.query as Record<string, string>;

    if (!code || !state) {
      res.status(400).json({ message: 'Missing code or state' });
      return;
    }

    const { shopDomain } = JSON.parse(Buffer.from(state, 'base64').toString());

    const config = await ShoplineConfig.findOne();
    if (!config) {
      res.status(500).json({ message: 'App not configured' });
      return;
    }

    // Exchange code for access token
    const tokenResponse = await axios.post(
      `https://${shopDomain}/admin/oauth/access_token`,
      {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
      }
    );

    const accessToken: string = tokenResponse.data.access_token;

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
