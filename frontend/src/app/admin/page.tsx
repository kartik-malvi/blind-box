'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { BlindBox, PoolItem } from '@/types';
import { formatPrice, rarityColors } from '@/lib/utils';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminPage() {
  const qc = useQueryClient();
  const [expandedBox, setExpandedBox] = useState<string | null>(null);

  // Blind Box form
  const [boxForm, setBoxForm] = useState({ name: '', description: '', price: '', imageUrl: '' });
  // Item form
  const [itemForm, setItemForm] = useState({ name: '', rarity: 'common', weight: '10', stock: '100', imageUrl: '', description: '' });

  const { data: boxes } = useQuery<BlindBox[]>({
    queryKey: ['blind-boxes-admin'],
    queryFn: async () => (await api.get('/blind-boxes')).data,
  });

  const createBox = useMutation({
    mutationFn: (payload: typeof boxForm) =>
      api.post('/blind-boxes', { ...payload, price: parseFloat(payload.price) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blind-boxes-admin'] });
      setBoxForm({ name: '', description: '', price: '', imageUrl: '' });
    },
  });

  const deleteBox = useMutation({
    mutationFn: (id: string) => api.delete(`/blind-boxes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blind-boxes-admin'] }),
  });

  const addItem = useMutation({
    mutationFn: ({ boxId, payload }: { boxId: string; payload: typeof itemForm }) =>
      api.post(`/blind-boxes/${boxId}/items`, {
        ...payload,
        weight: parseInt(payload.weight),
        stock: parseInt(payload.stock),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blind-boxes-admin'] });
      setItemForm({ name: '', rarity: 'common', weight: '10', stock: '100', imageUrl: '', description: '' });
    },
  });

  const deleteItem = useMutation({
    mutationFn: ({ boxId, itemId }: { boxId: string; itemId: string }) =>
      api.delete(`/blind-boxes/${boxId}/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blind-boxes-admin'] }),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Create Blind Box */}
      <section className="bg-white rounded-2xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create Blind Box</h2>
        <div className="grid grid-cols-2 gap-3">
          <input className="input-base col-span-2 md:col-span-1" placeholder="Name" value={boxForm.name}
            onChange={(e) => setBoxForm({ ...boxForm, name: e.target.value })} />
          <input className="input-base col-span-2 md:col-span-1" placeholder="Price (USD)" type="number" value={boxForm.price}
            onChange={(e) => setBoxForm({ ...boxForm, price: e.target.value })} />
          <input className="input-base col-span-2" placeholder="Description" value={boxForm.description}
            onChange={(e) => setBoxForm({ ...boxForm, description: e.target.value })} />
          <input className="input-base col-span-2" placeholder="Image URL (optional)" value={boxForm.imageUrl}
            onChange={(e) => setBoxForm({ ...boxForm, imageUrl: e.target.value })} />
        </div>
        <button
          onClick={() => createBox.mutate(boxForm)}
          disabled={!boxForm.name || !boxForm.price}
          className="mt-4 flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-xl hover:bg-purple-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Create Box
        </button>
      </section>

      {/* Blind Box List */}
      <section className="flex flex-col gap-4">
        {boxes?.map((box) => (
          <div key={box.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="flex items-center justify-between p-5 cursor-pointer"
              onClick={() => setExpandedBox(expandedBox === box.id ? null : box.id)}>
              <div>
                <h3 className="font-bold text-lg">{box.name}</h3>
                <p className="text-gray-500 text-sm">{formatPrice(box.price)} · {(box.items?.length ?? 0)} items</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); deleteBox.mutate(box.id); }}
                  className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedBox === box.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>

            {expandedBox === box.id && (
              <div className="border-t border-gray-100 p-5">
                {/* Add Item Form */}
                <h4 className="font-semibold mb-3">Add Pool Item</h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <input className="input-base" placeholder="Item Name" value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
                  <select className="input-base" value={itemForm.rarity}
                    onChange={(e) => setItemForm({ ...itemForm, rarity: e.target.value })}>
                    {['common', 'uncommon', 'rare', 'legendary'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <input className="input-base" placeholder="Weight (e.g. 70)" type="number" value={itemForm.weight}
                    onChange={(e) => setItemForm({ ...itemForm, weight: e.target.value })} />
                  <input className="input-base" placeholder="Stock (e.g. 100)" type="number" value={itemForm.stock}
                    onChange={(e) => setItemForm({ ...itemForm, stock: e.target.value })} />
                  <input className="input-base col-span-2" placeholder="Image URL (optional)" value={itemForm.imageUrl}
                    onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })} />
                </div>
                <button
                  onClick={() => addItem.mutate({ boxId: box.id, payload: itemForm })}
                  disabled={!itemForm.name}
                  className="flex items-center gap-1 bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 disabled:opacity-50 text-sm mb-4"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>

                {/* Item List */}
                <div className="flex flex-col gap-2">
                  {box.items?.map((item: PoolItem) => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2">
                      <div>
                        <span className="font-medium text-sm">{item.name}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${rarityColors[item.rarity]}`}>
                          {item.rarity}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Weight: {item.weight}</span>
                        <span>Stock: {item.stock}</span>
                        <button onClick={() => deleteItem.mutate({ boxId: box.id, itemId: item.id })}
                          className="text-red-400 hover:text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </section>

      <style jsx global>{`
        .input-base {
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          outline: none;
          width: 100%;
        }
        .input-base:focus {
          ring: 2px solid #a78bfa;
          border-color: #a78bfa;
        }
      `}</style>
    </div>
  );
}
