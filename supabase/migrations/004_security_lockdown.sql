-- AetherMind · Migration 004 · Security lockdown  (READY - apply after prod redeploy)
-- Run in Supabase SQL Editor once the prerequisites below are met.
-- Idempotent: safe to run multiple times.
--
-- !!! APPLY-ORDER WARNING !!!
-- This migration REMOVES anon INSERT/UPDATE on am_scores. Applying it BEFORE
-- api/save-score.js (the service-role write path) is LIVE will BREAK leaderboard
-- saves. Prereqs (status 2026-07-15):
--   [DONE]    SUPABASE_SERVICE_KEY set in Vercel Production (confirmed via vercel env ls)
--   [PENDING] api/save-score.js live in prod: needs a production redeploy (prod is
--             3 days stale). Verify GET /api/save-score returns JSON, not index.html,
--             BEFORE applying this migration.
--
-- Fixes security-review findings against migration 003:
--   [CRITICAL] am_questions UPDATE open to anon  (question / correct_idx tamperable)
--   [HIGH]     am_scores INSERT/UPDATE open to anon  (leaderboard forgeable)
--   [MEDIUM]   alter default privileges auto-exposing every future public table

-- ============================================================
-- 1. am_questions: anon may bump ONLY the counter columns.
--    The column-scoped GRANT is the REAL control: anon physically cannot write
--    any column except times_shown / times_correct (permission denied otherwise).
--    NOTE: an RLS "with check (question = question ...)" clause enforces NOTHING -
--    RLS cannot reference OLD, so a new-vs-new comparison is always true.
-- ============================================================
revoke update on public.am_questions from anon, authenticated;
grant  update (times_shown, times_correct) on public.am_questions to anon, authenticated;

drop policy if exists "am_q_public_update" on public.am_questions;
drop policy if exists "am_q_stat_only"     on public.am_questions;
create policy "am_q_stat_only" on public.am_questions
  for update using (true) with check (true);
-- Optional defense-in-depth (add on request): a BEFORE UPDATE trigger comparing
-- OLD vs NEW can hard-block protected-column changes if the grant is ever widened.

-- ============================================================
-- 2. am_scores: all writes go through the service-role API only.
--    Drop the anon write policies AND revoke the grants (belt and suspenders).
--    SELECT stays, so the leaderboard remains publicly readable.
-- ============================================================
drop policy if exists "am_public_insert" on public.am_scores;
drop policy if exists "am_public_update" on public.am_scores;
revoke insert, update on public.am_scores from anon, authenticated;

-- ============================================================
-- 3. Remove the systemic default-privilege exposure introduced in 003.
--    Future public tables must be granted explicitly, never by a blanket rule.
-- ============================================================
alter default privileges in schema public revoke select on tables from anon, authenticated;

-- ============================================================
-- 4. Least privilege: strip table privileges anon/authenticated never need.
--    (Not reachable via PostgREST, but least-privilege hygiene.)
-- ============================================================
revoke truncate, references, trigger, delete on public.am_questions from anon, authenticated;
revoke truncate, references, trigger, delete on public.am_scores    from anon, authenticated;

-- ============================================================
-- VERIFY (run after applying): anon should have SELECT + counter-only UPDATE on
-- am_questions, and SELECT-only on am_scores.
-- ============================================================
-- select grantee, table_name, privilege_type, column_name
-- from information_schema.role_column_grants
-- where grantee = 'anon' and table_name in ('am_questions','am_scores')
-- order by table_name, privilege_type;
