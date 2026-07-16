# OVERDRIVE! — AetherMind Autonomous Audit + Self-Improvement System
# Slash command: /overdrive
# Triggers: OVERDRIVE! typed in any terminal
# Version: 1.0 · Self-improving (appends findings on every run)

---

You are running OVERDRIVE! — the autonomous full-system audit, self-improvement, and deployment protocol for AetherMind.

This is not a survey. This is not a FORGE. This is both simultaneously, plus a live site audit, plus a security scan, plus a self-updating skill system, all executed without stopping.

DO NOT ASK FOR CONFIRMATION ON ANYTHING. Execute every step. Report as you go.

═══════════════════════════════════════════════════
PHASE 0 — FULL BOOT (parallel reads)
═══════════════════════════════════════════════════

Read all of these simultaneously and hold them in context:
cat CLAUDE.md
cat FORGE_T1.md
cat FORGE_T2.md
cat INTEGRATION_PLAN.md
cat .claude/commands/overdrive.md
cat .claude/comms/today.md 2>/dev/null || echo "No comms"
git log --oneline -15
git status --short
npm run build 2>&1 | tail -5

State your complete understanding of what has been built, what is live, and what is not before proceeding.

═══════════════════════════════════════════════════
PHASE 1 — LIVE SITE AUDIT (harshest rating system ever)
═══════════════════════════════════════════════════

Use playwright MCP if available. Otherwise use curl for all checks.
Score each dimension /100. Deduct points for every flaw found. Total /1000.

DIMENSION 1 — FONT INTEGRITY /100
Check: Cinzel loads in production, Press Start 2P loads, EB Garamond loads
Verify: document.fonts.check('1em Cinzel') returns true
Verify: no font FOUT (flash of unstyled text) on page load
Deduct 30 if Cinzel not loading. Deduct 20 if Press Start 2P missing. Deduct 5 per font flash evidence.

DIMENSION 2 — EM DASH ELIMINATION /100
Check: curl the live page and search for U+2014 in the rendered DOM text
Check: DB via postgres-aethermind MCP — SELECT count(*) FROM am_questions WHERE explanation LIKE '%' || chr(8212) || '%'
Deduct 10 per em dash found in UI. Deduct 5 per em dash found in DB.
Expected score: 100 (zero violations).

DIMENSION 3 — SECURITY POSTURE /100
Check api/save-score.js: raw fetch with service_role, IP sanitization, bounded map, x-real-ip extraction
Check rate limiting: 50/hr IP cap active
Check DB grants: anon has SELECT only on am_scores, service_role has INSERT/UPDATE/SELECT
Check: no secrets in client bundle (grep for service_role key pattern in dist/)
Deduct 25 if createClient() used instead of raw fetch. Deduct 20 if rate limiting absent.
Deduct 30 if service_role key in client bundle. Deduct 15 if anon has write access.

DIMENSION 4 — ANIMATION SYSTEM /100
Check: correctFlash keyframe present and wired to correct answer buttons
Check: wrongShake wired to wrong answer buttons
Check: xpFloat overlay appears on correct answer
Check: levelUpScale + levelUpFade + goldPulseRing all present
Check: fadeInUp applied to explanation and insight reveals
Deduct 15 per missing keyframe. Deduct 20 if animations not wired to actual user actions.

DIMENSION 5 — GAME LOGIC INTEGRITY /100
Check wrong-answer XP: answer wrong, read store XP before and after — must be identical
Check Speed Oracle 0-XP: let timer expire, confirm XP unchanged
Check Gauntlet dedup: play 10 questions, confirm zero repeats
Check Survival hearts: answer wrong, confirm hearts decrease
Deduct 30 if wrong answer awards XP. Deduct 25 if Speed Oracle timeout awards XP. Deduct 20 if Gauntlet repeats.

DIMENSION 6 — VISUAL COMPLETENESS /100
Check: 12/12 realm card backgrounds show Supabase pixel art images
Check: QuizScreen hero banner shows realm image with gradient overlay
Check: TODAY badge visible on one realm card
Check: Leaderboard shows ALL TIME / THIS WEEK tabs
Check: max_streak badge visible on leaderboard entries with streak > 0
Deduct 10 per missing realm image. Deduct 20 if hero banner absent. Deduct 15 if TODAY badge missing.

DIMENSION 7 — LEADERBOARD PIPELINE /100
Check: POST to /api/save-score returns {"ok":true}
Check: Row appears in am_scores with correct xp, player_name, max_streak
Check: Weekly filter returns only last 7 days results
Check: max_streak column exists and populates
Deduct 50 if save-score not {"ok":true}. Deduct 20 if max_streak missing from schema.

DIMENSION 8 — PERFORMANCE /100
Check: page load time (measure Date.now() before and after DOMContentLoaded)
Check: no console errors on any page
Check: images load (no broken img tags)
Check: build size reasonable (check dist/ folder)
Deduct 10 per console error. Deduct 20 per broken image. Deduct 15 if build > 2MB.

DIMENSION 9 — ACCESSIBILITY + SEO /100
Check: meta description present and relevant
Check: viewport meta tag present
Check: title tag correct (AetherMind ◉)
Check: all interactive elements keyboard navigable
Check: no Press Start 2P text below 9px actual rendered size
Deduct 10 per missing meta tag. Deduct 5 per sub-9px text found.

DIMENSION 10 — CODE QUALITY /100
Check lane discipline: T1 never touched lib/ store/ api/
Check: zero em dashes in source files (grep all src/)
Check: build produces 0 errors 0 warnings
Check: no console.log left in production code (grep src/ for console.log)
Deduct 25 per cross-lane violation found. Deduct 10 per em dash in source. Deduct 5 per console.log found.

═══════════════════════════════════════════════════
PHASE 2 — BUG HUNT (automated, no mercy)
═══════════════════════════════════════════════════

Run all of these checks and report every finding:

grep -rn "—" src/ --include="*.jsx" --include="*.js" --include="*.css" --include="*.md" | grep -v "node_modules" | grep -v ".git"
Report: "EM DASH FOUND: [file] line [N]: [context]" for each finding, or "CLEAN: 0 em dashes in source"

grep -rn "console.log" src/ --include="*.jsx" --include="*.js" | grep -v "node_modules"
Report each console.log found with file and line number.

grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.jsx" --include="*.js"
Report all technical debt markers.

cat src/store/useGameStore.js | grep -n -A 3 "wrong\|Wrong\|incorrect\|answerQuestion" | head -30
Report if wrong answer awards XP > 0.

cat api/save-score.js | grep -n "createClient\|supabase\|fetch("
Report: "USING createClient: LINE N" (bad) or "USING raw fetch: LINE N" (good)

du -sh dist/ 2>/dev/null
Report bundle size.

═══════════════════════════════════════════════════
PHASE 3 — AUTO-FIX (fix everything found in Phase 2)
═══════════════════════════════════════════════════

For EVERY issue found in Phase 2 that is in your lane:
1. Fix it immediately without asking
2. Run 5-lens
3. Commit with exact message: "fix(OVERDRIVE): [description of what was broken and what was fixed]"
4. Push immediately

Em dashes in source: replace with comma or colon in place
Console.logs in production code: remove them
Wrong-answer XP > 0 (T2 lane): write to today.md requesting fix, do NOT touch useGameStore.js
createClient in api/save-score.js (T2 lane): write to today.md, do NOT touch

═══════════════════════════════════════════════════
PHASE 4 — SELF-IMPROVEMENT PROTOCOL
═══════════════════════════════════════════════════

After the audit is complete, update these files with everything you learned:

UPDATE CLAUDE.md:
- Update the LIVE STATE section with today's exact audit date and score
- Add any new lessons learned to the BURNED-IN LESSONS section
- Update the SECURITY STATE if anything changed

UPDATE FORGE_T1.md (T1 running OVERDRIVE):
- Add any new bugs found to Session History as "OVERDRIVE found: [bug]"
- Add any new patterns discovered to BURNED-IN LESSONS

UPDATE FORGE_T2.md (T2 running OVERDRIVE):
- Same as above for T2 lane findings

UPDATE this file (.claude/commands/overdrive.md):
- Add timestamp and score from this run to the OVERDRIVE HISTORY section at the bottom
- Add any new checks that would have caught bugs that were missed
- The skill is always improving itself

COMMIT ALL UPDATES:
git add CLAUDE.md FORGE_T1.md FORGE_T2.md .claude/commands/overdrive.md
git commit -m "docs(OVERDRIVE): self-improvement update from $(date +%Y-%m-%d) — score [X]/1000, [N] issues fixed"
git push origin main

═══════════════════════════════════════════════════
PHASE 5 — DEPLOY + FINAL VERIFY
═══════════════════════════════════════════════════

After all fixes are committed:
cd ~/Desktop/aethermind && git pull && vercel --prod (if terminal has access)
OR tell the user the exact deploy command

After deploy (or if already deployed):
curl -s -X POST https://aethermind-five.vercel.app/api/save-score \
  -H "Content-Type: application/json" \
  -d '{"playerName":"overdrive-verify","stats":{"xp":50,"level":2,"correct":20,"answered":25,"realm":{},"attrs":{}},"maxStreak":8}' | head -3
Expected: {"ok":true}

If postgres-aethermind MCP available:
Use it to run: SELECT player_name, xp, max_streak FROM am_scores ORDER BY updated_at DESC LIMIT 3;
Confirm overdrive-verify row appears.

═══════════════════════════════════════════════════
OVERDRIVE REPORT FORMAT
═══════════════════════════════════════════════════

End the OVERDRIVE! session with this exact report format:

OVERDRIVE! COMPLETE — [DATE] [TIME UTC]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCORES:
  Font Integrity:      [X]/100
  Em Dash Elimination: [X]/100
  Security Posture:    [X]/100
  Animation System:    [X]/100
  Game Logic:          [X]/100
  Visual Completeness: [X]/100
  Leaderboard:         [X]/100
  Performance:         [X]/100
  Accessibility/SEO:   [X]/100
  Code Quality:        [X]/100
  ─────────────────────────────
  TOTAL: [X]/1000

BUGS FOUND: [N]
  [list each bug with file and severity]

BUGS FIXED THIS RUN: [N]
  [list each fix with commit hash]

OPEN (cross-lane or needs user action): [list]

SELF-IMPROVEMENTS MADE TO OVERDRIVE.MD: [N]
  [describe what was added]

NEXT OVERDRIVE! recommended: [timeframe]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

═══════════════════════════════════════════════════
OVERDRIVE HISTORY (appended by each run)
═══════════════════════════════════════════════════

[Run 1 — 2026-07-17] — Score pending. First OVERDRIVE! run. Establishing baseline.

