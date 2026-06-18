/**
 * notification-preferences.ts
 * NotificationPreferences entity. Per-user, per-event toggles for email and Slack.
 * Entity: notification_preferences (#20).
 *
 * In-app notifications are always on — no column needed for them.
 * Email and Slack are the only toggleable channels.
 */

/**
 * Row in public.notification_preferences.
 * UNIQUE on user_id — one record per user.
 * Created with all values = true on the user's first application approval.
 *
 * Constraint enforced in API (PATCH /api/notification-preferences/me):
 *  - For each event type, email and Slack cannot both be false simultaneously.
 *    In-app provides the baseline and is always on regardless.
 *
 * If slack_user_id is null on the user record, Slack preferences are saved
 * but have no effect until the user connects Slack.
 *
 * Adding new event types requires a schema migration — accepted tradeoff.
 */
export interface NotificationPreferences {
  preference_id: string;
  /** FK → users. UNIQUE. */
  user_id: string;

  // ── Application events ──────────────────────────────────────────────────
  application_received_email: boolean;
  application_received_slack: boolean;
  application_approved_email: boolean;
  application_approved_slack: boolean;
  application_rejected_email: boolean;
  application_rejected_slack: boolean;

  // ── Task events ─────────────────────────────────────────────────────────
  task_assigned_email: boolean;
  task_assigned_slack: boolean;
  task_updated_email: boolean;
  task_updated_slack: boolean;

  // ── Badge events ────────────────────────────────────────────────────────
  badge_awarded_email: boolean;
  badge_awarded_slack: boolean;

  // ── Role events ─────────────────────────────────────────────────────────
  role_changed_email: boolean;
  role_changed_slack: boolean;

  // ── Announcement events ─────────────────────────────────────────────────
  announcement_email: boolean;
  announcement_slack: boolean;

  updated_at: string;
}
