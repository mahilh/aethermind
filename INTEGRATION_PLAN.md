# AetherMind — Master Integration Plan
# Updated 2026-07-17 — Vercel GitHub auto-deploy ACTIVE
# Every push to main now deploys automatically to aethermind-five.vercel.app
# No manual vercel --prod ever again

## COMPLETED (all live as of 2026-07-17)
- 5 game modes: Classic, Speed Oracle, Survival Run, Realm Gauntlet, Blind Seer
- Cinzel font + Press Start 2P + EB Garamond all loaded
- 20 animation keyframes: correctFlash, wrongShake, xpFloat, fadeInUp, pixelGlow,
  levelUpScale, levelUpFade, goldPulseRing, cardFlip, shimmer, timerPulse,
  heartBreak, heartPulse, enterBob, skeletonPulse, selectedPulse + 4 originals
- Sound engine: Web Audio API chiptune (correct/wrong/level-up/streak)
- WisdomVault: flip reveal, realm badge, RECENT/HARDEST sort, empty state
- CharacterSheet: BEST STREAK display, realm mastery bars, XP shimmer
- Survival hearts: heartBreak on loss, heartPulse at 1 life
- Home: 7-quote rotation, enterBob button animation
- Loading skeleton: 7 gold-pulse placeholders
- Realm hover: scale 1.02 + gold name shift
- Mode card selectedPulse animation
- save-score {"ok":true} LIVE via raw fetch + service_role
- Em dashes: 0 in DB and UI
- max_streak column in am_scores
- wrong-answer XP: 0 (381d29a)
- Leaderboard: weekly/all-time tabs, max_streak badge
- Daily realm TODAY badge + gold glow
- saveScore debounced every 25 XP + maxStreak in payload
- Rate limiting: 50/hr IP (x-real-ip, bounded map, sanitized)
- FastMCP server: 4 tools (check_db, get_leaderboard, check_images, realm_stats)
- Realm images: 12/12 in Supabase Storage, showing in cards and hero banner
- Hero banner: 120px with Supabase pixel art + gradient overlay
- TODAY badge: confirmed live
- Gauntlet dedup: 10 unique questions per run, all retry paths reset

## OPEN (current session)

### T1 ACTIVE:
- Speed Oracle urgency colors (gold-amber-red + pulse + TIME popup)
- Open Graph / Twitter Card meta tags (no social sharing preview)
- Cinzel on body element (cascade fix)
- ARIA labels on nav icons and answer options (accessibility)
- PWA manifest (home screen installability)
- XP multiplier display in xpFloat popup (waiting for T2 mode multipliers)

### T2 ACTIVE:
- Game-mode XP multipliers in answerQuestion (1x/1.5x/2x/2.5x/3x)
- Remove corrupted postgres-aethermind MCP entry (security)
- CLAUDE.md live state update

## OVERDRIVE! SCORE HISTORY
2026-07-17 09:05 UTC: 878/1000
Major gaps: Accessibility/SEO 38/100, Cinzel not loading on HomeScreen, no OG tags

## BUGS QUEUE (found by OVERDRIVE!)
1. Open Graph tags MISSING -- social shares show plain URL, no preview card
2. Cinzel not loading on HomeScreen (only loads on quiz screen)
3. Zero ARIA labels -- screen readers completely blocked
4. No PWA manifest -- can't install as home screen app
5. Home button (73x33px) below 44x44 WCAG touch target
6. No canonical URL -- SEO gap
7. No semantic HTML landmarks (main, nav, header)
8. Mode XP multipliers not applied in answerQuestion

## DEPLOYMENT (AUTOMATED AS OF 2026-07-17)
Every git push to main auto-deploys to aethermind-five.vercel.app
No vercel --prod command ever needed again.
