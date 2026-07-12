-- AetherMind · Migration 003 · Grant anon/authenticated table privileges
-- Run in Supabase SQL Editor: supabase.com -> SQL Editor -> New query -> paste -> Run
-- Idempotent: safe to run multiple times.
--
-- ROOT CAUSE OF THE PRODUCTION 401 (Postgres error 42501):
--   Migrations 001 and 002 enable RLS and create permissive policies
--   (using (true)), but never GRANT base privileges to the anon role.
--   RLS is applied AFTER the SQL privilege check, so a role with a
--   permissive policy but no GRANT still gets "permission denied for table".
--   PostgREST surfaces that as HTTP 401. This has nothing to do with Vercel,
--   the anon key, or the deployment -- the key is valid and correctly baked
--   into the production bundle; the database simply denies the anon role.

-- Schema access (usually already present; included for safety)
grant usage on schema public to anon, authenticated;

-- Questions: SELECT to read for gameplay, UPDATE for times_shown/times_correct
-- stat bumps (migration 002 already defines the matching update policy).
grant select, update on public.am_questions to anon, authenticated;

-- Scores: SELECT for the leaderboard, INSERT + UPDATE for saveScore upserts
-- (migration 001 already defines the matching insert/update policies).
grant select, insert, update on public.am_scores to anon, authenticated;

-- Leaderboard view (getLeaderboard may read this instead of the base table).
grant select on public.am_leaderboard to anon, authenticated;

-- Prevent recurrence: any future table in public inherits read access.
alter default privileges in schema public grant select on tables to anon, authenticated;

-- VERIFY: list the privileges the anon role now holds on the game tables.
select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'anon' and table_name in ('am_questions', 'am_scores')
order by table_name, privilege_type;
