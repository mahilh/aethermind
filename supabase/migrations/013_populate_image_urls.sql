-- Migration 013: populate am_questions.image_url with the per-realm pixel art (currently NULL for
-- every row, so QuizScreen falls back to a random picsum stock photo per question).
-- Run once in the Supabase SQL Editor (service_role). anon holds column UPDATE on am_questions but
-- this is an admin backfill, so run it as service_role.
--
-- VERIFIED 2026-07-17: all 12 target files return HTTP 200 at the question-images bucket ROOT (the
-- /realms subfolder 404s, so the root filenames below are used). The Supabase storage host is already
-- on QuizScreen.safeImageUrl's allowlist, so these URLs render rather than being dropped.
--
-- CAVEAT (read before running): QuizScreen already renders realm.imageUrl as the 120px hero banner at
-- the top of EVERY question (QuizScreen.jsx:270), and these are the SAME 12 files. Populating image_url
-- makes the 200px question image identical to the hero banner, so the same art shows TWICE per
-- question. That is a visual regression versus the varied (if irrelevant) picsum fallback, and all 10
-- questions in a realm would also share one image. Decide first: either (a) run this AND have T1 drop
-- or repoint the question-image slot so it is not a duplicate of the hero banner, or (b) keep picsum
-- until real per-question art exists. Held out of the "apply now" migration set on purpose.

UPDATE public.am_questions SET image_url = CASE realm_id
  WHEN 1  THEN 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realm-01-ancient-civilizations.png'
  WHEN 2  THEN 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realm-02-hermetic-wisdom.png'
  WHEN 3  THEN 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realm-03-gnosticism.png'
  WHEN 4  THEN 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realm-04-eastern-traditions.png'
  WHEN 5  THEN 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realm-05-consciousness.png'
  WHEN 6  THEN 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realm-06-psychology.png'
  WHEN 7  THEN 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realm-07-quantum-physics.png'
  WHEN 8  THEN 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realm-08-esoteric-science.png'
  WHEN 9  THEN 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realm-09-comparative-religion.png'
  WHEN 10 THEN 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realm-10-hidden-history.png'
  WHEN 11 THEN 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realm-11-symbolism.png'
  WHEN 12 THEN 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realm-12-ethics-wisdom.png'
END
WHERE (image_url IS NULL OR image_url = '') AND realm_id BETWEEN 1 AND 12;

-- Verify (expect 118 after migration 010, or 120 if 010 has not been run):
SELECT count(*) AS with_image_url FROM public.am_questions WHERE image_url IS NOT NULL AND image_url <> '';
