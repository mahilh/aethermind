-- Migration 010: remove the 2 confirmed duplicate question strings (keeps one copy of each).
-- Run once in the Supabase SQL Editor. Confirmed duplicates on 2026-07-17 (T2 anon read):
--   "The Taoist concept of wu wei (non-action) teaches:"                       (2 copies)
--   "Viktor Frankl's logotherapy proposes that the primary human motivation is:" (2 copies)
-- MAX(id) picks one uuid per duplicated group to delete. am_scores stores aggregate scores only,
-- so no question row is referenced by a foreign key and this delete is safe.
-- Ordering note: if 009 has already run, the Frankl stem reads "Frankl's ..." in BOTH copies, so
-- they stay byte-identical and are still grouped as duplicates here.

DELETE FROM public.am_questions
WHERE id IN (
  SELECT MAX(id) FROM public.am_questions GROUP BY question HAVING count(*) > 1
);

-- Verify (expect 118):
SELECT count(*) AS remaining_questions FROM public.am_questions;
