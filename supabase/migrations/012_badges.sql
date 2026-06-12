-- Migration 012: badges
-- Badge types. Created by Board only.

CREATE TABLE IF NOT EXISTS public.badges (
  badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_category VARCHAR(50) NOT NULL
    CHECK (badge_category IN ('Participation', 'Achievement')),
  project_id UUID REFERENCES public.projects(project_id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(300),
  created_by UUID NOT NULL REFERENCES public.users(user_id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_badges_badge_category ON public.badges(badge_category);
CREATE INDEX idx_badges_project_id ON public.badges(project_id)
  WHERE project_id IS NOT NULL;
CREATE INDEX idx_badges_created_by ON public.badges(created_by);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "badges_select_authenticated" ON public.badges
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "badges_insert_board" ON public.badges
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

CREATE POLICY "badges_update_board" ON public.badges
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

CREATE POLICY "badges_delete_board" ON public.badges
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');