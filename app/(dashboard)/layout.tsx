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

type OrgRoleId = 1 | 2 | 3;

function decodeRoleId(accessToken: string): OrgRoleId {
  const payload = accessToken.split('.')[1];
  if (!payload) return 1;

  const parsed = JSON.parse(atob(payload)) as unknown;
  if (!parsed || typeof parsed !== 'object' || !('org_role_id' in parsed)) return 1;

  const roleId = Number(parsed.org_role_id);
  return roleId === 2 || roleId === 3 ? roleId : 1;
}

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

  const orgRoleId = decodeRoleId(session.access_token);

  const [{ data }, unresolvedLogResult] = await Promise.all([
    supabase
      .from('users')
      .select('first_name, last_name')
      .eq('user_id', session.user.id)
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
