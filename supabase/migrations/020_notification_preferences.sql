-- Migration 020: notification_preferences
-- Per-user, per-event toggles for email and Slack delivery.
-- In-app notifications are always on — no column needed.
-- One record per user, created on first application approval via service role.

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  preference_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
  application_received_email BOOLEAN NOT NULL DEFAULT true,
  application_received_slack BOOLEAN NOT NULL DEFAULT true,
  application_approved_email BOOLEAN NOT NULL DEFAULT true,
  application_approved_slack BOOLEAN NOT NULL DEFAULT true,
  application_rejected_email BOOLEAN NOT NULL DEFAULT true,
  application_rejected_slack BOOLEAN NOT NULL DEFAULT true,
  task_assigned_email BOOLEAN NOT NULL DEFAULT true,
  task_assigned_slack BOOLEAN NOT NULL DEFAULT true,
  task_updated_email BOOLEAN NOT NULL DEFAULT true,
  task_updated_slack BOOLEAN NOT NULL DEFAULT true,
  badge_awarded_email BOOLEAN NOT NULL DEFAULT true,
  badge_awarded_slack BOOLEAN NOT NULL DEFAULT true,
  role_changed_email BOOLEAN NOT NULL DEFAULT true,
  role_changed_slack BOOLEAN NOT NULL DEFAULT true,
  announcement_email BOOLEAN NOT NULL DEFAULT true,
  announcement_slack BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.notification_preferences_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notification_preferences_set_updated_at
  ON public.notification_preferences;
CREATE TRIGGER trg_notification_preferences_set_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.notification_preferences_set_updated_at();

-- RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- User reads own preferences
CREATE POLICY "notification_preferences_select_own" ON public.notification_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Board reads all
CREATE POLICY "notification_preferences_select_board" ON public.notification_preferences
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');

-- No INSERT policy: created by service role on first approval

-- User updates own preferences
CREATE POLICY "notification_preferences_update_own" ON public.notification_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Board updates any
CREATE POLICY "notification_preferences_update_board" ON public.notification_preferences
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- NOTE: The constraint that email and Slack cannot both be false for any event type
-- is enforced in the API (PATCH /api/notification-preferences/me), not in the schema.
-- Adding per-row CHECK constraints for all 9 event pairs would be verbose and fragile.