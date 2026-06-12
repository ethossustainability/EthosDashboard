-- Migration 015: project_updates
-- Project Slack feed synced one-way into the app per project.

CREATE TABLE IF NOT EXISTS public.project_updates (
  update_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  slack_message_id VARCHAR(100) NOT NULL UNIQUE,
  posted_by_slack_user VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  posted_at TIMESTAMP NOT NULL,
  synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_project_updates_project_id ON public.project_updates(project_id);
CREATE INDEX idx_project_updates_posted_at ON public.project_updates(posted_at);

ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_updates_select_member_approved" ON public.project_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.project_id = project_updates.project_id
      AND a.user_id = auth.uid()
      AND a.status = 'Approved'
    )
  );

CREATE POLICY "project_updates_select_lead_own_projects" ON public.project_updates
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = project_updates.project_id
      AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "project_updates_select_board" ON public.project_updates
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');

CREATE POLICY "project_updates_update_board" ON public.project_updates
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

CREATE POLICY "project_updates_delete_board" ON public.project_updates
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');
