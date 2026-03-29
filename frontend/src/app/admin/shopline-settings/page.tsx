'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Copy, CheckCircle, Trash2, RefreshCw, ExternalLink, Settings } from 'lucide-react';

interface ShoplineConfig {
  id?: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
  installUrl?: string;
}

interface Shop {
  id: string;
  shopDomain: string;
  isActive: boolean;
  installedAt: string;
}

export default function ShoplineSettingsPage() {
  const qc = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<ShoplineConfig>({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: 'read_products,write_products,read_orders,write_orders,read_inventory,write_inventory',
  });

  const { data: config, isLoading } = useQuery<ShoplineConfig>({
    queryKey: ['shopline-config'],
    queryFn: async () => (await api.get('/shopline/config')).data,
  });

  const { data: shops } = useQuery<Shop[]>({
    queryKey: ['installed-shops'],
    queryFn: async () => (await api.get('/shopline/shops')).data,
  });

  useEffect(() => {
    if (config) {
      setForm({
        clientId: config.clientId ?? '',
        clientSecret: config.clientSecret ?? '',
        redirectUri: config.redirectUri ?? '',
        scopes: config.scopes ?? '',
      });
    }
  }, [config]);

  const saveConfig = useMutation({
    mutationFn: (payload: ShoplineConfig) => api.post('/shopline/config', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['shopline-config'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const deactivateShop = useMutation({
    mutationFn: (shopId: string) => api.delete(`/shopline/shops/${shopId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['installed-shops'] }),
  });

  const copyInstallUrl = () => {
    if (config?.installUrl) {
      navigator.clipboard.writeText(config.installUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:5000';
  const callbackUrl = `${backendBase}/api/shopline/callback`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="w-7 h-7 text-purple-600" />
        <h1 className="text-3xl font-bold">Shopline App Settings</h1>
      </div>

      {/* Callback URL helper */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-8">
        <p className="text-sm font-semibold text-blue-700 mb-1">Your OAuth Callback URL</p>
        <p className="text-xs text-blue-500 mb-2">
          Paste this into your Shopline developer dashboard → App → Redirect URI
        </p>
        <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-xl px-4 py-2">
          <code className="text-sm flex-1 text-blue-800 break-all">{callbackUrl}</code>
          <button
            onClick={() => { navigator.clipboard.writeText(callbackUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="text-blue-400 hover:text-blue-600"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Config Form */}
      <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-5">App Credentials</h2>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm"
                placeholder="e.g. c038f8cd0bffa51b8cb2edf62ca2659796451365"
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono text-sm"
                placeholder="Your app secret"
                value={form.clientSecret}
                onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URI</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                placeholder={callbackUrl}
                value={form.redirectUri}
                onChange={(e) => setForm({ ...form, redirectUri: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Must match exactly what you set in the Shopline developer dashboard.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scopes</label>
              <input
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                value={form.scopes}
                onChange={(e) => setForm({ ...form, scopes: e.target.value })}
              />
            </div>

            <button
              onClick={() => saveConfig.mutate(form)}
              disabled={!form.clientId || !form.clientSecret || !form.redirectUri || saveConfig.isPending}
              className="flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 font-semibold transition-colors"
            >
              {saveConfig.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {saved ? '✓ Saved!' : 'Save Credentials'}
            </button>
          </div>
        )}
      </div>

      {/* Install Link */}
      {config?.installUrl && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8">
          <p className="text-sm font-semibold text-green-700 mb-1">Merchant Install Link</p>
          <p className="text-xs text-green-500 mb-2">
            Share this link with merchants. Replace <code className="bg-green-100 px-1 rounded">YOUR_STORE_DOMAIN</code> with the actual store domain (e.g. <code className="bg-green-100 px-1 rounded">mystore.myshopline.com</code>).
          </p>
          <div className="flex items-center gap-2 bg-white border border-green-200 rounded-xl px-4 py-2">
            <code className="text-sm flex-1 text-green-800 break-all">{config.installUrl}</code>
            <button onClick={copyInstallUrl} className="text-green-400 hover:text-green-600">
              {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Widget Info */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 mb-8">
        <p className="text-sm font-semibold text-purple-700 mb-1">Blind Box Widget — Storefront Embed</p>
        <p className="text-xs text-purple-600 mb-3">
          When a merchant installs the app via the link above, a floating <strong>"Blind Box"</strong> button is automatically added to every page of their Shopline store. Customers can click it to browse and buy blind boxes without leaving the store.
        </p>
        <a
          href="/widget"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-white border border-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-100"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Preview widget page
        </a>
      </div>

      {/* Installed Shops */}
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Installed Stores</h2>
        {!shops || shops.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No stores have installed this app yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {shops.map((shop) => (
              <div key={shop.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{shop.shopDomain}</span>
                    <a
                      href={`https://${shop.shopDomain}/admin`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-purple-500"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Installed {new Date(shop.installedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${shop.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {shop.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {shop.isActive && (
                    <button
                      onClick={() => deactivateShop.mutate(shop.id)}
                      className="text-red-400 hover:text-red-600"
                      title="Deactivate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
