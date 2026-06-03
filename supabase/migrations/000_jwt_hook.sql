-- Migration 000: JWT custom claims hook
-- Adds org_role_id and chapter_id to JWT claims so RLS can use:
--   auth.jwt() ->> 'org_role_id'
--   auth.jwt() ->> 'chapter_id'
--
-- This implements Supabase Auth "Custom Access Token" hook as a Postgres function.
-- MANUAL STEP (after migrations run): Register this function in the Supabase Dashboard:
--   Authentication > Hooks > Custom Access Token
--   Select Postgres function: public.custom_access_token_hook

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  claims jsonb;
  v_user_id uuid;
  v_org_role_id integer;
  v_chapter_id uuid;
BEGIN
  claims := COALESCE(event->'claims', '{}'::jsonb);
  v_user_id := (event->>'user_id')::uuid;

  -- users table may not exist at migration time; avoid hard dependency.
  IF to_regclass('public.users') IS NOT NULL THEN
    EXECUTE 'SELECT org_role_id, chapter_id FROM public.users WHERE user_id = $1'
      INTO v_org_role_id, v_chapter_id
      USING v_user_id;
  END IF;

  -- Store claims as strings so policies can reliably compare with ->>.
  IF v_org_role_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{org_role_id}', to_jsonb(v_org_role_id::text), true);
  END IF;

  IF v_chapter_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{chapter_id}', to_jsonb(v_chapter_id::text), true);
  END IF;

  RETURN jsonb_build_object('claims', claims);
END;
$$;

-- Allow Supabase Auth to execute the hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- Prevent access from client-facing roles
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM anon, authenticated, public;
