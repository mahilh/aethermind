# AetherMind Pre-Launch Checklist
Last updated: 2026-07-18 (Session 15)

Run this sweep right before the Austin friend-group launch. Prefer direct anon REST or the Supabase
Management API for DB checks: the aethermind MCP get_leaderboard/check_db UNDER-REPORT leaderboard rows.

## DB State
- [ ] `SELECT correct_idx, count(*) FROM am_questions GROUP BY correct_idx;`
      Expected varied, e.g. {0:25, 1:40, 2:28, 3:25} (shuffled Session 14). NOT {0:118}.
- [ ] `SELECT count(*) FROM am_scores WHERE player_name <> 'mahil';`
      Expected 0. Delete test/probe rows by EXACT name (never a blanket non-mahil DELETE). Known probe
      names: AuditPlayer, AuditOverdrive, Test player, cheat, cheat-test, plus any emoji test names.
      Probes RECUR while a Playwright audit is running, so sweep with no audit running.
- [ ] `SELECT count(*) FROM am_questions WHERE explanation LIKE '%' || chr(8212) || '%';`
      Expected 0 (no em-dashes in DB; 006 applied).
- [ ] `SELECT count(*) FROM am_questions;` Expected 118.

## API Health
- [ ] POST /api/save-score with valid stats -> {"ok":true}
- [ ] POST /api/check-answer with a malformed id -> 400 ("Invalid questionId")
- [ ] POST /api/check-answer with a well-formed but unknown uuid -> 404 ("Question not found")
- [ ] GET /api/daily-questions -> 200 with 5 questions

## Live Site
- [ ] aethermind-five.vercel.app loads in < 3s
- [ ] Leaderboard: real players only (sweep test rows first, see DB State)
- [ ] Daily Aether: shows today's date; 5 questions
- [ ] Name input: Cinzel font, esoteric placeholder, no "(optional)" text (T1 c933159)

## Security
- [ ] XP ceiling: POST level:2 xp:99000 -> {"error":"Implausible score"} (ceiling 200*1.7^level+500).
- [ ] check-answer rate limiting is 60/min per IP + 30 per (IP+question)/10min, keyed by IP so
      concurrent players are not blocked. It is best-effort per serverless instance, so a live 429
      needs a sustained burst from ONE ip (>30 to one question, or >60/min); a 5-call test will NOT 429.
- [ ] KNOWN DEBT (not a blocker, decided hold): correct_idx STILL ships to the client in
      fetchQuestionsForRealm, so a DevTools reader can find the answer. The shuffle (Session 14) killed
      the trivial "always tap A" exploit but not this. The real fix (server-side session scoring +
      checkAnswer cutover) is HELD pending a joint T1+T2 scoping. Honor-system is accepted for the
      friend-group threat model.

## Content
- [ ] 0 em-dashes in DB (verified above).
- [ ] Famous-name apostrophes fixed: Jung's, Plato's, Frankl's, Newton's, Cannon's, Weiss's,
      Sheldrake's, Cook Ding's, Philosopher's Stone, Ma'at, Law of One's (migration 014).
- [ ] KNOWN DEBT (not a blocker): some generic-noun possessives (in insight/explanation: storys, lifes,
      Egypts, "ones will") and dataset-wide stripped serial commas remain. A regex fix is UNSAFE (it
      would corrupt "its own" -> "it's own"); the clean fix is AI content regeneration, pending Mahil's
      call on model/budget/scope.

## Known Architectural Debt (documented, not launch blockers)
1. correct_idx ships to client (see Security). Needs server-side session scoring.
2. Content: some generic possessives + serial commas stripped (famous names fixed in 014).
3. Question pool: ~10 per realm (118/12). Daily Aether (1 from each of 5 realms) exhausts variety in a
   few weeks; add more questions before heavy daily use.
4. correct_idx distribution skews to index 1 (40 vs ~29 expected): a Park-Miller artifact with these
   UUIDs. ~1.4 SD above mean, statistically acceptable, NOT exploitable.
