/**
 * announcements.ts
 * Announcement entity. Org-wide announcements synced one-way from Slack #announcements.
 * Entity: announcements (#14).
 */

/**
 * Row in public.announcements.
 * Synced one-way from Slack #announcements channel via webhook.
 * slack_message_id prevents duplicate inserts if the webhook fires multiple times.
 * Only Board and Project Leads can post in #announcements (Slack channel permissions).
 * App never writes back to Slack.
 */
export interface Announcement {
  announcement_id: string;
  /** Slack message ID used for deduplication. UNIQUE. */
  slack_message_id: string;
  /** The Slack channel this came from (the #announcements channel ID). */
  slack_channel_id: string;
  /** Slack display name of the poster. */
  posted_by_slack_user: string;
  content: string;
  /** When the message was posted in Slack. */
  posted_at: string;
  /** When this record was pulled into the app. */
  synced_at: string;
}
