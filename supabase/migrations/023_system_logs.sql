-- Migration 023: system_logs
-- Integration failure and error log. Board only. Never deleted.

CREATE TABLE IF NOT EXISTS public.system_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration VARCHAR(50) NOT NULL
    CHECK (integration IN ('Supabase', 'OpenSign', 'Slack', 'Resend', 'GoogleDrive')),
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  affected_user_id UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_system_logs_resolved ON public.system_logs(resolved)
  WHERE resolved = false;
CREATE INDEX idx_system_logs_occurred_at ON public.system_logs(occurred_at DESC);
CREATE INDEX idx_system_logs_integration ON public.system_logs(integration);
CREATE INDEX idx_system_logs_affected_user ON public.system_logs(affected_user_id)
  WHERE affected_user_id IS NOT NULL;

-- RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Board only can read
CREATE POLICY "system_logs_select_board" ON public.system_logs
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');

-- No INSERT policy: inserted by service role only (error handlers)

-- Board marks logs as resolved
CREATE POLICY "system_logs_update_board" ON public.system_logs
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- No DELETE policy: logs are never deleted