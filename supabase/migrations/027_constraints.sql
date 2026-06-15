-- Migration 027: constraints
-- Adds UNIQUE and CHECK constraints that require all tables to exist first.
-- Also removes the directory_profiles.is_visible column if it exists.
-- Run this LAST — after all 26 table migrations.

-- ── UNIQUE constraints ──

-- users: one personal email per person
ALTER TABLE public.users
  ADD CONSTRAINT users_personal_email_unique UNIQUE (personal_email);

-- users: one Ethos email per person
ALTER TABLE public.users
  ADD CONSTRAINT users_ethos_email_unique UNIQUE (ethos_email);

-- users: one Slack account per person
ALTER TABLE public.users
  ADD CONSTRAINT users_slack_user_id_unique UNIQUE (slack_user_id);

-- user_auth: one user per Google account globally
ALTER TABLE public.user_auth
  ADD CONSTRAINT user_auth_google_account_email_unique UNIQUE (google_account_email);

-- ── CHECK constraints ──

-- projects: location required when not virtual
ALTER TABLE public.projects
  ADD CONSTRAINT projects_location_required_when_not_virtual
  CHECK (
    (is_virtual = true AND location IS NULL)
    OR
    (is_virtual = false AND location IS NOT NULL)
  );

-- projects: open_call_app_level required when is_open_call = true
ALTER TABLE public.projects
  ADD CONSTRAINT projects_open_call_app_level_consistency
  CHECK (
    (is_open_call = false AND open_call_app_level IS NULL)
    OR
    (is_open_call = true AND open_call_app_level IS NOT NULL)
  );

-- projects: open_call_app_level allowed values
ALTER TABLE public.projects
  ADD CONSTRAINT projects_open_call_app_level_values
  CHECK (
    open_call_app_level IS NULL
    OR open_call_app_level IN ('Full App', 'Mid App', 'No App')
  );

-- badges: Achievement badges must have project_id = null
ALTER TABLE public.badges
  ADD CONSTRAINT badges_achievement_no_project
  CHECK (
    (badge_category = 'Achievement' AND project_id IS NULL)
    OR
    badge_category = 'Participation'
  );

-- files: Universal files must have project_id = null; Project files must have project_id
ALTER TABLE public.files
  ADD CONSTRAINT files_category_project_id_consistency
  CHECK (
    (category = 'Universal' AND project_id IS NULL)
    OR
    (category = 'Project' AND project_id IS NOT NULL)
  );

-- chapters: only one HQ chapter
CREATE UNIQUE INDEX idx_chapters_one_hq
  ON public.chapters(is_hq)
  WHERE is_hq = true;

-- ── Column removal ──

-- Remove is_visible from directory_profiles if it exists
-- Profiles are always visible — this column should not exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'directory_profiles'
    AND column_name = 'is_visible'
  ) THEN
    ALTER TABLE public.directory_profiles DROP COLUMN is_visible;
  END IF;
END;
$$;

-- ── Full-text search indexes for global search ──
-- Applied here to ensure all tables exist before indexing

-- projects: already indexed in 006_projects.sql (name + description)
-- files: already indexed in 018_files.sql (file_name + description)
-- users: already indexed in 003_users.sql (first_name + last_name)

-- tasks: full-text search on title
CREATE INDEX IF NOT EXISTS idx_tasks_search ON public.tasks
  USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- announcements: full-text search on content
CREATE INDEX IF NOT EXISTS idx_announcements_search ON public.announcements
  USING GIN (to_tsvector('english', coalesce(content, '')));
