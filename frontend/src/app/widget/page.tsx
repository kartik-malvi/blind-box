'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Package, ShoppingCart, Loader2, X, Gift } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { BlindBox } from '@/types';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

export default function WidgetPage() {
  const { user } = useAuthStore();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<{ name: string; rarity: string; imageUrl?: string } | null>(null);

  const { data: boxes, isLoading, refetch } = useQuery<BlindBox[]>({
    queryKey: ['widget-blind-boxes'],
    queryFn: async () => (await api.get('/blind-boxes')).data,
  });

  const handlePurchase = async (boxId: string) => {
    if (!user) {
      window.top ? (window.top.location.href = `${process.env.NEXT_PUBLIC_APP_URL || ''}/login`) : window.location.assign('/login');
      return;
    }
    setPurchasing(boxId);
    try {
      const { data } = await api.post('/orders/purchase', { blindBoxId: boxId });
      setRevealed(data.revealedItem);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  const rarityColor: Record<string, string> = {
    common: 'bg-gray-100 text-gray-600',
    uncommon: 'bg-green-100 text-green-700',
    rare: 'bg-blue-100 text-blue-700',
    epic: 'bg-purple-100 text-purple-700',
    legendary: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Blind Box Shop</h1>
            <p className="text-xs text-gray-500">Pick a box, reveal your surprise</p>
          </div>
          {!user && (
            <a
              href="/login"
              className="ml-auto text-sm text-purple-600 font-semibold border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50"
            >
              Login to buy
            </a>
          )}
        </div>

        {/* Reveal Modal */}
        {revealed && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-purple-700 mb-2">You got:</h2>
              {revealed.imageUrl && (
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-xl overflow-hidden">
                  <Image src={revealed.imageUrl} alt={revealed.name} fill className="object-cover" />
                </div>
              )}
              <p className="text-xl font-semibold text-gray-900 mb-3">{revealed.name}</p>
              <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold capitalize ${rarityColor[revealed.rarity] ?? 'bg-gray-100 text-gray-600'}`}>
                {revealed.rarity}
              </span>
              <button
                onClick={() => setRevealed(null)}
                className="mt-6 flex items-center gap-2 mx-auto text-gray-400 hover:text-gray-600 text-sm"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!boxes || boxes.length === 0) && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Package className="w-14 h-14 mb-3" />
            <p className="font-medium">No blind boxes available yet</p>
          </div>
        )}

        {/* Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {boxes?.map((box) => (
            <div key={box.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col">
              <div className="relative w-full h-36 rounded-xl overflow-hidden bg-purple-50 mb-3 flex items-center justify-center">
                {box.imageUrl ? (
                  <Image src={box.imageUrl} alt={box.name} fill className="object-cover" />
                ) : (
                  <Package className="w-12 h-12 text-purple-200" />
                )}
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{box.name}</h3>
              <p className="text-xs text-gray-500 mb-3 flex-1 line-clamp-2">{box.description}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xl font-bold text-purple-600">{formatPrice(box.price)}</span>
                <button
                  onClick={() => handlePurchase(box.id)}
                  disabled={purchasing === box.id}
                  className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-60 transition-colors"
                >
                  {purchasing === box.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-3.5 h-3.5" />
                  )}
                  {purchasing === box.id ? 'Opening…' : 'Buy Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
