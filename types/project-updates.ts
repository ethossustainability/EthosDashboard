/**
 * project-updates.ts
 * ProjectUpdate entity. Per-project Slack channel feed, synced one-way.
 * Entity: project_updates (#15).
 */

/**
 * Row in public.project_updates.
 * Synced one-way from each project's dedicated Slack channel via webhook.
 * Slack channel is auto-created when a project is published and its ID is
 * stored in projects.slack_channel_id.
 *
 * slack_message_id prevents duplicate inserts (deduplication).
 * Members are added to the channel on approval, removed on withdrawal.
 */
export interface ProjectUpdate {
  update_id: string;
  /** FK → projects ON DELETE CASCADE. */
  project_id: string;
  /** Slack message ID used for deduplication. UNIQUE. */
  slack_message_id: string;
  /** Slack display name of the poster. */
  posted_by_slack_user: string;
  content: string;
  /** When the message was posted in Slack. */
  posted_at: string;
  /** When this record was pulled into the app. */
  synced_at: string;
}
