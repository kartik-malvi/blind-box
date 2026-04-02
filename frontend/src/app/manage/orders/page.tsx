'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Package } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface AdminOrder {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  user?: { email: string };
  blindBox?: { name: string };
  revealedItem?: { name: string; rarity: string; imageUrl?: string };
}

export default function ManageOrdersPage() {
  const { data: orders, isLoading } = useQuery<AdminOrder[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => (await api.get('/orders')).data,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">{orders?.length ?? 0} total orders</p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (!orders || orders.length === 0) && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No orders yet</p>
          <p className="text-gray-400 text-sm mt-1">Orders will appear here once customers start purchasing.</p>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Box</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={order.id} className={i % 2 === 0 ? '' : 'bg-gray-50/50'}>
                  <td className="px-5 py-3 text-gray-600">{order.user?.email ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-800 font-medium">{order.blindBox?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    {order.revealedItem ? (
                      <div className="flex items-center gap-2">
                        <span>{order.revealedItem.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-600">
                          {order.revealedItem.rarity}
                        </span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{formatPrice(order.totalPrice)}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
