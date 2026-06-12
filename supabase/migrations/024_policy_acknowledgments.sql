-- Migration 024: policy_acknowledgments
-- Tracks which users have acknowledged each policy document (files.is_policy = true).
-- If a policy document is updated, acknowledgments are reset via service role.

CREATE TABLE IF NOT EXISTS public.policy_acknowledgments (
  acknowledgment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES public.files(file_id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique: one acknowledgment per user per document
CREATE UNIQUE INDEX idx_policy_acknowledgments_user_file
  ON public.policy_acknowledgments(user_id, file_id);

CREATE INDEX idx_policy_acknowledgments_file_id
  ON public.policy_acknowledgments(file_id);

-- RLS
ALTER TABLE public.policy_acknowledgments ENABLE ROW LEVEL SECURITY;

-- User reads own acknowledgments
CREATE POLICY "policy_acknowledgments_select_own" ON public.policy_acknowledgments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Board reads all
CREATE POLICY "policy_acknowledgments_select_board" ON public.policy_acknowledgments
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');

-- User inserts own acknowledgments
CREATE POLICY "policy_acknowledgments_insert_own" ON public.policy_acknowledgments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- No UPDATE policy: acknowledgments are immutable

-- No DELETE policy from client: deletions (for reset on document update)
-- are performed by service role only