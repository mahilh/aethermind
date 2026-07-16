-- AetherMind · Migration 006 · Purge em-dashes (U+2014) from am_questions content
-- Run in Supabase SQL Editor AFTER 005. Idempotent: a second run matches nothing.
--
-- Audit 2026-07-16 (anon SELECT over all 120 rows): 479 em-dashes across 116 rows
--   (question 6, explanation 150, insight 119, options 204). Every occurrence is the
--   spaced form (space, U+2014, space). We replace the spaced form with ", " first so
--   prose stays clean (avoids a stray " , "); a second pass catches any bare U+2014.
--   The ::jsonb cast validates options after replacement, so a bad edit would roll the
--   whole statement back rather than corrupt data.

update public.am_questions set
  question    = replace(replace(question,      ' ' || chr(8212) || ' ', ', '), chr(8212), ','),
  explanation = replace(replace(explanation,   ' ' || chr(8212) || ' ', ', '), chr(8212), ','),
  insight     = replace(replace(insight,       ' ' || chr(8212) || ' ', ', '), chr(8212), ','),
  options     = replace(replace(options::text, ' ' || chr(8212) || ' ', ', '), chr(8212), ',')::jsonb
where question      like '%' || chr(8212) || '%'
   or explanation   like '%' || chr(8212) || '%'
   or insight       like '%' || chr(8212) || '%'
   or options::text like '%' || chr(8212) || '%';

-- VERIFY (expect 0):
-- select count(*) from public.am_questions
-- where question like '%' || chr(8212) || '%' or explanation like '%' || chr(8212) || '%'
--    or insight like '%' || chr(8212) || '%' or options::text like '%' || chr(8212) || '%';
