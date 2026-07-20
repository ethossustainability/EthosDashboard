'use client';

import { useMemo, useState } from 'react';
import type { IntegrationType } from '@/types/system-logs';
import { Chip } from '@/components/ui/Chip';
import { Select } from '@/components/ui/Select';
import { SystemLogCard } from '@/components/board/SystemLogCard';

type LogFilter = 'All' | 'Unresolved' | 'Resolved';

export type BoardSystemLog = {
  log_id: string;
  integration: IntegrationType;
  error_type: string;
  error_message: string;
  affected_user_id: string | null;
  affected_user_name: string | null;
  resolved: boolean;
  occurred_at: string;
  resolved_at: string | null;
};

type SystemLogsPanelProps = {
  logs: BoardSystemLog[];
  initialUnresolvedCount: number;
};

const filters: LogFilter[] = ['All', 'Unresolved', 'Resolved'];

function matchesFilters(log: BoardSystemLog, filter: LogFilter, integrationFilter: string) {
  const statusMatches =
    filter === 'All' ||
    (filter === 'Unresolved' && !log.resolved) ||
    (filter === 'Resolved' && log.resolved);

  const integrationMatches = !integrationFilter || log.integration === integrationFilter;

  return statusMatches && integrationMatches;
}

export function SystemLogsPanel({ logs, initialUnresolvedCount }: SystemLogsPanelProps) {
  const [localLogs, setLocalLogs] = useState(logs);
  const [unresolvedCount, setUnresolvedCount] = useState(initialUnresolvedCount);
  const [filter, setFilter] = useState<LogFilter>('All');
  const [integrationFilter, setIntegrationFilter] = useState('');

  const filteredLogs = useMemo(
    () => localLogs.filter((log) => matchesFilters(log, filter, integrationFilter)),
    [localLogs, filter, integrationFilter],
  );

  function handleResolve(logId: string) {
    setLocalLogs((current) =>
      current.map((log) =>
        log.log_id === logId
          ? { ...log, resolved: true, resolved_at: new Date().toISOString() }
          : log,
      ),
    );
    setUnresolvedCount((current) => Math.max(0, current - 1));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-sand bg-cream p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-2xl font-bold text-espresso">{unresolvedCount}</p>
            <p className="text-sm text-warm-gray">unresolved logs</p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  active={filter === item}
                  onClick={() => setFilter(item)}
                />
              ))}
            </div>

            <Select
              value={integrationFilter}
              onChange={setIntegrationFilter}
              name="integration-filter"
              options={[
                { value: '', label: 'All Integrations' },
                { value: 'Supabase', label: 'Supabase' },
                { value: 'OpenSign', label: 'OpenSign' },
                { value: 'Slack', label: 'Slack' },
                { value: 'Resend', label: 'Resend' },
                { value: 'GoogleDrive', label: 'GoogleDrive' },
              ]}
            />
          </div>
        </div>
      </div>

      <section className="grid gap-4">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <SystemLogCard key={log.log_id} log={log} onResolve={handleResolve} />
          ))
        ) : (
          <p className="rounded-xl border border-sand bg-cream px-5 py-12 text-center text-sm text-warm-gray">
            No logs found for this filter
          </p>
        )}
      </section>
    </div>
  );
}
