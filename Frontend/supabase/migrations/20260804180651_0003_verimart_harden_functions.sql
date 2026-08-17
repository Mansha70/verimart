/*
# Harden internal functions

1. Revoke EXECUTE on internal SECURITY DEFINER functions from anon and authenticated
   so they cannot be called directly via the REST API — they are only meant to run
   as triggers / internally.
2. Add a fixed search_path to set_updated_at (was mutable).
3. Functions affected:
   - public.current_role() — used in RLS policies; safe to keep callable but we lock it down.
   - public.handle_new_user() — trigger only.
   - public.apply_warning_effects() — trigger only.
   - public.set_updated_at() — trigger only.

Note: current_role() must remain callable by authenticated for RLS to work, since
policies reference it. We keep EXECUTE on current_role for authenticated but revoke
from anon. The others are trigger-only and revoked from both.
*/

-- set_updated_at: add fixed search_path
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Trigger-only functions: revoke from everyone except owner
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.apply_warning_effects() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;

-- current_role: needed by RLS policies run as authenticated; keep for authenticated, revoke anon
REVOKE EXECUTE ON FUNCTION public.current_role() FROM anon;

-- Add fixed search_path to current_role for safety
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'raw_app_meta_data' ->> 'role')::text,
    'buyer'
  );
$$;
