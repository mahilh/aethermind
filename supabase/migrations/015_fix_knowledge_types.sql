-- 015_fix_knowledge_types.sql  (Session 13)
-- Re-tag two quantum questions whose knowledge_type ('empirical') overstated certainty.
-- Planck's matter/consciousness statement is a metaphysical claim, not an experimental result -> philosophical.
-- The double-slit correct answer asserts "the act of measurement collapses the wave function" = the
-- Copenhagen interpretation; the collapse mechanism is unproven (many-worlds / pilot-wave have no literal
-- collapse), so per Mahil's call the question is tagged speculative rather than empirical. Applied by exact
-- id (PK) so no other rows can match.
UPDATE am_questions SET knowledge_type = 'philosophical' WHERE id = '393e0067-6708-4d07-9634-95f763dfd17d'; -- Planck / consciousness
UPDATE am_questions SET knowledge_type = 'speculative'   WHERE id = '88778300-3fc6-4e4f-a14d-344eb631ab3f'; -- double-slit / collapse
