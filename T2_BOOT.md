// AetherMind — Claude Code T2 Boot
// Terminal: Claude Code (claude CLI) · Opus 4.8 · ultracode · effort max
// Lane: src/lib/ · src/store/ · supabase/ · api/ · scripts/
// NEVER TOUCH: src/components/ · src/pages/ · src/App.jsx · src/index.css

# T2 CLAUDE CODE BOOT — ENGINE · DB · QUESTIONS · ALGORITHM
# ═══════════════════════════════════════════════════════════════

## HOW TO LAUNCH T2 (Claude Code)
```bash
# Install Claude Code if not installed
npm install -g @anthropic-ai/claude-code

# Launch in the aethermind project directory
cd ~/Desktop/aethermind
claude

# At the prompt, say:
"I am T2. Read CLAUDE.md then T2_BOOT.md before touching any file.
My lane is engine only: src/lib/ src/store/ supabase/ api/ scripts/
I never touch: src/components/ src/pages/ src/App.jsx src/index.css
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

## T2 SUPABASE VERIFICATION (run at start of every T2 session)
```sql
-- Paste in Supabase SQL Editor to verify DB state
SELECT
  (SELECT count(*) FROM am_scores) as leaderboard_rows,
  (SELECT count(*) FROM am_questions) as question_count,
  (SELECT count(distinct realm_id) FROM am_questions) as realms_covered;
-- Expected: 0 leaderboard rows (clean), 120 questions, 12 realms
```

## T2 CURRENT TASK QUEUE (priority order)

### TASK 1 — Run migrations in Supabase (IMMEDIATE)
Go to Supabase SQL Editor and run in order:
1. supabase/migrations/002_am_questions.sql (schema)
2. supabase/seeds/001_questions.sql (120 questions)
Verify: 120 rows in am_questions, 12 distinct realm_ids

### TASK 2 — Add game_mode field to useGameStore
File: src/store/useGameStore.js

Add to session state (not persisted):
```javascript
gameMode: 'classic', // classic | speed | survival | gauntlet | blind
livesRemaining: 3,   // for survival mode
gauntletCount: 0,    // for gauntlet mode (0-10)
speedTimeLeft: 30,   // for speed mode (seconds)

setGameMode: (m) => set(st => { st.gameMode = m }),
setLivesRemaining: (n) => set(st => { st.livesRemaining = n }),
setGauntletCount: (n) => set(st => { st.gauntletCount = n }),
```

Also add seenQuestions tracking to persisted state:
```javascript
seenQuestions: [], // array of question IDs seen this session
addSeenQuestion: (id) => set(st => { 
  if (!st.seenQuestions.includes(id)) st.seenQuestions.push(id) 
}),
```

### TASK 3 — Add more questions (expand question bank)
File: supabase/seeds/002_questions_expansion.sql (NEW FILE · T2 creates)

Script to generate and write 10 more questions per realm:
```bash
# In Claude Code terminal, ask Claude Code to write new questions
# For each realm, write 5 more questions and add to 002_questions_expansion.sql
# Then run in Supabase SQL Editor to add to the bank
```

Format for new questions (copy from 001_questions.sql for structure):
```sql
insert into public.am_questions (realm_id, realm_name, level_min, level_max, question, options, correct_idx, knowledge_type, explanation, insight, image_search, tags)
values (1, 'Ancient Civilizations', 1, 5, 'New question?', '["A","B","C","D"]', 0, 'historical', 'Explanation.', 'Insight.', 'search terms', ARRAY['tag1']);
```

### TASK 4 — Pinterest image pipeline (when ready)
Pinterest Developer API requires app approval (3-7 days).
When approved, T2 creates: scripts/fetch-pinterest-images.js

Script flow:
1. Auth with Pinterest API using access token
2. Fetch pins from Mahil's esoteric boards
3. For each question in am_questions, find best matching pin by keyword
4. Update am_questions SET image_url = pin.image_url where id = question.id
5. Image URLs stored permanently in DB — no more Unsplash dependency

Pinterest boards to target: esoteric, ancient, sacred geometry, consciousness, quantum

### TASK 5 — Verify App.jsx question flow end-to-end
```javascript
// Manual test in browser console after npm run dev:
// 1. Open localhost:5173
// 2. Enter name, click realm
// 3. Verify: questions load from Supabase (check Network tab for Supabase calls)
// 4. Verify: NO calls to api.anthropic.com (CORS error gone)
// 5. Verify: images appear for questions with image_search field
```

### TASK 6 — Vercel redeploy after all changes
```bash
cd ~/Desktop/aethermind
git pull origin main
vercel --prod
# Select existing 'aethermind' project
```

## T2 RULES (non-negotiable)
1. Never claim DB state without querying it directly first
2. Never guess a column name — query information_schema.columns first
3. Migration in git ≠ deployed schema — always verify on live DB
4. Never touch src/components/ src/App.jsx src/index.css (T1 files)
5. Test every new function with console.log of raw response before parsing
6. knowledge_type must be one of: empirical|historical|philosophical|esoteric|channeled|speculative

## 5-LENS PRE-COMMIT RITUAL
1. DB evidence: Supabase SQL query showing live state matches expectations
2. Cross-lane check: `git diff --cached --name-only` — abort if components/ appears
3. Em dash check: `grep -r "—" src/lib/ src/store/` — must be 0 results
4. Build gate: `npm run build 2>&1 | tail -3` — 0 errors required
5. Commit message accurate: no lies, pathspec not -A

## NIGHTSAVE CLOSE (mandatory)
```bash
npm run build 2>&1 | tail -3
git log --oneline -5 && git status --short
cat >> .claude/comms/tomorrow.md << LESSON
[T2] $(date +%Y-%m-%d) — [what shipped] — [rule learned] — Score: /200
Supabase question count: [N]
For T1: [anything T1 needs to know]
LESSON
git add src/lib/[changed] src/store/[changed] supabase/[changed]
git commit -m "feat(T2): [description]"
git push origin main
```

## USEFUL SUPABASE QUERIES
```sql
-- Question distribution by realm and difficulty
SELECT realm_name, 
  count(case when level_min <= 3 then 1 end) as easy,
  count(case when level_min > 3 and level_min <= 8 then 1 end) as medium,
  count(case when level_min > 8 then 1 end) as hard,
  count(*) as total
FROM am_questions
GROUP BY realm_name ORDER BY realm_name;

-- Questions most often answered wrong
SELECT question, times_shown, times_correct,
  round(times_correct::numeric/nullif(times_shown,0)*100,1) as accuracy
FROM am_questions WHERE times_shown > 0
ORDER BY accuracy asc LIMIT 10;

-- Add a single new question (example)
INSERT INTO am_questions (realm_id, realm_name, level_min, level_max, question, options, correct_idx, knowledge_type, explanation, insight, image_search, tags)
VALUES (1, 'Ancient Civilizations', 1, 5, 
  'Your question here?',
  '["Option A","Option B","Option C","Option D"]',
  0, 'historical', 'Explanation here.', 'Insight here.', 'image search terms',
  ARRAY['tag1','tag2']);
```
