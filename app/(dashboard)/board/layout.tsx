import type * as React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { BoardSectionNav } from '@/components/board/BoardSectionNav';

type BoardLayoutProps = {
  children: React.ReactNode;
};

function decodeRoleId(accessToken: string) {
  const payload = accessToken.split('.')[1];
  if (!payload) return 1;

  const parsed = JSON.parse(atob(payload)) as unknown;
  if (!parsed || typeof parsed !== 'object' || !('org_role_id' in parsed)) return 1;

  return Number(parsed.org_role_id);
}

export default async function BoardLayout({ children }: BoardLayoutProps) {
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

  if (orgRoleId !== 3) {
    redirect('/home');
  }

  const { count } = await supabase
    .from('system_logs')
    .select('*', { count: 'exact', head: true })
    .eq('resolved', false);

  return (
    <div className="mx-auto w-full max-w-6xl px-8 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-espresso">Board Panel</h1>
        <div className="mt-5">
          <BoardSectionNav unresolvedLogCount={count ?? 0} />
        </div>
      </header>

      {children}
    </div>
  );
}
