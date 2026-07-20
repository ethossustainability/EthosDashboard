import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { IntegrationType } from '@/types/system-logs';
import { SystemLogsPanel } from '@/components/board/SystemLogsPanel';

type UserName = {
  first_name: string;
  last_name: string;
};

type SystemLogRow = {
  log_id: string;
  integration: IntegrationType;
  error_type: string;
  error_message: string;
  affected_user_id: string | null;
  resolved: boolean;
  occurred_at: string;
  resolved_at: string | null;
  users: UserName | UserName[] | null;
};

function getAffectedUserName(value: UserName | UserName[] | null) {
  const user = Array.isArray(value) ? value[0] : value;
  return user ? `${user.first_name} ${user.last_name}` : null;
}

export default async function BoardLogsPage() {
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

  const [logsResult, unresolvedResult] = await Promise.all([
    supabase
      .from('system_logs')
      .select(`
        log_id,
        integration,
        error_type,
        error_message,
        affected_user_id,
        resolved,
        occurred_at,
        resolved_at,
        users(first_name, last_name)
      `)
      .order('occurred_at', { ascending: false }),
    supabase
      .from('system_logs')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false),
  ]);

  const logs = ((logsResult.data ?? []) as SystemLogRow[]).map((log) => ({
    log_id: log.log_id,
    integration: log.integration,
    error_type: log.error_type,
    error_message: log.error_message,
    affected_user_id: log.affected_user_id,
    affected_user_name: getAffectedUserName(log.users),
    resolved: log.resolved,
    occurred_at: log.occurred_at,
    resolved_at: log.resolved_at,
  }));

  return (
    <SystemLogsPanel
      logs={logs}
      initialUnresolvedCount={unresolvedResult.count ?? 0}
    />
  );
}
