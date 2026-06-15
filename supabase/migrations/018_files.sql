-- Migration 018: files
-- References to files in Ethos Google Drive. Metadata and links only.
-- is_policy = true files appear in Training tab policy documents section.
-- CHECK constraints for category/project_id consistency applied in 027_constraints.sql.

CREATE TABLE IF NOT EXISTS public.files (
  file_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(project_id) ON DELETE CASCADE,
  drive_file_id VARCHAR(200) NOT NULL,
  drive_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(200) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL
    CHECK (category IN ('Project', 'Universal')),
  description TEXT,
  is_policy BOOLEAN NOT NULL DEFAULT false,
  added_by UUID NOT NULL REFERENCES public.users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_files_project_id ON public.files(project_id)
  WHERE project_id IS NOT NULL;
CREATE INDEX idx_files_category ON public.files(category);
CREATE INDEX idx_files_is_policy ON public.files(is_policy)
  WHERE is_policy = true;
CREATE INDEX idx_files_added_by ON public.files(added_by);
CREATE INDEX idx_files_search ON public.files
  USING GIN (to_tsvector('english',
    coalesce(file_name, '') || ' ' || coalesce(description, '')));

-- RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all files (no per-member filtering)
CREATE POLICY "files_select_authenticated" ON public.files
  FOR SELECT TO authenticated USING (true);

-- Project Leads can add project files to their own projects
-- Board can add any file including Universal
CREATE POLICY "files_insert_lead_own_project" ON public.files
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      category = 'Project'
      AND (auth.jwt() ->> 'org_role_id') = '2'
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.project_id = files.project_id
        AND p.created_by = auth.uid()
      )
    )
    OR (auth.jwt() ->> 'org_role_id') = '3'
  );

-- Project Leads can remove files from own projects; Board can remove any
CREATE POLICY "files_delete_lead_own_project" ON public.files
  FOR DELETE TO authenticated
  USING (
    (
      category = 'Project'
      AND (auth.jwt() ->> 'org_role_id') = '2'
      AND EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.project_id = files.project_id
        AND p.created_by = auth.uid()
      )
    )
    OR (auth.jwt() ->> 'org_role_id') = '3'
  );

-- Project Leads can update project files on their own projects
CREATE POLICY "files_update_lead_own_project" ON public.files
  FOR UPDATE TO authenticated
  USING (
    category = 'Project'
    AND (auth.jwt() ->> 'org_role_id') = '2'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = files.project_id
      AND p.created_by = auth.uid()
    )
  )
  WITH CHECK (
    category = 'Project'
    AND (auth.jwt() ->> 'org_role_id') = '2'
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = files.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Board only can update
CREATE POLICY "files_update_board" ON public.files
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');
