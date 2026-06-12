-- Migration 009: applications
-- A volunteer's application to join a project.
-- Limit enforcement (3 pending, 3 active, HQ rules) lives in API routes, not RLS.
-- Withdrawal is server-side via service role — members have no UPDATE policy.

CREATE TABLE IF NOT EXISTS public.applications (
  application_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Withdrawn')),
  project_role_id UUID REFERENCES public.project_roles(project_role_id) ON DELETE SET NULL,
  why_join TEXT NOT NULL,
  experience TEXT,
  availability_notes TEXT,
  reviewed_by UUID REFERENCES public.users(user_id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.applications_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_applications_set_updated_at ON public.applications;
CREATE TRIGGER trg_applications_set_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.applications_set_updated_at();

-- Indexes
CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_project_id ON public.applications(project_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE UNIQUE INDEX idx_applications_user_id_project_id ON public.applications(user_id, project_id);
CREATE INDEX idx_applications_user_id_status ON public.applications(user_id, status);

-- RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Applicant reads own applications
CREATE POLICY "applications_select_own" ON public.applications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Project Lead reads applications to own projects
CREATE POLICY "applications_select_lead_own_projects" ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = applications.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Board reads all applications
CREATE POLICY "applications_select_board" ON public.applications
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');

-- Any authenticated user may apply (limits enforced in API)
CREATE POLICY "applications_insert_authenticated" ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Project Lead updates applications on own projects
CREATE POLICY "applications_update_lead_own_projects" ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = applications.project_id
      AND p.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = applications.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Board updates any application
CREATE POLICY "applications_update_board" ON public.applications
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- No DELETE policy — applications are archived, not deleted.