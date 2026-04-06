'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { BlindBox, PoolItem } from '@/types';
import { formatPrice, rarityColors } from '@/lib/utils';
import {
  Plus, Trash2, ChevronDown, ChevronUp, Package, Copy, CheckCircle,
  Code, Search, X, ShoppingBag, Zap, Loader2,
} from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://blind-box-beta.vercel.app';

interface ShoplineProduct {
  id: string;
  title: string;
  image: string | null;
  variants: { id: string; title: string; price: string; inventory_quantity: number }[];
}

// ── Autocomplete item name input ──────────────────────────────────────────────
function ProductAutocomplete({
  shopDomain,
  value,
  onChange,
  onSelect,
}: {
  shopDomain: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (p: ShoplineProduct, variantId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const handleInput = (v: string) => {
    onChange(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedSearch(v), 300);
    setOpen(!!v);
  };

  const { data, isFetching } = useQuery<{ products: ShoplineProduct[] }>({
    queryKey: ['product-suggest', shopDomain, debouncedSearch],
    queryFn: () =>
      api.get(`/shopline/store-products?shopDomain=${shopDomain}&search=${debouncedSearch}`)
        .then(r => r.data),
    enabled: open && !!shopDomain && debouncedSearch.length > 0,
    staleTime: 10_000,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative col-span-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          className="input-base pl-9 pr-8"
          placeholder="Type product name to search & auto-fill…"
          value={value}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => value && setOpen(true)}
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-400 animate-spin" />
        )}
        {!isFetching && value && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => { onChange(''); setOpen(false); }}>
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        )}
      </div>

      {open && data?.products && data.products.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {data.products.map(product => (
              <div key={product.id} className="border-b border-gray-50 last:border-0">
                {product.variants.length === 1 ? (
                  <button
                    type="button"
                    onClick={() => { onSelect(product, product.variants[0].id); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 text-left"
                  >
                    {product.image
                      ? <img src={product.image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                      : <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Package className="w-4 h-4 text-gray-300" /></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                      <p className="text-xs text-gray-400">{product.variants[0].inventory_quantity} in stock · ${product.variants[0].price}</p>
                    </div>
                    <ShoppingBag className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50">
                      {product.image
                        ? <img src={product.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                        : <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Package className="w-3.5 h-3.5 text-gray-300" /></div>
                      }
                      <p className="text-xs font-semibold text-gray-700">{product.title}</p>
                    </div>
                    {product.variants.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => { onSelect(product, v.id); setOpen(false); }}
                        className="w-full text-left pl-14 pr-4 py-2 hover:bg-purple-50 flex items-center justify-between"
                      >
                        <span className="text-xs text-gray-700">{v.title}</span>
                        <span className="text-xs text-gray-400">{v.inventory_quantity} in stock · ${v.price}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 py-2 border-t border-gray-50">
            Or keep typing to enter a custom name
          </p>
        </div>
      )}
    </div>
  );
}

// ── Auto-create modal ─────────────────────────────────────────────────────────
function AutoCreateModal({ shopDomain, onClose, onCreated }: {
  shopDomain: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ title: '', price: '', numberOfItems: '5', description: '' });
  const [result, setResult] = useState<{ message: string; items: any[] } | null>(null);
  const [error, setError] = useState('');

  const create = useMutation({
    mutationFn: () => api.post('/blind-boxes/auto-create', {
      title: form.title,
      description: form.description,
      price: parseFloat(form.price),
      numberOfItems: parseInt(form.numberOfItems),
      shopDomain,
    }),
    onSuccess: (res) => {
      setResult(res.data);
      onCreated();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Auto-create failed');
    },
  });

  const rarityBadge: Record<string, string> = {
    legendary: 'bg-yellow-100 text-yellow-700',
    rare: 'bg-blue-100 text-blue-700',
    uncommon: 'bg-green-100 text-green-700',
    common: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-gray-900">Auto Create Blind Box</h2>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        {!result ? (
          <div className="p-5 space-y-3">
            <p className="text-sm text-gray-500">
              Enter a title, price, and how many items — the app will randomly pick products from your store and create the blind box instantly.
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Box Title *</label>
              <input
                className="input-base"
                placeholder="e.g. Summer Mystery Box"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
              <input
                className="input-base"
                placeholder="What's inside? Keep it mysterious…"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price ($) *</label>
                <input
                  className="input-base"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="29.99"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Number of items *</label>
                <input
                  className="input-base"
                  type="number"
                  min="1"
                  max="50"
                  value={form.numberOfItems}
                  onChange={e => setForm({ ...form, numberOfItems: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-purple-50 rounded-xl p-3 text-xs text-purple-700">
              <strong>How it works:</strong> The app fetches your store's products, randomly selects {form.numberOfItems || 'N'} of them, and assigns rarity (legendary → rare → uncommon → common) + weights automatically. You can edit items after creation.
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={() => create.mutate()}
              disabled={!form.title || !form.price || create.isPending}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {create.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                : <><Zap className="w-4 h-4" /> Auto Create Box</>
              }
            </button>
          </div>
        ) : (
          <div className="p-5">
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🎉</div>
              <p className="font-bold text-gray-900">{result.message}</p>
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Items added:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {result.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">{item.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${rarityBadge[item.rarity] || 'bg-gray-100 text-gray-600'}`}>
                      {item.rarity}
                    </span>
                    <span className="text-xs text-gray-400">×{item.stock}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={onClose}
              className="w-full mt-4 bg-purple-600 text-white py-2.5 rounded-xl font-semibold hover:bg-purple-700 transition-colors text-sm"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Embed code helper ─────────────────────────────────────────────────────────
function EmbedCode({ boxId, boxName }: { boxId: string; boxName: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const code = `<iframe src="${APP_URL}/widget?boxId=${boxId}" style="width:100%;height:700px;border:none;border-radius:16px;" allow="payment" loading="lazy" title="${boxName}"></iframe>`;
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium">
        <Code className="w-3.5 h-3.5" />
        {open ? 'Hide embed code' : 'Get embed code'}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="mt-2 bg-gray-50 rounded-xl p-3 border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Paste into a Custom HTML block on your store:</p>
          <textarea readOnly value={code} rows={3}
            className="w-full text-xs font-mono bg-white border border-gray-200 rounded-lg p-2 resize-none text-gray-700 focus:outline-none" />
          <button onClick={copy} className="mt-2 flex items-center gap-1.5 text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors">
            {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ManagePage() {
  const qc = useQueryClient();
  const [expandedBox, setExpandedBox] = useState<string | null>(null);
  const [showAutoCreate, setShowAutoCreate] = useState(false);
  const emptyForm = { name: '', rarity: 'common', weight: '10', stock: '100', imageUrl: '', description: '', shoplineProductId: '', shoplineVariantId: '' };
  const [itemForm, setItemForm] = useState(emptyForm);

  const shopDomain = typeof window !== 'undefined' ? window.location.hostname : '';

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
        shoplineProductId: payload.shoplineProductId || undefined,
        shoplineVariantId: payload.shoplineVariantId || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manage-blind-boxes'] });
      setItemForm(emptyForm);
    },
  });

  const deleteItem = useMutation({
    mutationFn: ({ boxId, itemId }: { boxId: string; itemId: string }) =>
      api.delete(`/blind-boxes/${boxId}/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['manage-blind-boxes'] }),
  });

  return (
    <div className="p-6">
      {showAutoCreate && (
        <AutoCreateModal
          shopDomain={shopDomain}
          onClose={() => setShowAutoCreate(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['manage-blind-boxes'] })}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Blind Boxes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{boxes?.length ?? 0} boxes total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAutoCreate(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-xl hover:opacity-90 transition-opacity text-sm font-medium"
          >
            <Zap className="w-4 h-4" /> Auto Create
          </button>
          <Link
            href="/manage/create"
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Create Box
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (!boxes || boxes.length === 0) && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium mb-1">No blind boxes yet</p>
          <p className="text-gray-400 text-sm mb-4">Create manually or use Auto Create to pull from your store products.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setShowAutoCreate(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              <Zap className="w-4 h-4" /> Auto Create
            </button>
            <Link href="/manage/create" className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4" /> Create Box
            </Link>
          </div>
        </div>
      )}

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
                    {/* Autocomplete item name from store products */}
                    <ProductAutocomplete
                      shopDomain={shopDomain}
                      value={itemForm.name}
                      onChange={(v) => setItemForm({ ...itemForm, name: v, shoplineProductId: '', shoplineVariantId: '' })}
                      onSelect={(product, variantId) => {
                        const variant = product.variants.find(v => v.id === variantId) || product.variants[0];
                        setItemForm({
                          ...itemForm,
                          name: product.variants.length > 1 ? `${product.title} – ${variant.title}` : product.title,
                          imageUrl: product.image || '',
                          stock: String(variant.inventory_quantity || 1),
                          shoplineProductId: product.id,
                          shoplineVariantId: variantId,
                        });
                      }}
                    />

                    <select className="input-base" value={itemForm.rarity} onChange={e => setItemForm({ ...itemForm, rarity: e.target.value })}>
                      {['common', 'uncommon', 'rare', 'legendary'].map(r => (
                        <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                      ))}
                    </select>
                    <input className="input-base" placeholder="Weight (70=common, 10=rare)" type="number" value={itemForm.weight}
                      onChange={e => setItemForm({ ...itemForm, weight: e.target.value })} />
                    <input className="input-base" placeholder="Stock quantity" type="number" value={itemForm.stock}
                      onChange={e => setItemForm({ ...itemForm, stock: e.target.value })} />
                    <input className="input-base col-span-2" placeholder="Image URL (auto-filled if product selected)" value={itemForm.imageUrl}
                      onChange={e => setItemForm({ ...itemForm, imageUrl: e.target.value })} />

                    {itemForm.shoplineProductId && (
                      <div className="col-span-2 flex items-center gap-2 text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
                        Linked to store product · inventory auto-syncs on purchase
                      </div>
                    )}
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
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Items in pool ({box.items.length})</p>
                      <div className="flex flex-col gap-2">
                        {box.items.map((item: PoolItem) => (
                          <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              {(item as any).imageUrl && (
                                <img src={(item as any).imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-100" />
                              )}
                              <span className="font-medium text-sm text-gray-900">{item.name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${rarityColors[item.rarity]}`}>
                                {item.rarity}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>W:{item.weight}</span>
                              <span>Stock:{item.stock}</span>
                              <button onClick={() => deleteItem.mutate({ boxId: box.id, itemId: item.id })} className="text-red-400 hover:text-red-600">
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
