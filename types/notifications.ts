/**
 * notifications.ts
 * Notification entity. Audit log and in-app notification inbox combined.
 * Entity: notifications (#19).
 *
 * There is NO separate notifications_inbox table.
 * is_read and read_at drive the bell icon and unread count.
 * Notifications are never deleted (audit trail).
 */

// ── NotificationChannel ─────────────────────────────────────────────────────

/** CHECK constraint enforced in 019_notifications.sql. */
export type NotificationChannel = 'Email' | 'Slack' | 'Both' | 'InApp';

// ── NotificationEventType ───────────────────────────────────────────────────

/**
 * CHECK constraint enforced in 019_notifications.sql.
 * Exactly 11 values — must match the SQL CHECK exactly.
 * Adding new event types requires a schema migration (accepted tradeoff).
 */
export type NotificationEventType =
  | 'Application Received'
  | 'Application Approved'
  | 'Application Rejected'
  | 'Task Assigned'
  | 'Task Updated'
  | 'Onboarding Step'
  | 'Badge Awarded'
  | 'Role Changed'
  | 'Announcement'
  | 'Parental Consent Reminder'
  | 'General';

// ── NotificationStatus ──────────────────────────────────────────────────────

/** CHECK constraint enforced in 019_notifications.sql. */
export type NotificationStatus = 'Sent' | 'Failed' | 'Bounced';

// ── Notification ────────────────────────────────────────────────────────────

/**
 * Row in public.notifications.
 * Every notification sent is logged here and also surfaces in the in-app inbox.
 *
 * Delivery rules:
 *  - In-app is always on; cannot be disabled
 *  - Email and Slack are toggleable per event type (not both can be false)
 *  - Slack falls back to email if user's slack_user_id is null
 *  - Failed notifications retry up to 3 times; after 3 failures Board is alerted
 */
export interface Notification {
  notification_id: string;
  /** FK → users. The recipient. */
  user_id: string;
  /** Email address at send time. Null for Slack-only or InApp-only. */
  sent_to_email: string | null;
  /** Slack user ID at send time. Null for email-only or InApp-only. */
  sent_to_slack_user_id: string | null;
  channel: NotificationChannel;
  event_type: NotificationEventType;
  /** Email subject line. Null for Slack/InApp-only notifications. */
  subject: string | null;
  body: string;
  /** False until the user opens the notification in the in-app inbox. */
  is_read: boolean;
  /** Timestamp when marked read. Null until read. */
  read_at: string | null;
  sent_at: string;
  status: NotificationStatus;
}
