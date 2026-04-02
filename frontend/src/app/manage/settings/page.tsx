'use client';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { CheckCircle } from 'lucide-react';

interface ShoplineConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
}

export default function ManageSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<ShoplineConfig>({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: 'read_products,write_products,read_orders,write_orders',
  });

  const { isLoading } = useQuery({
    queryKey: ['shopline-config'],
    queryFn: async () => {
      const { data } = await api.get('/shopline/config');
      setForm({
        clientId: data.clientId ?? '',
        clientSecret: data.clientSecret ?? '',
        redirectUri: data.redirectUri ?? '',
        scopes: data.scopes ?? 'read_products,write_products,read_orders,write_orders',
      });
      return data;
    },
  });

  const save = useMutation({
    mutationFn: () => api.post('/shopline/config', form),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const installUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://blind-box-production.up.railway.app'}/api/shopline/install?shop=YOUR_STORE.myshopline.com`;

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Install link */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6">
        <p className="text-sm font-semibold text-purple-800 mb-1">Install App on Store</p>
        <p className="text-xs text-purple-600 mb-2">Use this URL to install the app on a Shopline store:</p>
        <code className="block text-xs bg-white border border-purple-200 rounded-lg px-3 py-2 text-gray-700 break-all">
          {installUrl}
        </code>
      </div>

      {/* Config form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 text-sm">Shopline App Credentials</h2>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">App Key (Client ID)</label>
              <input className="input-base" value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })} placeholder="From Shopline Partner Dashboard" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">App Secret (Client Secret)</label>
              <input className="input-base" type="password" value={form.clientSecret}
                onChange={(e) => setForm({ ...form, clientSecret: e.target.value })} placeholder="••••••••" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Redirect URI</label>
              <input className="input-base" value={form.redirectUri}
                onChange={(e) => setForm({ ...form, redirectUri: e.target.value })}
                placeholder="https://blind-box-production.up.railway.app/api/shopline/callback" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Scopes</label>
              <input className="input-base" value={form.scopes}
                onChange={(e) => setForm({ ...form, scopes: e.target.value })} />
            </div>

            <button
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="mt-2 flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 font-medium transition-colors text-sm"
            >
              {saved ? <CheckCircle className="w-4 h-4" /> : null}
              {save.isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .input-base {
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.5rem 0.875rem;
          font-size: 0.875rem;
          outline: none;
          width: 100%;
          background: white;
        }
        .input-base:focus { border-color: #a78bfa; }
      `}</style>
    </div>
  );
}
