-- Migration 014: announcements
-- Org-wide announcements synced one-way from Slack #announcements channel.

CREATE TABLE IF NOT EXISTS public.announcements (
  announcement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slack_message_id VARCHAR(100) NOT NULL UNIQUE,
  slack_channel_id VARCHAR(100) NOT NULL,
  posted_by_slack_user VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  posted_at TIMESTAMP NOT NULL,
  synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_posted_at ON public.announcements(posted_at);
CREATE INDEX idx_announcements_slack_channel_id ON public.announcements(slack_channel_id);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "announcements_select_authenticated" ON public.announcements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "announcements_update_board" ON public.announcements
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

CREATE POLICY "announcements_delete_board" ON public.announcements
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');