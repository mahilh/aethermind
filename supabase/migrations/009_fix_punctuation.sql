-- Migration 009: restore stripped apostrophes in a VERIFIED, conservative set of possessives.
-- Run once in the Supabase SQL Editor.
--
-- SCOPE (important): the data pipeline stripped apostrophes DATASET-WIDE, not in 25 rows. Only 1 of
-- 120 explanations contains any apostrophe at all. A blanket regex CANNOT safely restore them: for
-- example (\w)s\s+(own|text|...) corrupts correct text such as "its own" into "it's own", "famous
-- text" into "famou's text", and "Akashic Records concept" into "Record's concept". This migration
-- therefore fixes ONLY specific proper-noun possessives confirmed by inspection on 2026-07-17.
-- A complete apostrophe and comma restoration needs manual review or regeneration of the affected
-- text and is intentionally NOT attempted here. Every REPLACE below is an idempotent no-op when its
-- target text is absent, so this migration is safe to re-run.

UPDATE public.am_questions SET
  question = REPLACE(REPLACE(question,
               'Frankls ', 'Frankl''s '),
               'Bohms ',   'Bohm''s '),
  explanation = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(explanation,
               'Frankls ',       'Frankl''s '),
               'Bohms ',         'Bohm''s '),
               'Jungs concept',  'Jung''s concept'),
               'Hancocks work',  'Hancock''s work'),
               'Shaivisms view', 'Shaivism''s view'),
               'minds own',      'mind''s own'),
               'ones own',       'one''s own'),
  insight = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(insight,
               'Frankls ',       'Frankl''s '),
               'Bohms ',         'Bohm''s '),
               'Jungs concept',  'Jung''s concept'),
               'Hancocks work',  'Hancock''s work'),
               'Shaivisms view', 'Shaivism''s view'),
               'minds own',      'mind''s own'),
               'ones own',       'one''s own');

-- Verify the targeted possessives are gone (expect 0):
SELECT count(*) AS remaining_targeted FROM public.am_questions
WHERE explanation LIKE '%Jungs concept%'
   OR explanation LIKE '%ones own%'
   OR insight     LIKE '%ones own%'
   OR question    LIKE '%Frankls %';
