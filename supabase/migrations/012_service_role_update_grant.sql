-- Migration 012: restore table-level UPDATE for service_role on am_scores. CRITICAL.
-- Run once in the Supabase SQL Editor. Apply this BEFORE (or with) migration 011.
--
-- SYMPTOM (found 2026-07-17 via a prod health check): POST /api/save-score returns 200 for a NEW
-- player_name (the INSERT path) but 500 "Failed to save score" for an EXISTING player_name (the
-- ON CONFLICT (player_name) DO UPDATE branch of the merge-duplicates upsert). player_name is UNIQUE
-- (migration 001), so a returning player always takes the UPDATE branch.
--
-- ROOT CAUSE: service_role holds table INSERT + SELECT but only a COLUMN-level UPDATE on max_streak
-- (migration 007 "grant update (max_streak)"). Migration 005 intended "grant all", but that was not
-- effectively in force for UPDATE on the live DB (a migration in git is not a migration applied).
-- The DO UPDATE sets level, xp, total_correct, total_answered, realm_scores, attributes, updated_at,
-- so it needs UPDATE on those columns and is denied (42501), which PostgREST returns as a 4xx and
-- the API surfaces as 500.
--
-- IMPACT: every repeat save by the same player has been silently failing. A leaderboard row froze at
-- that player's FIRST save, so XP progression and streaks after it never persisted. This is the real
-- cause of the "streak shows 1 after a 6-streak" audit finding: the streak-6 save was an UPDATE, and
-- it failed. Migration 011 (GREATEST trigger) only takes effect once UPDATE works, so apply BOTH:
-- 012 to make UPDATE succeed, and 011 so a later lower streak cannot clobber a higher stored one.

grant update on public.am_scores to service_role;

-- Belt and suspenders: re-assert the full intended write grant set from migration 005 (least
-- privilege: no DELETE, the API never deletes).
grant select, insert, update on public.am_scores to service_role;

-- VERIFY (expect INSERT, SELECT, UPDATE rows for service_role):
-- select grantee, privilege_type from information_schema.role_table_grants
-- where table_name = 'am_scores' and grantee = 'service_role' order by privilege_type;
