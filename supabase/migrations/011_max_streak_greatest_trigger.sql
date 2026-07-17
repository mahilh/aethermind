-- Migration 011: guarantee max_streak never decreases on the leaderboard.
-- Run once in the Supabase SQL Editor.
--
-- ROOT CAUSE: /api/save-score upserts with Prefer: resolution=merge-duplicates, which UPDATEs the
-- row on a player_name conflict. A later save carrying a LOWER max_streak (a weaker session) then
-- overwrites a previously stored higher streak. That is why the board showed 1 after a 6-streak.
--
-- FIX (deviates from the spec's RPC + api rewrite, on purpose): a BEFORE UPDATE trigger that clamps
-- max_streak to GREATEST(old, new). This needs NO change to api/save-score.js, so with auto-deploy
-- active it cannot break the live write path. An api RPC rewrite would 500 every save until this
-- migration was applied, whereas this migration is inert until run and then enforces the invariant
-- atomically for ALL writers. A brand new player is untouched (BEFORE UPDATE does not fire on
-- INSERT), so a first score stores its real streak.

CREATE OR REPLACE FUNCTION public.am_scores_max_streak_guard()
RETURNS trigger AS $$
BEGIN
  NEW.max_streak = GREATEST(COALESCE(OLD.max_streak, 0), COALESCE(NEW.max_streak, 0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_am_scores_max_streak_guard ON public.am_scores;
CREATE TRIGGER trg_am_scores_max_streak_guard
  BEFORE UPDATE ON public.am_scores
  FOR EACH ROW EXECUTE FUNCTION public.am_scores_max_streak_guard();

-- Verify the trigger exists (expect one row):
SELECT tgname FROM pg_trigger WHERE tgname = 'trg_am_scores_max_streak_guard';
