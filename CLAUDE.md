# AetherMind — Master Project Brain
# Auto-read by Claude Code Opus 4.8 at every session start
# github.com/mahilh/aethermind · aethermind-five.vercel.app

## WHAT IS AETHERMIND
A live real-time esoteric consciousness trivia RPG. Players pick from 12 realms of esoteric knowledge, answer adaptive questions pulled from a 120-question Supabase database, earn XP, level up, and compete on a live global leaderboard. Free to play — zero API cost per question. Built for a friend group in Karachi, deploying to Austin TX July 2026.

## LIVE STATE (XRAY! 2026-07-16 · Playwright CONFIRMED)
- Site: aethermind-five.vercel.app — LIVE, all features deployed
- DB: 120 questions · 12 realms · 10 each · CONFIRMED
- 004 security lockdown: APPLIED · anon has SELECT only on am_scores, column-scoped UPDATE on am_questions
- ModeSelect: LIVE (5 modes working)
- Speed Oracle: LIVE (timer confirmed counting 0:30 to 0:00)
- Survival / Gauntlet / Blind Seer: LIVE
- GameOver / GauntletComplete: LIVE
- Images: LIVE via picsum.photos (Unsplash Source retired, picsum replaces it)
- CRITICAL OPEN: api/save-score returns 500 — SUPABASE_URL not in serverless runtime env
- FIX NEEDED: vercel env add SUPABASE_URL production (value: https://gsogycwtllthrenqaxlh.supabase.co) then vercel --prod
- EM DASHES: still in DB question text — T2 SQL purge pending

## ANIMATION + DESIGN UPGRADE (active session 2026-07-16)
The game is being upgraded to feel like a real arcade game:

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
