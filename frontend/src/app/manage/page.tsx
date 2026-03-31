'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { BlindBox, PoolItem } from '@/types';
import { formatPrice, rarityColors } from '@/lib/utils';
import { Plus, Trash2, ChevronDown, ChevronUp, Package, Gift } from 'lucide-react';

export default function ManagePage() {
  const qc = useQueryClient();
  const [expandedBox, setExpandedBox] = useState<string | null>(null);
  const [boxForm, setBoxForm] = useState({ name: '', description: '', price: '', imageUrl: '' });
  const [itemForm, setItemForm] = useState({ name: '', rarity: 'common', weight: '10', stock: '100', imageUrl: '', description: '' });

  const { data: boxes } = useQuery<BlindBox[]>({
    queryKey: ['manage-blind-boxes'],
    queryFn: async () => (await api.get('/blind-boxes')).data,
  });

  const createBox = useMutation({
    mutationFn: (payload: typeof boxForm) =>
      api.post('/blind-boxes', { ...payload, price: parseFloat(payload.price) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manage-blind-boxes'] });
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
            <input
              className="input-base col-span-2 sm:col-span-1"
              placeholder="Box Name"
              value={boxForm.name}
              onChange={(e) => setBoxForm({ ...boxForm, name: e.target.value })}
            />
            <input
              className="input-base col-span-2 sm:col-span-1"
              placeholder="Price (USD)"
              type="number"
              value={boxForm.price}
              onChange={(e) => setBoxForm({ ...boxForm, price: e.target.value })}
            />
            <input
              className="input-base col-span-2"
              placeholder="Description"
              value={boxForm.description}
              onChange={(e) => setBoxForm({ ...boxForm, description: e.target.value })}
            />
            <input
              className="input-base col-span-2"
              placeholder="Image URL (optional)"
              value={boxForm.imageUrl}
              onChange={(e) => setBoxForm({ ...boxForm, imageUrl: e.target.value })}
            />
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
                      <h4 className="font-semibold mb-3 text-gray-700">Add Item to Pool</h4>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <input
                          className="input-base"
                          placeholder="Item Name"
                          value={itemForm.name}
                          onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                        />
                        <select
                          className="input-base"
                          value={itemForm.rarity}
                          onChange={(e) => setItemForm({ ...itemForm, rarity: e.target.value })}
                        >
                          {['common', 'uncommon', 'rare', 'legendary'].map((r) => (
                            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                          ))}
                        </select>
                        <input
                          className="input-base"
                          placeholder="Weight (e.g. 70 = common)"
                          type="number"
                          value={itemForm.weight}
                          onChange={(e) => setItemForm({ ...itemForm, weight: e.target.value })}
                        />
                        <input
                          className="input-base"
                          placeholder="Stock quantity"
                          type="number"
                          value={itemForm.stock}
                          onChange={(e) => setItemForm({ ...itemForm, stock: e.target.value })}
                        />
                        <input
                          className="input-base col-span-2"
                          placeholder="Item Image URL (optional)"
                          value={itemForm.imageUrl}
                          onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                        />
                      </div>
                      <button
                        onClick={() => addItem.mutate({ boxId: box.id, payload: itemForm })}
                        disabled={!itemForm.name || addItem.isPending}
                        className="flex items-center gap-1.5 bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 disabled:opacity-50 text-sm font-medium mb-4 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {addItem.isPending ? 'Adding...' : 'Add Item'}
                      </button>

                      {/* Item List */}
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

        {(!boxes || boxes.length === 0) && (
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
