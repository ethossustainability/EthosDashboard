-- Migration 003: users
-- Every person with an account. All volunteers are minors ages 14–17.
-- NOTE: Board checks in RLS rely on custom JWT claims (see 000_jwt_hook.sql).

CREATE TABLE IF NOT EXISTS public.users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  date_of_birth DATE NOT NULL,
  personal_email VARCHAR(150) NOT NULL,
  ethos_email VARCHAR(150),
  active_login_email VARCHAR(150) NOT NULL,
  slack_user_id VARCHAR(100),
  guardian_name VARCHAR(150) NOT NULL,
  guardian_email VARCHAR(150) NOT NULL,
  guardian_phone VARCHAR(30),
  org_role_id INTEGER NOT NULL REFERENCES public.org_roles(role_id),
  chapter_id UUID NOT NULL REFERENCES public.chapters(chapter_id),
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- updated_at maintenance
CREATE OR REPLACE FUNCTION public.users_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON public.users;
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.users_set_updated_at();

-- Indexes
CREATE INDEX idx_users_personal_email ON public.users(personal_email);
CREATE INDEX idx_users_ethos_email ON public.users(ethos_email) WHERE ethos_email IS NOT NULL;
CREATE INDEX idx_users_active_login_email ON public.users(active_login_email);
CREATE INDEX idx_users_slack_user_id ON public.users(slack_user_id) WHERE slack_user_id IS NOT NULL;
CREATE INDEX idx_users_chapter_id ON public.users(chapter_id);
CREATE INDEX idx_users_org_role_id ON public.users(org_role_id);
CREATE INDEX idx_users_name_fts ON public.users USING GIN (
  to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow Supabase Auth hook role to read users to inject claims.
CREATE POLICY "users_select_supabase_auth_admin" ON public.users
  FOR SELECT
  TO supabase_auth_admin
  USING (true);

-- Authenticated can read own record
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Directory browsing must not expose sensitive fields (guardian_email/phone, date_of_birth).
-- Use the restricted view (public.users_directory) from the directory API for non-Board.

-- Board can read any user
CREATE POLICY "users_select_board" ON public.users
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');

-- Authenticated users can update their own record.
-- Sensitive-field restrictions are enforced in the API.
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Board can update any user
CREATE POLICY "users_update_board" ON public.users
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- No INSERT policy: user creation is performed via server-side service role.
-- No DELETE policy: users are not deleted from the app.

-- Restricted directory view (non-sensitive fields only)
CREATE OR REPLACE VIEW public.users_directory AS
SELECT 
  user_id,
  first_name,
  last_name,
  org_role_id,
  chapter_id,
  onboarding_complete,
  created_at
FROM public.users;
