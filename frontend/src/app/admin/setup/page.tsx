'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function AdminSetupPage() {
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { makeAdmin, isLoading, user } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await makeAdmin(adminKey);
      setSuccess(true);
      setTimeout(() => router.push('/admin'), 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to upgrade account');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <p className="text-gray-500">Please <a href="/login" className="text-purple-600 font-medium">log in</a> first.</p>
        </div>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">You are already an admin</h2>
          <a href="/admin" className="text-purple-600 font-medium">Go to Admin Dashboard →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Admin Setup</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Enter your admin secret key to upgrade your account (<strong>{user.name}</strong>) to admin.
        </p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4">Account upgraded! Redirecting...</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Admin Secret Key"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            required
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            type="submit"
            disabled={isLoading || !adminKey}
            className="bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-60 transition-colors"
          >
            {isLoading ? 'Upgrading...' : 'Become Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
