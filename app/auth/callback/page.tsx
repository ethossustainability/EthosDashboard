'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/home');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <p className="text-sm text-warm-gray">Signing you in...</p>
    </div>
  );
}
