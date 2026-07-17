-- 014_fix_apostrophes.sql  (Session 13)
-- Restore apostrophes to proper-noun possessives that were stripped at pipeline time.
--
-- WORD-BOUNDARY SAFE: names use regexp_replace with \m...\M (whole-word only), so "Jungs" is fixed
-- but "Jungian" / the unit "newtons" / plural "stones" are NOT touched. Multi-word cases use exact
-- replace(). Verified against production via a non-destructive preview: changes EXACTLY 15 rows with
-- zero collateral. IDEMPOTENT: the corrected forms contain apostrophes the patterns no longer match,
-- so re-running is a no-op.
--
-- IN SCOPE (proper nouns): Jung's, Plato's, Frankl's, Newton's, Cannon's, Weiss's, Sheldrake's,
--   Rupert Sheldrake's, Cook Ding's, Philosopher's Stone, Ma'at, Ma'at's, Law of One's.
-- OUT OF SCOPE (needs manual review or content regeneration, per the Session 7 finding that
--   apostrophe loss is dataset-wide): generic-noun possessives (storys, Egypts, lifes, Caves,
--   philosophers, Socrates', "ones will") and the separately stripped serial/oxford commas.
-- The boot brief's blanket REPLACE(insight,'ones ',"one's ") was REJECTED: it corrupts
--   stones/bones/tones/milestones/hormones; and REPLACE('Ruperts Sheldrake',...) was WRONG for the
--   actual "Ruperts Sheldrakes" text (would yield "Sheldrake'ss").

UPDATE am_questions SET
  question = regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    replace(replace(replace(replace(replace(question,
      'Ruperts Sheldrakes','Rupert Sheldrake''s'),
      'Philosophers Stone','Philosopher''s Stone'),
      'Cook Dings','Cook Ding''s'),
      'Ma ats','Ma''at''s'),
      'Law of Ones','Law of One''s'),
    '\mJungs\M','Jung''s','g'),'\mSheldrakes\M','Sheldrake''s','g'),
    '\mPlatos\M','Plato''s','g'),'\mFrankls\M','Frankl''s','g'),
    '\mNewtons\M','Newton''s','g'),'\mCannons\M','Cannon''s','g'),
    '\mWeisss\M','Weiss''s','g'),'\mMa at\M','Ma''at','g'),
  explanation = regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    replace(replace(replace(replace(replace(explanation,
      'Ruperts Sheldrakes','Rupert Sheldrake''s'),
      'Philosophers Stone','Philosopher''s Stone'),
      'Cook Dings','Cook Ding''s'),
      'Ma ats','Ma''at''s'),
      'Law of Ones','Law of One''s'),
    '\mJungs\M','Jung''s','g'),'\mSheldrakes\M','Sheldrake''s','g'),
    '\mPlatos\M','Plato''s','g'),'\mFrankls\M','Frankl''s','g'),
    '\mNewtons\M','Newton''s','g'),'\mCannons\M','Cannon''s','g'),
    '\mWeisss\M','Weiss''s','g'),'\mMa at\M','Ma''at','g'),
  insight = regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
    replace(replace(replace(replace(replace(insight,
      'Ruperts Sheldrakes','Rupert Sheldrake''s'),
      'Philosophers Stone','Philosopher''s Stone'),
      'Cook Dings','Cook Ding''s'),
      'Ma ats','Ma''at''s'),
      'Law of Ones','Law of One''s'),
    '\mJungs\M','Jung''s','g'),'\mSheldrakes\M','Sheldrake''s','g'),
    '\mPlatos\M','Plato''s','g'),'\mFrankls\M','Frankl''s','g'),
    '\mNewtons\M','Newton''s','g'),'\mCannons\M','Cannon''s','g'),
    '\mWeisss\M','Weiss''s','g'),'\mMa at\M','Ma''at','g');
