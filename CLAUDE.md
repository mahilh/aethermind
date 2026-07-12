# AetherMind — Master Project Brain
# Auto-read by Claude Code Opus 4.8 at every session start
# github.com/mahilh/aethermind · aethermind-five.vercel.app

## WHAT IS AETHERMIND
A live real-time esoteric consciousness trivia RPG. Players pick from 12 realms of esoteric knowledge, answer adaptive questions pulled from a 120-question Supabase database, earn XP, level up, and compete on a live global leaderboard. Free to play — zero API cost per question. Built for a friend group in Karachi, deploying to Austin TX July 2026.

## LIVE STATE (XRAY! 2026-07-12)
- Site: aethermind-five.vercel.app — LIVE, UI renders correctly
- DB: 120 questions in Supabase · 12 realms · 10 each · CONFIRMED
- CRITICAL BUG: Supabase 401 on am_questions — questions NOT loading in production
- ROOT CAUSE: vercel --prod was never run after adding VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel
- T2 FIX: cd ~/Desktop/aethermind && vercel --prod (IMMEDIATE — do this before anything else)

## TECH STACK
React 19 + Vite · Tailwind v4 · Zustand + Immer (persist: am-game-v1) · Supabase (realtime leaderboard + question bank) · Vercel (serverless + hosting) · Unsplash Source API (free images per question)

## SUPABASE
URL: https://gsogycwtllthrenqaxlh.supabase.co
Org: AetherMind (FREE tier · ap-south-1 · NANO compute)
Tables: am_scores (leaderboard) · am_questions (120 questions)
RLS: public read enabled on both tables

## 12 REALMS (realm_id 1-12)
1 Ancient Civilizations · 2 Hermetic Wisdom · 3 Gnosticism · 4 Eastern Traditions
5 Consciousness · 6 Psychology · 7 Quantum Physics · 8 Esoteric Science
9 Comparative Religion · 10 Hidden History · 11 Symbolism · 12 Ethics & Wisdom

## AM_QUESTIONS SCHEMA
id (uuid) · realm_id (int) · realm_name (text) · level_min (int) · level_max (int)
question (text) · options (jsonb array[4]) · correct_idx (int 0-3)
knowledge_type: empirical|historical|philosophical|esoteric|channeled|speculative
explanation (text) · insight (text) · cross_refs (jsonb) · image_search (text)
image_url (text) · game_modes (text[]) · tags (text[]) · times_shown (int) · times_correct (int)

## KEY SOURCE FILES
src/App.jsx — screen router · Supabase question fetch · adaptive selection
src/lib/supabase.js — fetchQuestionsForRealm() · fetchMixedQuestion() · saveScore() · getLeaderboard()
src/lib/questionSelector.js — selectQuestion() · formatQuestion() · getImageUrl() (Unsplash)
src/lib/constants.js — REALMS array · GAME_MODES · KNOWLEDGE_TYPES · ATTRS
src/store/useGameStore.js — Zustand: playerName · stats · screen · realm · question · loading
src/components/ — HomeScreen · RealmSelect · QuizScreen · CharacterSheet · WisdomVault · Leaderboard
api/generate-question.js — Vercel serverless proxy for Anthropic API (currently bypassed — free DB mode)
supabase/migrations/ — 001_aethermind.sql · 002_am_questions.sql
supabase/seeds/ — 001_questions.sql (120 questions)

## LANE SYSTEM — NON-NEGOTIABLE
T1 owns: src/components/ · src/pages/ · src/App.jsx · src/index.css
T2 owns: src/lib/ · src/store/ · supabase/ · api/ · scripts/
Cross-lane touch = -25 pts. Both terminals git pull before working.

## GAME MODES
classic · speed (30s timer) · survival (3 lives) · gauntlet (10-question streak) · blind (no knowledge badge)
Game mode UI: T1 task. Game mode store state: T2 task.

## DESIGN TOKENS (T1 — never invent new values)
Gold #D4AF37 · Purple #7B2FBE · Text #E8D9C0 · BG #050510
Correct #4ADE80 · Wrong #F87171 · XP #FCD34D · Muted rgba(232,217,192,0.4)
Font: EB Garamond, Georgia, serif — always

## CODEWORD SYSTEM
SURVEY! = Full project scan · read all boot files · check DB · report state · always first
FORGE!  = Execute next task in queue at maximum Opus 4.8 quality
XRAY!   = Brutal evidence-based audit · /200 · path to fix
NIGHTSAVE! = Mandatory session close · build · commit · push · lesson written

## BOOT COMMANDS (fully automated)
T1 terminal: /t1   (reads FORGE_T1.md · runs SURVEY! · awaits FORGE!)
T2 terminal: /t2   (reads FORGE_T2.md · runs SURVEY! · awaits FORGE!)

## MCP AUTHENTICATION
If Claude Code shows "1 MCP server needs authentication": run /mcp to configure
The GitHub MCP allows direct repo operations from terminal

## PRE-COMMIT RITUAL (both lanes)
1. Evidence: screenshot or DB query confirming the change works
2. Lane check: git diff --cached --name-only → no cross-lane files
3. Em dash check: grep -rn " — " src/ → 0 results required
4. Build gate: npm run build 2>&1 | tail -3 → 0 errors
5. Truth: commit message matches what actually changed

## NIGHTSAVE CLOSE (both lanes)
npm run build 2>&1 | tail -3
git log --oneline -5
Write lesson to .claude/comms/today.md
git add [lane-specific files only]
git commit -m "feat(TX): [description]"
git push origin main
