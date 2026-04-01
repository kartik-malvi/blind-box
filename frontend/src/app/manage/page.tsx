'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { BlindBox, PoolItem } from '@/types';
import { formatPrice, rarityColors } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { Plus, Trash2, ChevronDown, ChevronUp, Package, Gift, Copy, CheckCircle, Code } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://blind-box-beta.vercel.app';

function EmbedCode({ boxId, boxName }: { boxId: string; boxName: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const code = `<iframe src="${APP_URL}/widget?boxId=${boxId}" style="width:100%;height:700px;border:none;border-radius:16px;" allow="payment" loading="lazy" title="${boxName}"></iframe>`;

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium"
      >
        <Code className="w-3.5 h-3.5" />
        {open ? 'Hide embed code' : 'Get embed code'}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="mt-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Paste this in a Custom HTML block on your Shopline store page:</p>
          <textarea
            readOnly
            value={code}
            rows={3}
            className="w-full text-xs font-mono bg-white border border-gray-200 rounded-lg p-2 resize-none text-gray-700 focus:outline-none"
          />
          <button
            onClick={copy}
            className="mt-2 flex items-center gap-1.5 text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors"
          >
            {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ManagePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [expandedBox, setExpandedBox] = useState<string | null>(null);
  const [lastCreatedBox, setLastCreatedBox] = useState<{ id: string; name: string } | null>(null);
  const [boxForm, setBoxForm] = useState({ name: '', description: '', price: '', imageUrl: '' });
  const [itemForm, setItemForm] = useState({ name: '', rarity: 'common', weight: '10', stock: '100', imageUrl: '', description: '' });

  const { data: boxes } = useQuery<BlindBox[]>({
    queryKey: ['manage-blind-boxes'],
    queryFn: async () => (await api.get('/blind-boxes')).data,
  });

  const createBox = useMutation({
    mutationFn: (payload: typeof boxForm) =>
      api.post('/blind-boxes', { ...payload, price: parseFloat(payload.price) }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['manage-blind-boxes'] });
      setLastCreatedBox({ id: res.data.id, name: res.data.name });
      setBoxForm({ name: '', description: '', price: '', imageUrl: '' });
    },
  });

  const deleteBox = useMutation({
    mutationFn: (id: string) => api.delete(`/blind-boxes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manage-blind-boxes'] }),
  });

  const addItem = useMutation({
    mutationFn: ({ boxId, payload }: { boxId: string; payload: typeof itemForm }) =>
      api.post(`/blind-boxes/${boxId}/items`, {
        ...payload,
        weight: parseInt(payload.weight),
        stock: parseInt(payload.stock),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manage-blind-boxes'] });
      setItemForm({ name: '', rarity: 'common', weight: '10', stock: '100', imageUrl: '', description: '' });
    },
  });

  const deleteItem = useMutation({
    mutationFn: ({ boxId, itemId }: { boxId: string; itemId: string }) =>
      api.delete(`/blind-boxes/${boxId}/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manage-blind-boxes'] }),
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <Gift className="w-10 h-10 text-purple-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Admin Login Required</h2>
          <p className="text-sm text-gray-500 mb-4">Please log in to manage blind boxes.</p>
          <a
            href="/login?redirect=/manage"
            className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 inline-block transition-colors"
          >
            Log In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blind Box Manager</h1>
            <p className="text-sm text-gray-500">Create and manage your blind boxes</p>
          </div>
        </div>

        {/* Create Blind Box */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-600" /> Create Blind Box
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <input className="input-base col-span-2 sm:col-span-1" placeholder="Box Name" value={boxForm.name}
              onChange={(e) => setBoxForm({ ...boxForm, name: e.target.value })} />
            <input className="input-base col-span-2 sm:col-span-1" placeholder="Price (USD)" type="number" value={boxForm.price}
              onChange={(e) => setBoxForm({ ...boxForm, price: e.target.value })} />
            <input className="input-base col-span-2" placeholder="Description" value={boxForm.description}
              onChange={(e) => setBoxForm({ ...boxForm, description: e.target.value })} />
            <input className="input-base col-span-2" placeholder="Image URL (optional)" value={boxForm.imageUrl}
              onChange={(e) => setBoxForm({ ...boxForm, imageUrl: e.target.value })} />
          </div>
          <button
            onClick={() => createBox.mutate(boxForm)}
            disabled={!boxForm.name || !boxForm.price || createBox.isPending}
            className="mt-4 flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 disabled:opacity-50 font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {createBox.isPending ? 'Creating...' : 'Create Box'}
          </button>
        </div>

        {/* Shortcode panel — shown after creating a box */}
        {lastCreatedBox && (
          <div className="bg-white rounded-2xl shadow-sm border-2 border-purple-300 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">"{lastCreatedBox.name}" created!</h3>
              </div>
              <button onClick={() => setLastCreatedBox(null)} className="text-gray-400 hover:text-gray-600 text-xs">Dismiss</button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Copy this embed code and paste it into a <strong>Custom HTML block</strong> on any page of your Shopline store to show this blind box:
            </p>
            <EmbedCodeFull boxId={lastCreatedBox.id} boxName={lastCreatedBox.name} />
          </div>
        )}

        {/* Existing Boxes */}
        {boxes && boxes.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-700">Your Blind Boxes ({boxes.length})</h2>
            <div className="flex flex-col gap-3">
              {boxes.map((box) => (
                <div key={box.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedBox(expandedBox === box.id ? null : box.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                        <Package className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{box.name}</h3>
                        <p className="text-sm text-gray-500">{formatPrice(box.price)} · {box.items?.length ?? 0} items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteBox.mutate(box.id); }}
                        className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {expandedBox === box.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  {expandedBox === box.id && (
                    <div className="border-t border-gray-100 p-5">
                      {/* Embed code for this box */}
                      <EmbedCode boxId={box.id} boxName={box.name} />

                      <h4 className="font-semibold mb-3 text-gray-700 mt-4">Add Item to Pool</h4>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <input className="input-base" placeholder="Item Name" value={itemForm.name}
                          onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
                        <select className="input-base" value={itemForm.rarity}
                          onChange={(e) => setItemForm({ ...itemForm, rarity: e.target.value })}>
                          {['common', 'uncommon', 'rare', 'legendary'].map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                        <input className="input-base" placeholder="Weight (70=common, 10=rare)" type="number" value={itemForm.weight}
                          onChange={(e) => setItemForm({ ...itemForm, weight: e.target.value })} />
                        <input className="input-base" placeholder="Stock quantity" type="number" value={itemForm.stock}
                          onChange={(e) => setItemForm({ ...itemForm, stock: e.target.value })} />
                        <input className="input-base col-span-2" placeholder="Item Image URL (optional)" value={itemForm.imageUrl}
                          onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })} />
                      </div>
                      <button
                        onClick={() => addItem.mutate({ boxId: box.id, payload: itemForm })}
                        disabled={!itemForm.name || addItem.isPending}
                        className="flex items-center gap-1.5 bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 disabled:opacity-50 text-sm font-medium mb-4 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {addItem.isPending ? 'Adding...' : 'Add Item'}
                      </button>

                      {box.items && box.items.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Items in pool</p>
                          {box.items.map((item: PoolItem) => (
                            <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-gray-900">{item.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${rarityColors[item.rarity]}`}>
                                  {item.rarity}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Weight: {item.weight}</span>
                                <span>Stock: {item.stock}</span>
                                <button
                                  onClick={() => deleteItem.mutate({ boxId: box.id, itemId: item.id })}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(!boxes || boxes.length === 0) && !lastCreatedBox && (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No blind boxes yet. Create your first one above!</p>
          </div>
        )}
      </div>

      <style jsx global>{`
        .input-base {
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          outline: none;
          width: 100%;
          background: white;
        }
        .input-base:focus {
          border-color: #a78bfa;
          box-shadow: 0 0 0 2px rgba(167, 139, 250, 0.2);
        }
      `}</style>
    </div>
  );
}

function EmbedCodeFull({ boxId, boxName }: { boxId: string; boxName: string }) {
  const [copied, setCopied] = useState(false);
  const code = `<iframe src="${APP_URL}/widget?boxId=${boxId}" style="width:100%;height:700px;border:none;border-radius:16px;" allow="payment" loading="lazy" title="${boxName}"></iframe>`;

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <textarea
        readOnly
        value={code}
        rows={3}
        className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl p-3 resize-none text-gray-700 focus:outline-none"
      />
      <button
        onClick={copy}
        className="mt-2 flex items-center gap-1.5 text-sm bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors font-medium"
      >
        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy Embed Code'}
      </button>
    </div>
  );
}
