/**
 * system-logs.ts
 * SystemLog entity. Integration failure and error log.
 * Entity: system_logs (#23).
 *
 * Board only. Logs are never deleted (audit trail).
 */

// ── IntegrationType ─────────────────────────────────────────────────────────

/**
 * CHECK constraint enforced in 023_system_logs.sql.
 * Matches the five third-party integrations used by the app.
 */
export type IntegrationType =
  | 'Supabase'
  | 'OpenSign'
  | 'Slack'
  | 'Resend'
  | 'GoogleDrive';

// ── SystemLog ───────────────────────────────────────────────────────────────

/**
 * Row in public.system_logs.
 * Inserted via service role by API error handlers.
 * Visible only to Board in the Board Panel → System Logs section.
 *
 * Critical errors (auth, database) trigger an immediate Board notification.
 * Non-critical errors (file links, announcement sync) log silently.
 * Resolved logs remain in history and are never deleted.
 */
export interface SystemLog {
  log_id: string;
  integration: IntegrationType;
  /** Short error classification string. */
  error_type: string;
  /** Full error detail. */
  error_message: string;
  /**
   * FK → users.
   * The user affected by the error, if applicable. Null for system-level errors.
   */
  affected_user_id: string | null;
  /** False until Board marks resolved. */
  resolved: boolean;
  occurred_at: string;
  resolved_at: string | null;
}
