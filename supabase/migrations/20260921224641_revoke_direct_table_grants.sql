/*
# Tighten users table access — revoke direct grants

1. Changes
- Revoke SELECT, INSERT, UPDATE, DELETE on `users` table from `anon` and `authenticated`.
  Direct table access is now fully blocked regardless of RLS policies.
  All read access goes through the `users_public` view (which excludes contrasena_hash).
  All mutations go through SECURITY DEFINER functions (create_user, update_user, delete_user).

2. Security
- The `users` table is now completely inaccessible to anon/authenticated roles directly.
- The `users_public` view (security definer) reads from `users` using owner privileges
  and exposes only safe columns. SELECT granted to anon/authenticated.
- SECURITY DEFINER functions handle all mutations with password hashing via pgcrypto.

3. Notes
- This is a single-tenant no-auth app. All data is intentionally shared/public.
- The RLS-on-table-with-no-policies pattern is intentional: it's a second layer of defense
  on top of the revoked grants.
- The security_definer view is required: it's the only way to expose selected columns
  from a table that has no direct access grants.
*/

REVOKE SELECT, INSERT, UPDATE, DELETE ON users FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON users FROM authenticated;
