'use client';
import { useState } from 'react';
import Image from 'next/image';
import { BlindBox } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Package, ShoppingCart, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

interface Props {
  box: BlindBox;
  onPurchaseSuccess?: () => void;
}

export default function BlindBoxCard({ box, onPurchaseSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { name: string; rarity: string; imageUrl?: string }>(null);
  const { user } = useAuthStore();
  const router = useRouter();

  const handlePurchase = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/orders/purchase', { blindBoxId: box.id });
      setResult(data.revealedItem);
      onPurchaseSuccess?.();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center border-2 border-purple-400 animate-pulse-once">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-xl font-bold text-purple-700 mb-1">You got:</h3>
        {result.imageUrl && (
          <div className="relative w-32 h-32 mb-3 rounded-lg overflow-hidden">
            <Image src={result.imageUrl} alt={result.name} fill className="object-cover" />
          </div>
        )}
        <p className="text-lg font-semibold">{result.name}</p>
        <span className="mt-2 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700 capitalize">
          {result.rarity}
        </span>
        <button
          onClick={() => { setResult(null); }}
          className="mt-4 text-sm text-gray-500 underline"
        >
          Buy another
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow p-5 flex flex-col">
      <div className="relative w-full h-48 rounded-xl overflow-hidden bg-purple-50 mb-4 flex items-center justify-center">
        {box.imageUrl ? (
          <Image src={box.imageUrl} alt={box.name} fill className="object-cover" />
        ) : (
          <Package className="w-16 h-16 text-purple-300" />
        )}
      </div>
      <h3 className="text-lg font-bold mb-1">{box.name}</h3>
      <p className="text-gray-500 text-sm mb-3 flex-1 line-clamp-2">{box.description}</p>
      {box.items && box.items.length > 0 && (
        <p className="text-xs text-gray-400 mb-3">{box.items.length} possible items inside</p>
      )}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-2xl font-bold text-purple-600">{formatPrice(box.price)}</span>
        <button
          onClick={handlePurchase}
          disabled={loading}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
          {loading ? 'Opening...' : 'Buy Now'}
        </button>
      </div>
    </div>
  );
}
