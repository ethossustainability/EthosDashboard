-- Migration 025: volunteer_flags
-- Flags raised by Project Leads when a volunteer misses a shift.
-- Visible to flagging Lead and Board only. Never deleted.

CREATE TABLE IF NOT EXISTS public.volunteer_flags (
  flag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id),
  project_id UUID NOT NULL REFERENCES public.projects(project_id),
  shift_id UUID REFERENCES public.shifts(shift_id) ON DELETE SET NULL,
  flagged_by UUID NOT NULL REFERENCES public.users(user_id),
  reason TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES public.users(user_id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_volunteer_flags_user_id ON public.volunteer_flags(user_id);
CREATE INDEX idx_volunteer_flags_project_id ON public.volunteer_flags(project_id);
CREATE INDEX idx_volunteer_flags_flagged_by ON public.volunteer_flags(flagged_by);
CREATE INDEX idx_volunteer_flags_resolved ON public.volunteer_flags(resolved)
  WHERE resolved = false;

-- RLS
ALTER TABLE public.volunteer_flags ENABLE ROW LEVEL SECURITY;

-- Flagging Lead can read own flags
CREATE POLICY "volunteer_flags_select_lead_own" ON public.volunteer_flags
  FOR SELECT TO authenticated
  USING (flagged_by = auth.uid());

-- Board reads all flags
CREATE POLICY "volunteer_flags_select_board" ON public.volunteer_flags
  FOR SELECT TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');

-- Project Leads can insert flags for volunteers on own projects
CREATE POLICY "volunteer_flags_insert_lead" ON public.volunteer_flags
  FOR INSERT TO authenticated
  WITH CHECK (
    flagged_by = auth.uid()
    AND (auth.jwt() ->> 'org_role_id') = '2'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = volunteer_flags.project_id
      AND p.created_by = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.project_id = volunteer_flags.project_id
      AND a.user_id = volunteer_flags.user_id
      AND a.status = 'Approved'
    )
  );

-- Board marks flags as resolved
CREATE POLICY "volunteer_flags_update_board" ON public.volunteer_flags
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- No DELETE policy: flags are never deleted
