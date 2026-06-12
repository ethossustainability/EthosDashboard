-- Migration 010: onboarding
-- One-time Ethos onboarding record per user. Not repeated for subsequent projects.
-- Created via service role on first application submission.
-- Waiver/consent status updates are webhook-driven via service role API routes.

CREATE TABLE IF NOT EXISTS public.onboarding (
  onboarding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
  slack_connected BOOLEAN NOT NULL DEFAULT false,
  slack_connected_at TIMESTAMP,
  orientation_started_at TIMESTAMP,
  orientation_completed_at TIMESTAMP,
  orientation_progress TEXT,
  waiver_status VARCHAR(50) NOT NULL DEFAULT 'Not Started'
    CHECK (waiver_status IN ('Not Started', 'Sent', 'Signed')),
  waiver_doc_id VARCHAR(200),
  waiver_signed_at TIMESTAMP,
  parental_consent_status VARCHAR(50) NOT NULL DEFAULT 'Not Started'
    CHECK (parental_consent_status IN ('Not Started', 'Sent', 'Signed')),
  parental_consent_doc_id VARCHAR(200),
  parental_consent_signed_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_onboarding_slack_connected ON public.onboarding(slack_connected)
  WHERE slack_connected = true;
CREATE INDEX idx_onboarding_completed_at ON public.onboarding(completed_at)
  WHERE completed_at IS NOT NULL;

-- RLS
ALTER TABLE public.onboarding ENABLE ROW LEVEL SECURITY;

-- User reads own onboarding record
CREATE POLICY "onboarding_select_own" ON public.onboarding
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Board reads all onboarding records
CREATE POLICY "onboarding_select_board" ON public.onboarding
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');

-- No INSERT policy — record created via service role on first application submission.

-- User updates own record (slack connection, orientation progress — field scope enforced in API)
CREATE POLICY "onboarding_update_own" ON public.onboarding
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Board updates any onboarding record
CREATE POLICY "onboarding_update_board" ON public.onboarding
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- No DELETE policy — onboarding records are permanent.
