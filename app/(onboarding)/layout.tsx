import type * as React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { LockedSidebarClient } from '@/components/layout/LockedSidebarClient';

type OnboardingLayoutProps = {
  children: React.ReactNode;
};

export default async function OnboardingLayout({ children }: OnboardingLayoutProps) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          return;
        },
      },
    },
  );

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (!authUser || error) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('user_id', authUser.id)
    .single();

  return (
    <LockedSidebarClient
      firstName={user?.first_name ?? 'Ethos'}
      lastName={user?.last_name ?? 'Member'}
    >
      {children}
    </LockedSidebarClient>
  );
}
