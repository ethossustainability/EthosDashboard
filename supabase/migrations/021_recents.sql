-- Migration 021: recents
-- Recently visited pages per user. Covers project and file pages.
-- reference_id has NO foreign key constraint — cannot FK to two different tables.
-- Cascade deletion handled via trigger (see below) or API-level cleanup.
-- Max 20 rows per user enforced via trigger. UI shows 10 most recent.

CREATE TABLE IF NOT EXISTS public.recents (
  recent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  page_type VARCHAR(50) NOT NULL
    CHECK (page_type IN ('Project', 'File')),
  reference_id UUID NOT NULL,
  visited_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint: one row per user per page
CREATE UNIQUE INDEX idx_recents_user_reference
  ON public.recents(user_id, reference_id);

-- Index for fetching user recents sorted by most recent
CREATE INDEX idx_recents_user_visited
  ON public.recents(user_id, visited_at DESC);

-- Trigger to enforce 20-row max per user
-- Deletes oldest rows beyond 20 after each insert
CREATE OR REPLACE FUNCTION public.recents_enforce_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.recents
  WHERE recent_id IN (
    SELECT recent_id FROM public.recents
    WHERE user_id = NEW.user_id
    ORDER BY visited_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recents_enforce_limit ON public.recents;
CREATE TRIGGER trg_recents_enforce_limit
  AFTER INSERT ON public.recents
  FOR EACH ROW EXECUTE FUNCTION public.recents_enforce_limit();

-- Trigger to cascade delete recents when a project is deleted
CREATE OR REPLACE FUNCTION public.recents_cleanup_project()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.recents
  WHERE page_type = 'Project' AND reference_id = OLD.project_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_recents_cleanup_project ON public.projects;
CREATE TRIGGER trg_recents_cleanup_project
  AFTER DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.recents_cleanup_project();

-- Trigger to cascade delete recents when a file is deleted
CREATE OR REPLACE FUNCTION public.recents_cleanup_file()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.recents
  WHERE page_type = 'File' AND reference_id = OLD.file_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_recents_cleanup_file ON public.files;
CREATE TRIGGER trg_recents_cleanup_file
  AFTER DELETE ON public.files
  FOR EACH ROW EXECUTE FUNCTION public.recents_cleanup_file();

-- RLS
ALTER TABLE public.recents ENABLE ROW LEVEL SECURITY;

-- User reads own recents only
CREATE POLICY "recents_select_own" ON public.recents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- User inserts/updates own recents (upsert on dwell — 3-5 seconds on page)
CREATE POLICY "recents_insert_own" ON public.recents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "recents_update_own" ON public.recents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- User can clear own recents
CREATE POLICY "recents_delete_own" ON public.recents
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());