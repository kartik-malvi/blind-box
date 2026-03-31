'use client';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { ShoppingBag, Package, LogOut, User, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-purple-600 flex items-center gap-2">
          <Package className="w-6 h-6" />
          BlindBox Shop
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/shop" className="text-gray-600 hover:text-purple-600 transition-colors">
            Shop
          </Link>
          {user ? (
            <>
              <Link href="/orders" className="text-gray-600 hover:text-purple-600 flex items-center gap-1">
                <ShoppingBag className="w-4 h-4" /> Orders
              </Link>
              {user.role === 'admin' ? (
                <>
                  <Link href="/admin" className="text-gray-600 hover:text-purple-600">
                    Admin
                  </Link>
                  <Link href="/admin/shopline-settings" className="text-gray-600 hover:text-purple-600">
                    Shopline
                  </Link>
                </>
              ) : (
                <Link
                  href="/admin/setup"
                  className="flex items-center gap-1 text-gray-400 hover:text-purple-600 text-sm"
                  title="Upgrade to Admin"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Admin Setup
                </Link>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm">{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-purple-600">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
