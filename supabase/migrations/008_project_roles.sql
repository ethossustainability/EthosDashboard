-- Migration 008: project_roles
-- Roles defined by a Project Lead when creating a project.

CREATE TABLE IF NOT EXISTS public.project_roles (
  project_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  role_name VARCHAR(100) NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_project_roles_project_id ON public.project_roles(project_id);

-- RLS
ALTER TABLE public.project_roles ENABLE ROW LEVEL SECURITY;

-- Anon can read roles of published projects
CREATE POLICY "project_roles_select_anon" ON public.project_roles
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = project_roles.project_id
      AND p.is_published = true
    )
  );

-- Authenticated can read roles of projects they can see
CREATE POLICY "project_roles_select_authenticated" ON public.project_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = project_roles.project_id
      AND (
        p.is_published = true
        OR p.created_by = auth.uid()
        OR (auth.jwt() ->> 'org_role_id') = '3'
      )
    )
  );

-- Project Leads and Board can insert
CREATE POLICY "project_roles_insert_lead_board" ON public.project_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = project_roles.project_id
      AND (
        p.created_by = auth.uid()
        OR (auth.jwt() ->> 'org_role_id') = '3'
      )
    )
  );

-- Project Leads and Board can update
CREATE POLICY "project_roles_update_lead_board" ON public.project_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = project_roles.project_id
      AND (
        p.created_by = auth.uid()
        OR (auth.jwt() ->> 'org_role_id') = '3'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = project_roles.project_id
      AND (
        p.created_by = auth.uid()
        OR (auth.jwt() ->> 'org_role_id') = '3'
      )
    )
  );

-- Project Leads and Board can delete
CREATE POLICY "project_roles_delete_lead_board" ON public.project_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = project_roles.project_id
      AND (
        p.created_by = auth.uid()
        OR (auth.jwt() ->> 'org_role_id') = '3'
      )
    )
  );
