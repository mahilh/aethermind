# AetherMind — Master Integration Plan
# Written by Claude Sonnet 4.6 + Opus 4.8 browser audit · 2026-07-16
# Read by T1 and T2 at session start
# Source of truth for all pending improvements

## WHAT THIS IS
Sequenced implementation plan to take AetherMind from 185/200 to 200/200.
Each phase is independent — can be executed in parallel by T1 and T2.
T1 owns all UI phases. T2 owns all engine/DB phases.

## LIVE STATE (verified by Playwright 2026-07-16)
URL: https://aethermind-five.vercel.app
- ModeSelect with 5 modes: LIVE (Classic Quest, Speed Oracle, Survival Run, Realm Gauntlet, Blind Seer)
- Speed Oracle 30s countdown: LIVE (confirmed 0:30 to 0:00, auto-advances)
- Survival GameOver: LIVE
- Gauntlet GauntletComplete: LIVE
- Blind Seer (hidden badge): LIVE
- Images: LIVE via picsum.photos (Unsplash retired)
- Questions: LIVE from Supabase DB (120 questions, 12 realms)
- 004 security lockdown: APPLIED to DB
- api/save-score: DEPLOYED but still failing (see T2 Phase 1)
- Em dashes: STILL IN DB question text (see T2 Phase 2)
- Font: EB Garamond (needs Cinzel upgrade — see T1 Phase 1)
- Animations: NONE (game feels static — see T1 Phases 2-4)

---

## T2 PHASES (Engine lane: src/lib/ src/store/ api/ supabase/)

### T2 PHASE 1 — Diagnose and fix api/save-score (CRITICAL, do first)

api/save-score still returns {"error":"Failed to save score"} after key update.
The new key IS passing T2's fail-fast guard (would return "write key lacks privileges" if anon).
The Supabase upsert itself is failing. Pull the real error from Vercel runtime logs.

STEP 1: Get runtime logs
vercel logs https://aethermind-five.vercel.app --since=30m --filter=save-score
OR use Vercel MCP: plugin:vercel:vercel — get_runtime_logs tool

Look for: error.code, error.message, error.hint from the Supabase client
The actual Postgres error will reveal the true cause.

STEP 2: Most likely causes (check in this order)
A. The SUPABASE_URL already in Vercel is the wrong format or project — check it matches https://gsogycwtllthrenqaxlh.supabase.co exactly
B. The service_role key was still the anon key — check: if the error says "role: anon" in the JWT claim, wrong key
C. The upsert has a column mismatch — updated_at column may not exist in am_scores

STEP 3: Check am_scores schema to verify columns
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'am_scores' ORDER BY ordinal_position;
Compare against what api/save-score.js is trying to upsert.

STEP 4: If SUPABASE_URL is wrong
vercel env rm SUPABASE_URL production
vercel env add SUPABASE_URL production
Value: https://gsogycwtllthrenqaxlh.supabase.co (exact, no trailing slash)
Then: vercel --prod and retest

STEP 5: After fix confirmed
curl -s -X POST https://aethermind-five.vercel.app/api/save-score \
  -H "Content-Type: application/json" \
  -d '{"playerName":"t2-verified","stats":{"xp":10,"level":1,"correct":5,"answered":8,"realm":{},"attrs":{}}}' | head -3
Expected: {"ok":true}
Then: SELECT player_name, xp FROM am_scores ORDER BY created_at DESC LIMIT 3;

### T2 PHASE 2 — Em-dash purge from DB (do after Phase 1)

SELECT count(*) FROM am_questions
WHERE explanation LIKE '%' || chr(8212) || '%'
   OR question    LIKE '%' || chr(8212) || '%'
   OR options::text LIKE '%' || chr(8212) || '%';

If count > 0 run:
UPDATE am_questions SET
  question    = REPLACE(question,      chr(8212), ','),
  explanation = REPLACE(explanation,   chr(8212), ' '),
  insight     = REPLACE(insight,       chr(8212), ' '),
  options     = REPLACE(options::text, chr(8212), ',')::jsonb
WHERE explanation LIKE '%' || chr(8212) || '%'
   OR question    LIKE '%' || chr(8212) || '%'
   OR insight     LIKE '%' || chr(8212) || '%'
   OR options::text LIKE '%' || chr(8212) || '%';

Verify count = 0.

### T2 PHASE 3 — Realm image URLs in constants.js (T1 needs this)

cat src/lib/constants.js | grep imageUrl | wc -l
Should return 12 (one per realm). If missing, add to each REALM object:
const STORAGE = 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realms'
imageUrl: STORAGE + '/realm-NN-realm-name.png'

Commit, push, notify T1 via today.md.

### T2 PHASE 4 — Score rate limiting in api/save-score.js

After save-score is working, add IP rate limiting (10 per hour):
const rateLimitMap = new Map()
function isRateLimited(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip) || { count: 0, resetTime: now + 3600000 }
  if (now > entry.resetTime) { entry.count = 0; entry.resetTime = now + 3600000 }
  entry.count++
  rateLimitMap.set(ip, entry)
  return entry.count > 10
}
Add at start of handler: const ip = req.headers['x-forwarded-for'] || 'unknown'; if (isRateLimited(ip)) return res.status(429).json({error: 'Rate limit exceeded'})

---

## T1 PHASES (UI lane: src/components/ src/App.jsx src/index.css)

### T1 PHASE 1 — Cinzel Font Upgrade (do first — highest visual impact)

STEP 1: src/index.css — add at top
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Press+Start+2P&display=swap');

:root {
  --font-question: 'Cinzel', 'Times New Roman', Georgia, serif;
  --font-pixel: 'Press Start 2P', monospace;
  --font-wisdom: 'Cinzel', Georgia, serif;
}

STEP 2: QuizScreen.jsx — apply font tokens
Question text: font-family var(--font-question), 22px, line-height 1.8, letter-spacing 0.02em
Option button text: font-family var(--font-question), 17px, line-height 1.7
Explanation text: font-family var(--font-wisdom), 16px, line-height 1.85, font-style italic
Insight quote: font-family var(--font-wisdom), 15px, font-style italic, color #D4AF37

STEP 3: ModeSelect.jsx
Mode names (Classic Quest etc): font-family var(--font-question)
XP badges (1x XP): keep Press Start 2P
CHOOSE YOUR MODE title: keep Press Start 2P

STEP 4: RealmSelect.jsx
Realm names: font-family var(--font-question)
Realm descriptions: font-family var(--font-wisdom), 13px
CHOOSE YOUR REALM: keep Press Start 2P

WHY CINZEL: Roman inscriptional capital letterforms, same DNA as Times New Roman but optimised for screen. The Cinzel (ancient wisdom) vs Press Start 2P (arcade score) contrast IS the AetherMind identity.

### T1 PHASE 2 — Answer Animations (highest game-feel impact)

STEP 1: src/index.css — add keyframes

@keyframes correctFlash {
  0%   { background: rgba(57,255,20,0.0);  box-shadow: none; }
  20%  { background: rgba(57,255,20,0.25); box-shadow: 0 0 0 2px #39FF14, 0 0 0 4px #04040A, 0 0 0 6px #39FF14, 0 0 20px rgba(57,255,20,0.4); }
  50%  { background: rgba(57,255,20,0.12); box-shadow: 0 0 0 2px #39FF14, 0 0 0 4px #04040A, 0 0 0 6px #39FF14; }
  80%  { background: rgba(57,255,20,0.06); box-shadow: 0 0 0 1px #39FF14, 0 0 12px rgba(57,255,20,0.2); }
  100% { background: rgba(57,255,20,0.04); box-shadow: 0 0 0 1px #39FF14; }
}

@keyframes wrongShake {
  0%   { transform: translateX(0);    background: rgba(255,49,49,0.0); }
  15%  { transform: translateX(-7px); background: rgba(255,49,49,0.2); }
  30%  { transform: translateX(7px);  background: rgba(255,49,49,0.15); }
  45%  { transform: translateX(-5px); background: rgba(255,49,49,0.1); }
  60%  { transform: translateX(5px);  background: rgba(255,49,49,0.08); }
  80%  { transform: translateX(-2px); }
  100% { transform: translateX(0);    background: rgba(255,49,49,0.03); }
}

@keyframes xpFloat {
  0%   { opacity: 1; transform: translateY(0px) scale(1); }
  20%  { opacity: 1; transform: translateY(-15px) scale(1.15); }
  60%  { opacity: 0.8; transform: translateY(-40px) scale(1.05); }
  100% { opacity: 0; transform: translateY(-65px) scale(0.85); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pixelGlow {
  0%, 100% { text-shadow: 0 0 8px #39FF14, 0 0 16px rgba(57,255,20,0.5); }
  50%  { text-shadow: 0 0 16px #39FF14, 0 0 32px rgba(57,255,20,0.7), 0 0 48px rgba(57,255,20,0.3); }
}

STEP 2: QuizScreen.jsx — wire animations

Add state at top of component:
  const [showXpPop, setShowXpPop] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)

When correct answer clicked (before calling onAnswer):
  setXpEarned(15)
  setShowXpPop(true)
  setTimeout(() => setShowXpPop(false), 1500)

XP pop overlay — inside quiz container, position absolute:
  {showXpPop && (
    <div style={{
      position: 'absolute', top: '35%', left: '50%',
      transform: 'translateX(-50%)', zIndex: 200,
      pointerEvents: 'none',
      animation: 'xpFloat 1.5s ease-out forwards',
    }}>
      <span style={{
        fontFamily: 'Press Start 2P, monospace',
        fontSize: '20px', color: '#39FF14',
        animation: 'pixelGlow 0.8s ease-in-out',
        whiteSpace: 'nowrap', display: 'block',
      }}>+{xpEarned} XP</span>
    </div>
  )}

Apply to answer buttons (inline style based on revealed state):
  Correct: animation: isThisCorrect && revealed ? 'correctFlash 1s ease-out forwards' : undefined
  Wrong (selected): animation: isSelectedWrong && revealed ? 'wrongShake 0.5s ease-out' : undefined

Stagger explanation reveal:
  Explanation div: style={{ animation: 'fadeInUp 0.4s ease-out' }}
  Insight div: style={{ animation: 'fadeInUp 0.6s ease-out 0.15s both' }}
  Next Question button: style={{ animation: 'fadeInUp 0.8s ease-out 0.3s both' }}

### T1 PHASE 3 — XP Counter Arcade Tick

In the component that shows XP in the nav (HomeScreen or nav bar):

const [displayXp, setDisplayXp] = useState(stats.xp)
const prevXpRef = useRef(stats.xp)
useEffect(() => {
  if (stats.xp === prevXpRef.current) return
  const start = prevXpRef.current
  const end = stats.xp
  const diff = end - start
  const steps = Math.min(Math.abs(diff), 20)
  const interval = Math.floor(600 / steps)
  let step = 0
  const timer = setInterval(() => {
    step++
    const current = Math.round(start + (diff * step / steps))
    if (step >= steps) {
      setDisplayXp(end)
      prevXpRef.current = end
      clearInterval(timer)
    } else {
      setDisplayXp(current)
    }
  }, interval)
  return () => clearInterval(timer)
}, [stats.xp])
Display displayXp in the XP number element.

### T1 PHASE 4 — Question Container Polish

QuizScreen.jsx question container div, add to existing styles:
  background: 'rgba(232,217,192,0.03)',
  border: '1px solid rgba(212,175,55,0.08)',
  borderRadius: '10px',
  padding: '20px 22px',

### T1 PHASE 5 — Realm Image Backgrounds (after T2 Phase 3 confirms imageUrls)

git pull to get T2's imageUrl additions.
In RealmSelect.jsx each realm card, add inside the card:
  {realm.imageUrl && (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: 'url(' + realm.imageUrl + ')',
      backgroundSize: 'cover', backgroundPosition: 'center',
      borderRadius: 'inherit', opacity: 0.12,
    }} onError={(e) => { e.target.style.display = 'none' }} />
  )}
  <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,4,10,0.78)', borderRadius: 'inherit' }} />
Set position relative and zIndex 1 on all existing card content.

### T1 PHASE 6 — QuizScreen Realm Hero Banner

Above the stats row in QuizScreen.jsx:
  <div style={{
    width: '100%', height: '120px', borderRadius: '10px',
    overflow: 'hidden', marginBottom: '12px', position: 'relative',
    backgroundImage: realm?.imageUrl ? 'url(' + realm.imageUrl + ')' : 'none',
    backgroundSize: 'cover', backgroundPosition: 'center',
    background: realm?.imageUrl ? undefined : 'linear-gradient(to bottom, #0A0A1A, #04040A)',
  }}>
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(4,4,10,0.25), rgba(4,4,10,0.85))' }} />
    <span style={{
      position: 'absolute', bottom: '10px', left: '14px',
      fontFamily: 'Press Start 2P, monospace',
      fontSize: '7px', color: '#D4AF37', letterSpacing: '2px',
    }}>{realm?.name?.toUpperCase()}</span>
  </div>

---

## COMMIT DISCIPLINE
Both lanes: commit each phase separately for clean rollback capability.
Never batch multiple phases into one commit.
5-lens ritual before every commit (evidence, lane check, em-dash check, build gate, truth).
Write to .claude/comms/today.md after each phase.
Zero em dashes in any code or content.
