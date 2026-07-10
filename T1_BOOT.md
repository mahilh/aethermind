// AetherMind — Claude Code T1 Boot
// Terminal: Claude Code (claude CLI) · Opus 4.8 · ultracode · effort max
// Lane: src/components/ · src/pages/ · src/App.jsx · src/index.css
// NEVER TOUCH: src/lib/ · src/store/ · supabase/ · api/

# T1 CLAUDE CODE BOOT — UI · COMPONENTS · IMAGES · GAME MODES
# ═══════════════════════════════════════════════════════════════

## HOW TO LAUNCH T1 (Claude Code)
```bash
# Install Claude Code if not installed
npm install -g @anthropic-ai/claude-code

# Launch in the aethermind project directory
cd ~/Desktop/aethermind
claude

# At the prompt, say:
"I am T1. Read CLAUDE.md then T1_BOOT.md before touching any file.
My lane is UI only: src/components/ src/App.jsx src/index.css
I never touch: src/lib/ src/store/ supabase/ api/
Today's tasks: [state your specific task]"
```

## BOOT SEQUENCE (run every Claude Code session)
```bash
git pull --rebase
cat CLAUDE.md | head -60
cat .claude/comms/tomorrow.md 2>/dev/null | tail -30
git log --oneline -5 && git status --short
npm run build 2>&1 | tail -3
```

## T1 CURRENT TASK QUEUE (priority order)

### TASK 1 — Add image display to QuizScreen (IMMEDIATE)
File: src/components/QuizScreen.jsx
Import: import { getImageUrl } from '../lib/questionSelector'

Add image block between knowledge badge and question text:
```jsx
{question.image_search && (
  <div style={{
    width: '100%', height: '200px', borderRadius: '10px',
    overflow: 'hidden', marginBottom: '1rem',
    border: `1px solid ${realm.color}30`,
    background: 'rgba(255,255,255,0.03)',
  }}>
    <img
      src={getImageUrl(question, realm.name)}
      alt={question.question}
      style={{ width:'100%', height:'100%', objectFit:'cover' }}
      onError={(e) => { e.target.style.display='none' }}
    />
  </div>
)}
```

### TASK 2 — Game Mode Selection screen
File: src/components/ModeSelect.jsx (NEW FILE · T1 creates)
Import GAME_MODES from '../lib/constants'

Modes: Classic · Speed Oracle · Survival Run · Realm Gauntlet · Blind Seer
Each mode card shows: icon · name · desc · XP multiplier
Classic: normal · Speed: 1.5x XP for fast answers · Survival: 3 hearts UI
Gauntlet: 10-question streak counter · Blind: no knowledge type badge

### TASK 3 — Speed Oracle timer
File: src/components/QuizScreen.jsx
Add 30-second countdown timer (only shown in Speed mode)
Timer bar: animated width 100%→0% over 30s
When timer hits 0: auto-reveal correct answer, no XP awarded, move to next

### TASK 4 — Survival Run hearts UI
File: src/components/QuizScreen.jsx
Show 3 hearts (❤️❤️❤️) in nav area during Survival mode
Remove one on wrong answer
On 0 hearts: show "Game Over" screen with final score + restart button

### TASK 5 — Gauntlet streak counter
File: src/components/QuizScreen.jsx
Show "Q 3/10" progress bar at top during Gauntlet mode
On 10th question completion: show Gauntlet Complete screen with score

### TASK 6 — Blind Seer mode
File: src/components/QuizScreen.jsx
In Blind mode: hide the knowledge type badge entirely
Add subtle visual cue that this is hard mode (slightly darker background tint)

## DESIGN TOKENS (never invent new colours)
```
Gold:   #D4AF37  · Purple: #7B2FBE  · Text: #E8D9C0
Muted:  rgba(232,217,192,0.4)      · BG: #050510
Correct: #4ADE80 · Wrong: #F87171  · XP: #FCD34D
Font: 'EB Garamond', Georgia, serif
```

## 5-LENS PRE-COMMIT RITUAL
1. Visual evidence: screenshot of rendered component
2. Cross-lane check: `git diff --cached --name-only` — abort if lib/ or store/ appears
3. Em dash check: `grep -r "—" src/components/` — must be 0 results
4. Build gate: `npm run build 2>&1 | tail -3` — 0 errors required
5. Commit message accurate: no lies, no em dashes

## NIGHTSAVE CLOSE (mandatory)
```bash
npm run build 2>&1 | tail -3
git log --oneline -5 && git status --short
cat >> .claude/comms/tomorrow.md << LESSON
[T1] $(date +%Y-%m-%d) — [what shipped] — [rule learned] — Score: /200
For T2: [anything T2 needs to know]
LESSON
git add src/components/[changed files]
git commit -m "feat(T1): [description]"
git push origin main
```
