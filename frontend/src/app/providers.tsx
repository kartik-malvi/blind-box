'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    init();
    setMounted(true);
  }, [init]);

  return (
    <QueryClientProvider client={queryClient}>
      {mounted ? children : <div className="min-h-screen bg-gray-50" />}
    </QueryClientProvider>
  );
}
