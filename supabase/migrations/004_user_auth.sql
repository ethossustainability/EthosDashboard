-- Migration 004: user_auth
-- Google OAuth accounts linked to users. One user can have multiple rows.
-- Handles personal Gmail + Ethos Workspace account coexistence.

CREATE TABLE IF NOT EXISTS public.user_auth (
  auth_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  google_account_email VARCHAR(150) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  linked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_auth_user_id ON public.user_auth(user_id);
CREATE INDEX idx_user_auth_google_account_email ON public.user_auth(google_account_email);
CREATE INDEX idx_user_auth_is_active ON public.user_auth(is_active);

-- RLS
ALTER TABLE public.user_auth ENABLE ROW LEVEL SECURITY;

-- Supabase Auth admin can read all auth records (for token generation)
CREATE POLICY "user_auth_select_supabase_auth_admin" ON public.user_auth
  FOR SELECT
  TO supabase_auth_admin
  USING (true);

-- Authenticated users can read their own auth records
CREATE POLICY "user_auth_select_own" ON public.user_auth
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Board can read any user's auth records
CREATE POLICY "user_auth_select_board" ON public.user_auth
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3');

-- Board can insert auth records (when linking Ethos email)
CREATE POLICY "user_auth_insert_board" ON public.user_auth
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- Board can update auth records (to deactivate old logins)
CREATE POLICY "user_auth_update_board" ON public.user_auth
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'org_role_id') = '3')
  WITH CHECK ((auth.jwt() ->> 'org_role_id') = '3');

-- Service role can insert/update (for Supabase Auth signup flow)
-- No explicit policy needed; service role bypasses RLS.

-- No DELETE policy: auth records should not be deleted, only marked inactive.
