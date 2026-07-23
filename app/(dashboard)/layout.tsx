import type * as React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { FullSidebarClient } from '@/components/layout/FullSidebarClient';
import { decodeRoleId } from '@/lib/decode-role';

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
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (!authUser || error) {
    redirect('/login');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token ?? '';

  const decodedRoleId = decodeRoleId(accessToken);
  const orgRoleId = decodedRoleId === 2 || decodedRoleId === 3 ? decodedRoleId : 1;

  const [{ data }, unresolvedLogResult] = await Promise.all([
    supabase
      .from('users')
      .select('first_name, last_name')
      .eq('user_id', authUser.id)
      .single(),
    orgRoleId === 3
      ? supabase
          .from('system_logs')
          .select('*', { count: 'exact', head: true })
          .eq('resolved', false)
      : Promise.resolve({ count: 0 }),
  ]);

  const user = data as CurrentUser | null;
  const unresolvedLogCount = unresolvedLogResult.count ?? 0;

  return (
    <FullSidebarClient
      firstName={user?.first_name ?? 'Ethos'}
      lastName={user?.last_name ?? 'Member'}
      orgRoleId={orgRoleId}
      unresolvedLogCount={unresolvedLogCount}
    >
      {children}
    </FullSidebarClient>
  );
}
