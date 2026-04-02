'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BlindBox } from '@/types';
import BlindBoxCard from '@/components/blind-box/BlindBoxCard';
import { Package } from 'lucide-react';

export default function ShopPage() {
  const { data: boxes, isLoading, refetch } = useQuery<BlindBox[]>({
    queryKey: ['blind-boxes'],
    queryFn: async () => {
      const { data } = await api.get('/blind-boxes');
      return data;
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Blind Box Shop</h1>
      <p className="text-gray-500 mb-8">Pick a box, reveal your surprise.</p>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (!boxes || boxes.length === 0) && (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <Package className="w-16 h-16 mb-4" />
          <p>No blind boxes available yet. Check back soon!</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {boxes?.map((box) => (
          <BlindBoxCard key={box.id} box={box} onPurchaseSuccess={() => refetch()} />
        ))}
      </div>
    </div>
  );
}
