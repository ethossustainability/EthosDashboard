-- Migration 011: tasks
-- Tasks assigned to volunteers within a project.

CREATE TABLE IF NOT EXISTS public.tasks (
  task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(project_id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.users(user_id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.users(user_id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'Not Started'
    CHECK (status IN ('Not Started', 'In Progress', 'Awaiting Input', 'Complete')),
  due_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.tasks_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_set_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_set_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.tasks_set_updated_at();

-- Indexes
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to)
  WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_project_status ON public.tasks(project_id, status);
CREATE INDEX idx_tasks_assigned_status ON public.tasks(assigned_to, status)
  WHERE assigned_to IS NOT NULL;

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Approved members can read tasks on their project.
CREATE POLICY "tasks_select_approved_member" ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.project_id = tasks.project_id
      AND a.user_id = auth.uid()
      AND a.status = 'Approved'
    )
  );

-- Project Leads can read tasks on their own projects.
CREATE POLICY "tasks_select_lead_own_project" ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = tasks.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Board can read all tasks.
CREATE POLICY "tasks_select_board" ON public.tasks
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');

-- Project Leads can create tasks on their own projects; Board can create any.
CREATE POLICY "tasks_insert_lead_board" ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = tasks.project_id
      AND (
        (
          (auth.jwt() ->> 'org_role_id') = '2'
          AND p.created_by = auth.uid()
        )
        OR (auth.jwt() ->> 'org_role_id') = '3'
      )
    )
  );

-- Members can update their own assigned tasks.
-- Status-only restrictions and Awaiting Input rules are enforced in API.
CREATE POLICY "tasks_update_member_assigned" ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Project Leads can update tasks on their own projects; Board can update any.
CREATE POLICY "tasks_update_lead_board" ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = tasks.project_id
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
      WHERE p.project_id = tasks.project_id
      AND (
        (
          (auth.jwt() ->> 'org_role_id') = '2'
          AND p.created_by = auth.uid()
        )
        OR (auth.jwt() ->> 'org_role_id') = '3'
      )
    )
  );

-- Project Leads can delete tasks on their own projects; Board can delete any.
CREATE POLICY "tasks_delete_lead_board" ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.project_id = tasks.project_id
      AND (
        (
          (auth.jwt() ->> 'org_role_id') = '2'
          AND p.created_by = auth.uid()
        )
        OR (auth.jwt() ->> 'org_role_id') = '3'
      )
    )
  );
