-- Migration 013: user_badges
-- Record of a badge awarded to a specific user.

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(badge_id) ON DELETE CASCADE,
  awarded_by UUID NOT NULL REFERENCES public.users(user_id),
  awarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT
);

CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE UNIQUE INDEX idx_user_badges_user_id_badge_id ON public.user_badges(user_id, badge_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_badges_select_authenticated" ON public.user_badges
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "user_badges_insert_lead_participation" ON public.user_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.badges b
      INNER JOIN public.projects p ON p.project_id = b.project_id
      WHERE b.badge_id = user_badges.badge_id
      AND b.badge_category = 'Participation'
      AND p.created_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.applications a
        WHERE a.project_id = b.project_id
        AND a.user_id = user_badges.user_id
        AND a.status = 'Approved'
      )
    )
  );

CREATE POLICY "user_badges_insert_board" ON public.user_badges
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

CREATE POLICY "user_badges_update_board" ON public.user_badges
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

CREATE POLICY "user_badges_delete_board" ON public.user_badges
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');