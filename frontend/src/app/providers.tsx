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

  if (!mounted) return null;

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
