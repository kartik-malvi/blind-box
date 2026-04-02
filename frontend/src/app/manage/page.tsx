'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { BlindBox, PoolItem } from '@/types';
import { formatPrice, rarityColors } from '@/lib/utils';
import { Plus, Trash2, ChevronDown, ChevronUp, Package, Copy, CheckCircle, Code, ChevronRight } from 'lucide-react';

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
          <p className="text-xs text-gray-500 mb-2">Paste into a Custom HTML block on your store:</p>
          <textarea
            readOnly value={code} rows={3}
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
  const qc = useQueryClient();
  const [expandedBox, setExpandedBox] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({ name: '', rarity: 'common', weight: '10', stock: '100', imageUrl: '', description: '' });

  const { data: boxes, isLoading } = useQuery<BlindBox[]>({
    queryKey: ['manage-blind-boxes'],
    queryFn: async () => (await api.get('/blind-boxes')).data,
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

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Blind Boxes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{boxes?.length ?? 0} boxes total</p>
        </div>
        <Link
          href="/manage/create"
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Create Box
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!boxes || boxes.length === 0) && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium mb-1">No blind boxes yet</p>
          <p className="text-gray-400 text-sm mb-4">Create your first blind box to get started.</p>
          <Link
            href="/manage/create"
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Create Box
          </Link>
        </div>
      )}

      {/* Box list */}
      {boxes && boxes.length > 0 && (
        <div className="flex flex-col gap-3">
          {boxes.map((box) => (
            <div key={box.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedBox(expandedBox === box.id ? null : box.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{box.name}</p>
                    <p className="text-xs text-gray-400">{formatPrice(box.price)} · {box.items?.length ?? 0} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteBox.mutate(box.id); }}
                    className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedBox === box.id
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {expandedBox === box.id && (
                <div className="border-t border-gray-100 p-5">
                  <EmbedCode boxId={box.id} boxName={box.name} />

                  <h4 className="font-semibold text-sm text-gray-700 mt-5 mb-3">Add Item to Pool</h4>
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
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Items in pool</p>
                      <div className="flex flex-col gap-2">
                        {box.items.map((item: PoolItem) => (
                          <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-gray-900">{item.name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${rarityColors[item.rarity]}`}>
                                {item.rarity}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>Weight: {item.weight}</span>
                              <span>Stock: {item.stock}</span>
                              <button
                                onClick={() => deleteItem.mutate({ boxId: box.id, itemId: item.id })}
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
