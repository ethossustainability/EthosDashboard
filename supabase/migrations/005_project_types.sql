-- Migration 005: project_types
-- Lookup table for project type labels and HQ team categories.
-- No dependencies.

CREATE TABLE IF NOT EXISTS public.project_types (
  type_id INTEGER PRIMARY KEY,
  type_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT
);

-- Seed data: standard project types + HQ team categories
INSERT INTO public.project_types (type_id, type_name, description) VALUES
  (1, 'Event', 'One-time or recurring event'),
  (2, 'Campaign', 'Multi-week or multi-month campaign'),
  (3, 'Program', 'Ongoing program or initiative'),
  (10, 'Media', 'HQ team category: media and content'),
  (11, 'Newsletter', 'HQ team category: newsletter'),
  (12, 'Business', 'HQ team category: business development'),
  (13, 'STEM', 'HQ team category: STEM education'),
  (14, 'Funding', 'HQ team category: fundraising and grants'),
  (15, 'Finance', 'HQ team category: finance and operations'),
  (16, 'CS', 'HQ team category: computer science')
ON CONFLICT (type_id) DO NOTHING;

-- Indexes
CREATE INDEX idx_project_types_type_name ON public.project_types(type_name);

-- RLS
ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all project types (for filtering and dropdown UI)
CREATE POLICY "project_types_select_authenticated" ON public.project_types
  FOR SELECT
  TO authenticated
  USING (true);

-- Unauthenticated users can also read project types (for pre-login project board)
CREATE POLICY "project_types_select_anon" ON public.project_types
  FOR SELECT
  TO anon
  USING (true);

-- No INSERT/UPDATE/DELETE policies; project types are immutable (service role only).
