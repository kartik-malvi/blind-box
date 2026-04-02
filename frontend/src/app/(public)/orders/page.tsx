'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Order } from '@/types';
import { rarityColors, formatPrice } from '@/lib/utils';
import { Package } from 'lucide-react';
import Image from 'next/image';

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders/my');
      return data;
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {isLoading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (!orders || orders.length === 0) && (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <Package className="w-16 h-16 mb-4" />
          <p>No orders yet. Go open some blind boxes!</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {orders?.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl shadow-md p-5 flex items-center gap-5">
            {order.revealedItem?.imageUrl ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={order.revealedItem.imageUrl} alt={order.revealedItem.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-8 h-8 text-purple-300" />
              </div>
            )}

            <div className="flex-1">
              <p className="font-semibold text-lg">{order.revealedItem?.name ?? 'Unknown Item'}</p>
              <p className="text-gray-500 text-sm">From: {order.blindBox?.name}</p>
              {order.revealedItem?.rarity && (
                <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${rarityColors[order.revealedItem.rarity]}`}>
                  {order.revealedItem.rarity}
                </span>
              )}
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-bold text-purple-600">{formatPrice(order.totalPrice)}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
              <span className="text-xs text-gray-500 capitalize">{order.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
