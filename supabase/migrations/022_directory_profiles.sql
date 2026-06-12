-- Migration 022: directory_profiles
-- Public-facing profile for each volunteer.
-- is_visible column does NOT exist — profiles are always visible.
-- Project history derived from applications. Badges derived from user_badges.
-- Bio is the only field the volunteer directly edits.

CREATE TABLE IF NOT EXISTS public.directory_profiles (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(user_id) ON DELETE CASCADE,
  bio TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.directory_profiles_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_directory_profiles_set_updated_at ON public.directory_profiles;
CREATE TRIGGER trg_directory_profiles_set_updated_at
  BEFORE UPDATE ON public.directory_profiles
  FOR EACH ROW EXECUTE FUNCTION public.directory_profiles_set_updated_at();

-- Indexes
CREATE INDEX idx_directory_profiles_user_id ON public.directory_profiles(user_id);

-- RLS
ALTER TABLE public.directory_profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all profiles (always visible, no hiding)
CREATE POLICY "directory_profiles_select_authenticated" ON public.directory_profiles
  FOR SELECT TO authenticated USING (true);

-- No INSERT policy: created by service role on first application approval

-- User can update own bio only
CREATE POLICY "directory_profiles_update_own" ON public.directory_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Board can update any profile (via Supabase dashboard — not a UI feature)
CREATE POLICY "directory_profiles_update_board" ON public.directory_profiles
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- No DELETE policy