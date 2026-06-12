-- Migration 019: notifications
-- Log of every notification sent. Also serves as the in-app inbox.
-- is_read and read_at drive the bell icon and unread count.
-- No separate notifications_inbox table exists.

CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  sent_to_email VARCHAR(150),
  sent_to_slack_user_id VARCHAR(100),
  channel VARCHAR(50) NOT NULL
    CHECK (channel IN ('Email', 'Slack', 'Both', 'InApp')),
  event_type VARCHAR(100) NOT NULL
    CHECK (event_type IN (
      'Application Received', 'Approved', 'Rejected',
      'Task Assigned', 'Task Updated', 'Onboarding Step',
      'Badge Awarded', 'Role Changed', 'Announcement', 'General'
    )),
  subject VARCHAR(200),
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'Sent'
    CHECK (status IN ('Sent', 'Failed', 'Bounced'))
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read)
  WHERE is_read = false;
CREATE INDEX idx_notifications_sent_at ON public.notifications(sent_at DESC);
CREATE INDEX idx_notifications_event_type ON public.notifications(event_type);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- User reads own notifications only
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Board reads all notifications
CREATE POLICY "notifications_select_board" ON public.notifications
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');

-- No INSERT policy: notifications created by service role only
-- User can mark own notifications as read
CREATE POLICY "notifications_update_own_read" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No DELETE policy: notifications are never deleted (audit trail)