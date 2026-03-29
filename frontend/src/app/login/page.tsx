'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/shop');
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Welcome Back</h1>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-60 transition-colors"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link href="/register" className="text-purple-600 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
