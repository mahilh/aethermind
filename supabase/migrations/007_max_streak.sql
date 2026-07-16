-- AetherMind · Migration 007 · Add max_streak to am_scores (leaderboard streak/combo)
-- Run in Supabase SQL Editor. Idempotent: safe to run multiple times.
--
-- Adds a per-run best-streak column for the leaderboard. api/save-score (raw fetch,
-- service_role) writes max_streak only when a run reports a streak > 0; getLeaderboard()
-- selects it via '*'. service_role already holds table-level GRANT ALL on am_scores
-- (migration 005), which covers columns added later, and anon holds table-level SELECT
-- (migration 004). The column-level grants below are therefore belt-and-suspenders:
-- explicit, self-documenting, and no-ops if 004/005 are already applied.

alter table public.am_scores
  add column if not exists max_streak integer not null default 0;

grant update (max_streak) on public.am_scores to service_role;
grant select (max_streak) on public.am_scores to anon;

-- VERIFY (expect one row: max_streak, integer, default 0):
-- select column_name, data_type, column_default from information_schema.columns
-- where table_name = 'am_scores' and column_name = 'max_streak';
