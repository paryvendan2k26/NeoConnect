'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/dashboard' : '/login');
    }
  }, [user, loading, router]);
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
  </div>;
}
