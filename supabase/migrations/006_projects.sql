-- Migration 006: projects
-- All Ethos projects — events, campaigns, programs. One unified table.
-- Complex RLS for scoping by chapter and publication status.

CREATE TABLE IF NOT EXISTS public.projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(chapter_id),
  project_type_id INTEGER NOT NULL REFERENCES public.project_types(type_id),
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  is_virtual BOOLEAN NOT NULL DEFAULT false,
  location VARCHAR(200),
  created_by UUID NOT NULL REFERENCES public.users(user_id),
  requested_budget DECIMAL(10,2),
  allocated_budget DECIMAL(10,2),
  max_applications INTEGER NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_open_call BOOLEAN NOT NULL DEFAULT false,
  open_call_app_level VARCHAR(50),
  slack_channel_id VARCHAR(100),
  closed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.projects_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_set_updated_at ON public.projects;
CREATE TRIGGER trg_projects_set_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.projects_set_updated_at();

-- Indexes
CREATE INDEX idx_projects_chapter_id ON public.projects(chapter_id);
CREATE INDEX idx_projects_project_type_id ON public.projects(project_type_id);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);
CREATE INDEX idx_projects_is_published ON public.projects(is_published);
CREATE INDEX idx_projects_is_open_call ON public.projects(is_open_call);
CREATE INDEX idx_projects_closed_at ON public.projects(closed_at) WHERE closed_at IS NOT NULL;

-- Full-text search index
CREATE INDEX idx_projects_search ON public.projects USING GIN (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Anon can read published projects (API handles chapter/open_call filtering)
CREATE POLICY "projects_select_anon_published" ON public.projects
  FOR SELECT
  TO anon
  USING (is_published = true);

-- Authenticated can read own chapter's published projects + org-wide open calls
CREATE POLICY "projects_select_member_own_chapter" ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    (is_published = true AND chapter_id = (SELECT chapter_id FROM public.users WHERE user_id = auth.uid()))
    OR
    (is_published = true AND is_open_call = true)
  );

-- Project Leads can only read projects they created
CREATE POLICY "projects_select_lead_own" ON public.projects
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Board can read all projects
CREATE POLICY "projects_select_board" ON public.projects
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');

-- Project Leads and Board can insert
CREATE POLICY "projects_insert_lead_board" ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      (auth.jwt() ->> 'org_role_id') = '2'
      AND created_by = auth.uid()
      AND chapter_id = (auth.jwt() ->> 'chapter_id')::uuid
    )
    OR (auth.jwt() ->> 'org_role_id') = '3'
  );

-- Project Leads can update own projects; Board can update any
CREATE POLICY "projects_update_lead_own" ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'org_role_id') = '2'
    AND created_by = auth.uid()
  )
  WITH CHECK (
    (auth.jwt() ->> 'org_role_id') = '2'
    AND created_by = auth.uid()
  );

CREATE POLICY "projects_update_board" ON public.projects
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- Board only can delete
CREATE POLICY "projects_delete_board" ON public.projects
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');
