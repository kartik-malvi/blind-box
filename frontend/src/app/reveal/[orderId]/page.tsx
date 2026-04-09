'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Gift, RotateCcw } from 'lucide-react';
import api from '@/lib/api';
import Image from 'next/image';

const rarityColor: Record<string, string> = {
  common:    'bg-gray-100 text-gray-600 border-gray-200',
  uncommon:  'bg-green-50 text-green-700 border-green-200',
  rare:      'bg-blue-50 text-blue-700 border-blue-200',
  epic:      'bg-purple-50 text-purple-700 border-purple-200',
  legendary: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const rarityGlow: Record<string, string> = {
  common:    '',
  uncommon:  'shadow-green-100',
  rare:      'shadow-blue-200',
  epic:      'shadow-purple-200',
  legendary: 'shadow-yellow-200',
};

export default function RevealPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(true);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    const poll = async () => {
      try {
        const res = await api.get(`/shopline/reveal/${orderId}`);
        setData(res.data);
        setLoading(false);
        setTimeout(() => setAnimating(false), 800);
      } catch (err: any) {
        attempts++;
        if (attempts >= maxAttempts) {
          setError(err.response?.data?.message || 'Reveal not ready yet. Please refresh in a moment.');
          setLoading(false);
        } else {
          // Retry every 3 seconds
          setTimeout(poll, 3000);
        }
      }
    };

    poll();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex flex-col items-center justify-center text-white">
        <div className="text-6xl mb-6 animate-bounce">🎁</div>
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-lg font-semibold">Preparing your reveal…</p>
        <p className="text-sm text-purple-300 mt-1">This takes just a moment</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex flex-col items-center justify-center text-white p-6">
        <div className="text-5xl mb-4">⏳</div>
        <p className="text-lg font-semibold mb-2">Almost there…</p>
        <p className="text-sm text-purple-300 text-center mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 bg-white text-purple-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-purple-50"
        >
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  const item = data?.revealedItem;
  const box  = data?.blindBox;
  const rarity = item?.rarity || 'common';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className={`bg-white rounded-3xl shadow-2xl ${rarityGlow[rarity]} max-w-sm w-full overflow-hidden transform transition-all duration-700 ${animating ? 'scale-75 opacity-0' : 'scale-100 opacity-100'}`}>

        {/* Top banner */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-center text-white">
          <div className="text-3xl mb-1">🎉</div>
          <p className="font-bold text-lg">Your Blind Box Reveal!</p>
          {box && <p className="text-purple-200 text-sm">{box.name}</p>}
        </div>

        {/* Item reveal */}
        <div className="p-6 text-center">
          {item?.imageUrl ? (
            <div className="relative w-48 h-48 mx-auto mb-4 rounded-2xl overflow-hidden border-4 border-purple-100">
              <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-48 h-48 mx-auto mb-4 rounded-2xl bg-purple-50 flex items-center justify-center border-4 border-purple-100">
              <Gift className="w-20 h-20 text-purple-200" />
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-2">{item?.name}</h2>
          {item?.description && <p className="text-sm text-gray-500 mb-3">{item.description}</p>}

          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold capitalize border ${rarityColor[rarity] || rarityColor.common}`}>
            ✨ {rarity}
          </span>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400">Order #{orderId}</p>
            <p className="text-xs text-gray-400 mt-0.5">Check your email for shipping details</p>
          </div>
        </div>
      </div>
    </div>
  );
}
