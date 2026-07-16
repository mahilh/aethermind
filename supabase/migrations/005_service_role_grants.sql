-- AetherMind · Migration 005 · Grant service_role write access to am_scores
-- Run in Supabase SQL Editor. Idempotent, safe to run multiple times.
--
-- ROOT CAUSE (proven via Vercel runtime logs, 2026-07-16):
--   POST /api/save-score returns 500 with Postgres 42501
--   "permission denied for table am_scores", hint:
--   "GRANT SELECT, INSERT, UPDATE ON public.am_scores TO service_role".
--   The service_role KEY is correct (it passes the api/save-score fail-fast guard),
--   but the service_role ROLE was never granted table privileges: migration 003
--   granted am_scores writes to anon/authenticated only, and 004 revoked the anon
--   path. BYPASSRLS bypasses RLS policies, NOT table GRANTs, so the server-side
--   write path is denied. This restores the standard Supabase posture where
--   service_role (a server-only secret) can reach the application tables.

grant usage on schema public to service_role;
grant all on public.am_scores    to service_role;
grant all on public.am_questions to service_role;

-- Keep future public tables reachable by the server role without another manual grant.
alter default privileges in schema public grant all on tables to service_role;

-- VERIFY (expect INSERT, SELECT, UPDATE rows for service_role on am_scores):
-- select grantee, privilege_type from information_schema.role_table_grants
-- where table_name = 'am_scores' and grantee = 'service_role' order by privilege_type;
