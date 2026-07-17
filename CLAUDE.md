# AetherMind — Master Project Brain
# Auto-read by Claude Code Opus 4.8 at every session start
# github.com/mahilh/aethermind · aethermind-five.vercel.app

## WHAT IS AETHERMIND
A live real-time esoteric consciousness trivia RPG. Players pick from 12 realms of esoteric knowledge, answer adaptive questions pulled from a 120-question Supabase database, earn XP, level up, and compete on a live global leaderboard. Free to play — zero API cost per question. Built for a friend group in Karachi, deploying to Austin TX July 2026.

## LIVE STATE (2026-07-18 Session 13 · T2 verified via aethermind MCP + live endpoint probes)
CONFIRMED (DB / storage / API, verified this session):
- Site: aethermind-five.vercel.app. DB: 118 questions (010 applied, 120 to 118) across 12 realms: 11 realms have 10, Ethics & Wisdom has 8 (both 010 dedup removals were there). Daily Aether (1 from each of 5 realms) pool is healthy (min realm 8 > 5). Leaderboard am_scores (Session 13): 2 rows, mahil (xp 500 / level 10 / max_streak 18 after the Session 13 health check) and an emoji name '🧠⚡🌙' (L4/xp205) that is AMBIGUOUS (could be a real early player or a Mahil/T1 emoji-name test; NOT on the known-test-name list) so it was KEPT for Mahil to judge, not deleted. 'AuditPlayer' Playwright probes were deleted again via the Management API query endpoint (specific-name IN list, NEVER a blanket non-mahil DELETE); they RECUR while an audit runs, so the definitive cleanup is a single pre-launch sweep with no audit running. NOTE: the aethermind MCP get_leaderboard/check_db UNDER-REPORT rows (showed 1 when REST showed 2-3); trust direct anon REST for the authoritative set.
- Leaderboard writes WORK: POST /api/save-score returns {"ok":true} (fixed via 005 service_role GRANT, raw fetch to PostgREST).
- 004 lockdown APPLIED: anon SELECT on am_scores, counter-only UPDATE on am_questions.
- Em dashes: 0 in DB (006 applied, verified across all 120 questions).
- max_streak column PRESENT in am_scores (007 applied); rows all 0 until players build streaks.
- Realm images: 12/12 live at question-images bucket ROOT (all 200); the /realms subfolder 404s. STORAGE fixed in constants.js (e4a50e7).

DEPLOYED CLIENT (confirmed in the live JS bundle):
- All 5 modes LIVE: Classic, Speed Oracle (30s timer), Survival, Gauntlet, Blind Seer. GameOver / GauntletComplete LIVE.
- Cinzel + Press Start 2P fonts, arcade animations (correctFlash / wrongShake / xpFloat / xpTick / fadeInUp), level-up interrupt, question container polish.
- Streak badge (STREAK / ON FIRE / INFERNO), daily realm TODAY badge, weekly / all-time leaderboard tabs, realm card backgrounds, quiz hero banner.
- saveScore debounced (T1 c7f4ef1): saves on level-up, every ~25 XP, and a forced save at session end; maxStreak rides along.
- Sound engine LIVE (T1 1dc0b97, Web Audio API not Tone.js): correct C-E-G ascend, wrong sawtooth, level-up chord, streak pitch-shift, persisted mute toggle.

T2 LIB / STORE (on main): getDailyRealm(), getLeaderboard(period 'all' or 'week') now ORDER BY level DESC then xp DESC (f7637ae, both branches: xp is per-level so a level-2/xp-90 grinder must NOT outrank a level-40/xp-10 player), currentStreak / maxStreak + incrementStreak / breakStreak (session only), timeoutQuestion breaks the streak. WisdomVault dedups wrong-answer cards at the store push site (e1f8e86), keyed by q.db_id with a question-text fallback for pre-qid persisted cards; refreshes in place, keeps the original card id.
T2 ENGINE (on main): wrong-answer XP set to 0 (381d29a), and game-mode XP multipliers in answerQuestion via GAME_MODES array lookup (classic 1x, speed 1.5x, survival 2x, gauntlet 2.5x, blind 3x; 8a1fbc8). LESSON: GAME_MODES IS AN ARRAY, always use .find(m => m.id === gameMode), never GAME_MODES[gameMode] (that returns undefined and throws). Base correct XP unchanged at classic 1x.
T2 API (Session 9): check-answer is rate-limited (28cadeb, 60/min/IP + 30/IP+question/10min). DELIBERATE DEVIATION from spec: the per-question layer is keyed by IP+question, NOT question alone, so concurrent legit players on a shared question are never 429'd (a global per-question counter would break multiplayer); it also guards times_shown/times_correct from single-IP inflation. LIVE-VERIFIED: a 65-burst from one IP (nonexistent uuid, zero DB writes) returned 57x 400 + 8x 429, so Layer A fires on the live deploy. save-score xp plausibility ceiling RESTORED Session 10 (f2411eb, 200*1.7^level+500; the 7b1c557 rewrite had dropped it to a flat 99999). LIVE-VERIFIED: level:2/xp:5000 and level:7/xp:9000 both 400 Implausible; mahil level:7/xp:300 and level:8/xp:350 both {"ok":true}. PERMANENT CEILING REFERENCE (200*1.7^level+500, do NOT re-derive): L1=840, L2=1078, L5=3340, L7=8707, L8=14452, L9=24220. Max legit in-level xp (xp is per-level; xpToNext ~100*1.65^(level-1)): L2~132, L5~745, L7~2030, L8~3350, so the ceiling sits 4x to 8x above the legit max at every level and never false-rejects. Boot briefs have miscalculated this TWICE (once giving ~1320 for L7, once ~2395 for L8); the code Math.pow(1.7, level) is correct, only the prose was wrong.
T2 AUDIT (Session 11, verified, no code change needed): weekly leaderboard filter is correct (getLeaderboard 'week' uses updated_at >= now-7d ISO; live-confirmed mahil appears in the 7-day window). Streak logic correct: incrementStreak bumps currentStreak and lifts maxStreak, breakStreak and timeoutQuestion zero currentStreak only, maxStreak is never reset client-side and the DB stays monotonic via save-score GREATEST + the 011 trigger. Streak badge tiers (T1 QuizScreen): STREAK >=3, ON FIRE >=5, INFERNO >=7. WisdomVault dedup proven by a Node harness mirroring the store push block (same question -> 1 card with id preserved, distinct question -> +1, legacy no-qid card dedups by text). FINDING: image_url is now POPULATED for all 118 (realm_stats 118/118; was NULL), so 013 (realm art) appears applied.
T2 SESSION 12 (verified live): save-score regression suite GREEN: INSERT and UPDATE both {"ok":true}; GREATEST held (max_streak stayed 18 after a streak:2 write); cheat xp:50000/L3 -> 400 Implausible, no row written. Prod formula confirmed (api/save-score.js:76, Math.pow(1.7, level)). AuditPlayer probe deleted (Management API). T1 shipped aea73ff (dual-image fix: removed the duplicate realm art from the question slot, resolving the Session-11 image_url dup) and de49a8e (Daily Aether progress dots a11y labels). T1 shipped quantum-shimmer hover (66f0a36) and hold-to-commit on touch (fd01c00, 2.2s with tap fallback + ghost-click suppression); both live. T1 also removed the question <img> slot as dead code, so image_url (013 realm art) now renders ONCE as the hero banner only.
T2 SESSION 13 (content fixes, applied via Management API AND committed as repo migrations 014/015): 014 restores proper-noun apostrophes (Jung's, Plato's, Frankl's, Newton's, Cannon's, Weiss's, Sheldrake's, Rupert Sheldrake's, Cook Ding's, Philosopher's Stone, Ma'at, Ma'at's, Law of One's) using WORD-BOUNDARY-safe regexp_replace (\m..\M), verified 15 rows changed / 0 collateral. The boot's blanket REPLACE(insight,'ones ',"one's ") was REJECTED (it corrupts stones/bones/tones/milestones/hormones) and its REPLACE('Ruperts Sheldrake',..) was WRONG for the actual 'Ruperts Sheldrakes' text (would yield "Sheldrake'ss"). 015 re-tags knowledge_type: Planck-consciousness empirical->philosophical, double-slit-collapse empirical->speculative (Copenhagen collapse is contested). NOTE migration files on disk are 001-015 (the boot's 021-024 numbering is wrong; next is 016). STILL BROKEN, needs content regeneration (per the Session 7 finding, apostrophe loss is dataset-wide): generic-noun possessives (storys, Egypts, lifes, Caves, philosophers, Socrates', "ones will") and dataset-wide stripped serial/oxford commas. So content quality is improved on famous names but is NOT fully clean.
T2 TOOLING: read-only FastMCP server scripts/aethermind_mcp.py registered at user scope and Connected (check_db, get_leaderboard, check_images, realm_stats; loads .env.local; tools become callable in a fresh session). Removed the corrupted postgres-aethermind MCP entry (it failed to connect and exposed a stale credential in plaintext; that credential must be rotated and AetherProject/.env.local repaired, both outside this repo).
T2 DATA MIGRATIONS (Session 7, WRITTEN + pushed, NOT auto-applied; run each once in the Supabase SQL Editor): 008 deletes the test/probe leaderboard rows (keeps 'mahil'); 009 restores a verified conservative set of proper-noun apostrophes (a blanket regex was REJECTED, it would corrupt "its own" and "famous text"; apostrophe loss is dataset-wide, only 1 of 120 explanations has any apostrophe, so a full fix needs manual review or regeneration); 010 removes the 2 duplicate questions (120 to 118); 011 adds a BEFORE UPDATE trigger clamping max_streak to GREATEST(old, new) so a streak never decreases (root cause of the "1 after a 6-streak" bug: the merge-duplicates upsert was clobbering the stored max).
OPUS BROWSER AUDIT (2026-07-17): 63/100. Biggest gaps: social sharing 2/10, accessibility 5/10. Known data gaps: image_url is now POPULATED for all 118 (realm_stats 118/118, was NULL; 013 realm art applied); the resulting hero+question double image was FIXED by T1 (aea73ff removed the question-slot art, the hero banner provides realm context); correct_idx STILL ships to the client (NOT stripped), so the leaderboard remains cheatable. SECURITY DECISION (Mahil, 2026-07-18, recorded by T1 in comms and treated as authoritative): checkAnswer stays HELD, NOT wired in QuizScreen/DailyAether; the correct_idx strip stays BLOCKED; the real fix (joint T1+T2 server-side session scoring, server one-shot token + authoritative grade) is DEFERRED until scoped together. Honor-system is accepted for the friend-group threat model, which itself implies checkAnswer is not needed. CONFLICT FLAG: the T2 Session-10 boot brief said the opposite ("T1 is wiring checkAnswer this session; strip once both wired"); that brief is STALE and the newer in-comms decision wins, so nothing was wired or stripped this session. A throttle is NOT the green light to wire (memory aethermind-checkanswer-wiring-held). IF the strip is ever revived: the store dependency is that answerQuestion grades on q.correct_index, so it needs an optional serverResult {isCorrect, correctIdx} param first, and DailyAether must move to checkAnswer, all in one coordinated change. Not before.

DEPLOY NOTE: auto-deploy via the Vercel GitHub integration is ACTIVE (connected 2026-07-17), so every push to main deploys to production and a manual vercel --prod is no longer required. Rate limiting (ae2b322 + fd8efab: 50/hr per IP, hardened with x-real-ip key, bounded map, sanitized log) is api-only, so it cannot be confirmed from the client and the Vercel log / deploy APIs return 403 here. CAVEAT: 50/hr can pinch a heavy shared-NAT session; raise it (return e.n > 50 in api/save-score.js) if 429s appear.

## ANIMATION + DESIGN UPGRADE (SHIPPED 2026-07-16/17, in the live bundle)
The arcade-feel upgrade below is implemented and deployed. Kept here as the design token reference:

FONT SYSTEM:
Primary (questions answers explanations): Cinzel, Times New Roman, Georgia, serif
Accent (scores XP nav badges): Press Start 2P, monospace
Quote sizes: question 22px / options 17px / explanation 16px / insight 15px
Line heights: question 1.8 / options 1.7 / explanation 1.85

ANIMATION TOKENS (T1 implementing):
correctFlash — green double-pixel border glow on correct answer button
  20% peak: box-shadow 0 0 0 2px #39FF14, 0 0 0 4px #04040A, 0 0 0 6px #39FF14
wrongShake — horizontal shake on wrong answer (6px oscillation, 0.4s)
xpFloat — "+XP" Press Start 2P text rises from correct answer, fades at -60px
xpTick — XP counter in nav ticks from old value to new value over 600ms
fadeInUp — explanation and insight reveal with 12px upward slide (0.4s/0.6s staggered)
pixelScanline — CRT scanline overlay on correct answer state (subtle)

COLOR UPDATES:
Correct: #39FF14 (neon green — upgraded from #4ADE80 for more arcade feel)
Correct glow: rgba(57,255,20,0.4) for box-shadow
Wrong: #FF3131 (kept)
XP pop text color: #39FF14 with text-shadow glow

QUESTION CONTAINER:
background: rgba(232,217,192,0.03)
border: 1px solid rgba(212,175,55,0.08)
backdropFilter: blur(2px)

## CRITICAL LESSON — SUPABASE RLS vs GRANT (never confuse these again)
RLS (Row Level Security) filters which ROWS are returned AFTER privilege check.
GRANT controls whether the role can access the TABLE at all.
You MUST have GRANT first, then RLS. RLS without GRANT = 401 every time.

## CRITICAL LESSON — SERVERLESS ENV VARS
VITE_ prefixed vars are Vite BUILD-TIME injections. They are NOT available in Vercel serverless functions at runtime.
Serverless functions must use process.env.SUPABASE_URL (no VITE_ prefix).
Always add non-VITE_ versions of any URL needed by api/ functions.

## SECURITY STATE (post-004)
- am_questions: anon has SELECT (all columns) + UPDATE (times_shown, times_correct only)
- am_scores: anon has SELECT only
- All leaderboard writes go through /api/save-score (service-role key, server-side only)
- SUPABASE_SERVICE_KEY: in Vercel production env (confirmed)

## TECH STACK
React 19 + Vite · Tailwind v4 · Zustand + Immer (persist: am-game-v1) · Supabase (realtime leaderboard + question bank) · Vercel (serverless + hosting) · picsum.photos (free question images)

## SUPABASE
URL: https://gsogycwtllthrenqaxlh.supabase.co
Org: AetherMind (FREE tier · ap-south-1 · NANO compute)
Tables: am_scores (leaderboard) · am_questions (120 questions)
Storage: question-images bucket (public) · realms/ folder for GPT pixel art images
RLS: SELECT public on am_questions · SELECT public on am_scores · writes via service-role API only

## 12 REALMS (realm_id 1-12)
1 Ancient Civilizations · 2 Hermetic Wisdom · 3 Gnosticism · 4 Eastern Traditions
5 Consciousness · 6 Psychology · 7 Quantum Physics · 8 Esoteric Science
9 Comparative Religion · 10 Hidden History · 11 Symbolism · 12 Ethics & Wisdom
Realm images: Supabase Storage question-images/realms/realm-NN-name.png
GPT pixel art style: isometric 1080x1080 dark navy background gold+teal accents

## AM_QUESTIONS SCHEMA
id (uuid) · realm_id (int) · realm_name (text) · level_min (int) · level_max (int)
question (text) · options (jsonb array[4]) · correct_idx (int 0-3)
knowledge_type: empirical|historical|philosophical|esoteric|channeled|speculative
explanation (text) · insight (text) · cross_refs (jsonb) · image_search (text)
image_url (text) · game_modes (text[]) · tags (text[]) · times_shown (int) · times_correct (int)

## KEY SOURCE FILES
src/App.jsx — screen router · Supabase question fetch · adaptive selection
src/lib/supabase.js — fetchQuestionsForRealm() · saveScore() calls /api/save-score
src/lib/questionSelector.js — selectQuestion() · formatQuestion() · getImageUrl() (picsum)
src/lib/constants.js — REALMS array (with imageUrl) · GAME_MODES · KNOWLEDGE_TYPES
src/store/useGameStore.js — Zustand: gameMode · livesRemaining · gauntletCount · seenQuestions · timeoutQuestion()
src/components/ — HomeScreen · ModeSelect · RealmSelect · QuizScreen · GameOver · GauntletComplete · CharacterSheet · WisdomVault · Leaderboard
api/save-score.js — Vercel serverless · service-role writes · sanity validation
supabase/migrations/ — 001 through 004_security_lockdown.sql
supabase/seeds/ — 001_questions.sql (120 questions)

## LANE SYSTEM — NON-NEGOTIABLE
T1 owns: src/components/ · src/pages/ · src/App.jsx · src/index.css
T2 owns: src/lib/ · src/store/ · supabase/ · api/ · scripts/
Cross-lane touch = -25 pts. Both terminals git pull before working.

## GAME MODES (all live)
classic — adaptive difficulty · unlimited time · 1x XP
speed — 30s countdown · auto-wrong on timeout · 0 XP on timeout · 1.5x XP on correct
survival — 3 hearts · loseLife() on wrong · GameOver at 0 hearts · 2x XP
gauntlet — Q1-10 progress bar · incrementGauntlet() on correct · GauntletComplete at 10 · 2.5x XP
blind — knowledge badge hidden · purple question tint · 3x XP

## DESIGN TOKENS (T1 — updated)
Gold:    #D4AF37    Purple:  #7B2FBE    Text:    #E8D9C0
BG:      #04040A    Correct: #39FF14    Wrong:   #FF3131    XP: #F59E0B
Teal:    #00B4D8    Muted:   rgba(232,217,192,0.4)
Font-question: Cinzel, Times New Roman, Georgia, serif
Font-pixel:    Press Start 2P, monospace
Zero em dashes anywhere in code, SQL, content, or UI — use comma or colon

## CODEWORD SYSTEM
SURVEY! = Full project scan · read all boot files · check DB · report state · always first
FORGE!  = Execute next task in queue at maximum Opus 4.8 quality
XRAY!   = Brutal evidence-based audit · /200 · path to fix
NIGHTSAVE! = Mandatory session close · build · commit · push · lesson written
REFORGE! = Remaster boot file with all new context before next session

## BOOT COMMANDS (fully automated)
T1 terminal: /t1   (reads FORGE_T1.md · runs SURVEY! · awaits FORGE!)
T2 terminal: /t2   (reads FORGE_T2.md · runs SURVEY! · awaits FORGE!)

## MCP LANDSCAPE (Claude Code)
plugin:vercel:vercel — 24 tools · deployment · env vars · logs
plugin:supabase:supabase — PAT auth via SUPABASE_ACCESS_TOKEN env var
plugin:playwright:playwright — 24 tools · live site testing
github — 26 tools · push · PR · history
context7 — 2 tools · React/Supabase docs

## PRE-COMMIT RITUAL (both lanes)
1. Evidence: screenshot or DB query confirming the change works
2. Lane check: git diff --cached --name-only — no cross-lane files
3. Em dash check: grep -rn " — " src/ — must be 0 results
4. Build gate: npm run build 2>&1 | tail -3 — 0 errors
5. Truth: commit message matches what actually changed

## NIGHTSAVE CLOSE (both lanes)
npm run build 2>&1 | tail -3
git log --oneline -5
Write lesson to .claude/comms/today.md
git add [lane-specific files only — never -A]
git commit -m "feat(TX): [description]"
git push origin main
