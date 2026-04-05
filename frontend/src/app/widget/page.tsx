'use client';
import { useQuery } from '@tanstack/react-query';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, ShoppingCart, Loader2, X, Gift, User } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { BlindBox } from '@/types';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

const rarityColor: Record<string, string> = {
  common: 'bg-gray-100 text-gray-600',
  uncommon: 'bg-green-100 text-green-700',
  rare: 'bg-blue-100 text-blue-700',
  epic: 'bg-purple-100 text-purple-700',
  legendary: 'bg-yellow-100 text-yellow-700',
};

interface RevealedItem {
  name: string;
  rarity: string;
  imageUrl?: string;
  description?: string;
}

function GuestCheckoutModal({
  box,
  onClose,
  onSuccess,
}: {
  box: BlindBox;
  onClose: () => void;
  onSuccess: (item: RevealedItem) => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!email) { setError('Email is required'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/orders/guest-purchase', {
        blindBoxId: box.id,
        guestEmail: email,
        guestName: name || email.split('@')[0],
      });
      onSuccess(data.revealedItem);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-lg">Buy: {box.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-purple-50 rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">Price</span>
          <span className="font-bold text-purple-700 text-lg">{formatPrice(box.price)}</span>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Your Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Your Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <button
          onClick={submit}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-60 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
          {loading ? 'Opening box…' : 'Open Box & Reveal!'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-3">
          Your email is used to track your order only.
        </p>
      </div>
    </div>
  );
}

function RevealModal({ item, onClose }: { item: RevealedItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-purple-700 mb-2">You got:</h2>
        {item.imageUrl && (
          <div className="relative w-32 h-32 mx-auto mb-4 rounded-xl overflow-hidden">
            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
          </div>
        )}
        <p className="text-xl font-semibold text-gray-900 mb-1">{item.name}</p>
        {item.description && <p className="text-sm text-gray-500 mb-3">{item.description}</p>}
        <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold capitalize ${rarityColor[item.rarity] ?? 'bg-gray-100 text-gray-600'}`}>
          {item.rarity}
        </span>
        <button
          onClick={onClose}
          className="mt-6 flex items-center gap-2 mx-auto text-gray-400 hover:text-gray-600 text-sm"
        >
          <X className="w-4 h-4" /> Close
        </button>
      </div>
    </div>
  );
}

function WidgetContent() {
  const searchParams = useSearchParams();
  const boxId = searchParams.get('boxId');
  const { user } = useAuthStore();

  const [guestBox, setGuestBox] = useState<BlindBox | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<RevealedItem | null>(null);

  const { data: boxes, isLoading, refetch } = useQuery<BlindBox[]>({
    queryKey: ['widget-blind-boxes', boxId],
    queryFn: async () => {
      if (boxId) {
        const { data } = await api.get(`/blind-boxes/${boxId}`);
        return [data];
      }
      return (await api.get('/blind-boxes')).data;
    },
  });

  // Logged-in purchase (existing accounts)
  const handleLoggedInPurchase = async (id: string) => {
    setPurchasing(id);
    try {
      const { data } = await api.post('/orders/purchase', { blindBoxId: id });
      setRevealed(data.revealedItem);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  const handleBuyClick = (box: BlindBox) => {
    if (user) {
      handleLoggedInPurchase(box.id);
    } else {
      setGuestBox(box);
    }
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
          {user ? (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
              <User className="w-3.5 h-3.5" /> {user.name}
            </span>
          ) : (
            <a
              href="/login"
              className="ml-auto text-xs text-purple-600 border border-purple-200 px-2.5 py-1.5 rounded-lg hover:bg-purple-50"
            >
              Sign in
            </a>
          )}
        </div>

        {/* Modals */}
        {guestBox && (
          <GuestCheckoutModal
            box={guestBox}
            onClose={() => setGuestBox(null)}
            onSuccess={(item) => {
              setGuestBox(null);
              setRevealed(item);
              refetch();
            }}
          />
        )}
        {revealed && <RevealModal item={revealed} onClose={() => setRevealed(null)} />}

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        )}

        {!isLoading && (!boxes || boxes.length === 0) && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Package className="w-14 h-14 mb-3" />
            <p className="font-medium">No blind boxes available yet</p>
          </div>
        )}

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
                  onClick={() => handleBuyClick(box)}
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

export default function WidgetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    }>
      <WidgetContent />
    </Suspense>
  );
}
