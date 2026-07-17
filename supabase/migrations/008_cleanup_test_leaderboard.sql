-- Migration 008: remove test / CI / probe entries from the leaderboard before the Austin launch.
-- Run once in the Supabase SQL Editor (service_role). Anon cannot DELETE after the 004 lockdown.
-- Verified present in am_scores on 2026-07-17 (T2 anon read): deploy-verify, AuditOverdrive,
-- grant-fixed, t2-verify-live, T1Test, t2-nightsave, AuditPlayer, and an XSS probe entry.
-- The spec list is kept (harmless no-ops for names not present) and extended with the two the
-- audit list missed: 'AuditPlayer' and the '<script>alert(1)</sc' XSS probe.
-- 'mahil' (xp 5) is intentionally LEFT: it may be a real play session, not a test.

DELETE FROM public.am_scores
WHERE player_name IN (
  'deploy-verify',
  'AuditOverdrive',
  'grant-fixed',
  't2-verify-live',
  'T1Test',
  't2-nightsave',
  'AuditPlayer',
  'raw-fetch-final',
  'survey-verify',
  'key-verify',
  'overdrive-verify',
  'service-role-test',
  't2-final-verify',
  't2-final',
  'audit-verify',
  't2-verified',
  '<script>alert(1)</sc'
);

-- Verify clean (expect only real players, e.g. 'mahil'):
SELECT player_name, xp, max_streak FROM public.am_scores ORDER BY xp DESC;
