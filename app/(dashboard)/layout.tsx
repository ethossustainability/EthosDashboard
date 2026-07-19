import type * as React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { FullSidebarClient } from '@/components/layout/FullSidebarClient';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

type CurrentUser = {
  first_name: string;
  last_name: string;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('user_id', session.user.id)
    .single();

  const user = data as CurrentUser | null;

  return (
    <FullSidebarClient
      firstName={user?.first_name ?? 'Ethos'}
      lastName={user?.last_name ?? 'Member'}
    >
      {children}
    </FullSidebarClient>
  );
}
