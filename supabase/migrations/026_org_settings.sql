-- Migration 026: org_settings
-- Key-value config table for org-wide settings. Managed by Board.
-- Initial key: fundraising_goal_[year]

CREATE TABLE IF NOT EXISTS public.org_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_by UUID NOT NULL REFERENCES public.users(user_id),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.org_settings_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_org_settings_set_updated_at ON public.org_settings;
CREATE TRIGGER trg_org_settings_set_updated_at
  BEFORE UPDATE ON public.org_settings
  FOR EACH ROW EXECUTE FUNCTION public.org_settings_set_updated_at();

-- RLS
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read (fundraising goal is public)
CREATE POLICY "org_settings_select_authenticated" ON public.org_settings
  FOR SELECT TO authenticated USING (true);

-- Board only can insert
CREATE POLICY "org_settings_insert_board" ON public.org_settings
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- Board only can update
CREATE POLICY "org_settings_update_board" ON public.org_settings
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- No DELETE policy: settings are never deleted