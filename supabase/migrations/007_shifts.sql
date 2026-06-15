-- Migration 007: shifts
-- Individual time slots within a project. One project can have many shifts.

CREATE TABLE IF NOT EXISTS public.shifts (
  shift_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  location VARCHAR(200),
  capacity INTEGER NOT NULL,
  notes TEXT
);

-- Indexes
CREATE INDEX idx_shifts_project_id ON public.shifts(project_id);
CREATE INDEX idx_shifts_start_datetime ON public.shifts(start_datetime);
CREATE INDEX idx_shifts_end_datetime ON public.shifts(end_datetime);

-- RLS
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Anon can read shifts of published projects
CREATE POLICY "shifts_select_anon" ON public.shifts
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = shifts.project_id
      AND p.is_published = true
    )
  );

-- Authenticated can read shifts of projects they can see
CREATE POLICY "shifts_select_authenticated" ON public.shifts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = shifts.project_id
      AND (
        p.is_published = true
        OR p.created_by = auth.uid()
        OR (auth.jwt() ->> 'org_role_id') = '3'
      )
    )
  );

-- Project Leads and Board can insert
CREATE POLICY "shifts_insert_lead_board" ON public.shifts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = shifts.project_id
      AND (
        (
          (auth.jwt() ->> 'org_role_id') = '2'
          AND p.created_by = auth.uid()
        )
        OR (auth.jwt() ->> 'org_role_id') = '3'
      )
    )
  );

-- Project Leads and Board can update
CREATE POLICY "shifts_update_lead_board" ON public.shifts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = shifts.project_id
      AND (
        (
          (auth.jwt() ->> 'org_role_id') = '2'
          AND p.created_by = auth.uid()
        )
        OR (auth.jwt() ->> 'org_role_id') = '3'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = shifts.project_id
      AND (
        (
          (auth.jwt() ->> 'org_role_id') = '2'
          AND p.created_by = auth.uid()
        )
        OR (auth.jwt() ->> 'org_role_id') = '3'
      )
    )
  );

-- Project Leads and Board can delete
CREATE POLICY "shifts_delete_lead_board" ON public.shifts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = shifts.project_id
      AND (
        (
          (auth.jwt() ->> 'org_role_id') = '2'
          AND p.created_by = auth.uid()
        )
        OR (auth.jwt() ->> 'org_role_id') = '3'
      )
    )
  );
