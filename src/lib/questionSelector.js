// AetherMind — Adaptive Question Selector
// T2 LANE · src/lib/questionSelector.js
// Selects questions from Supabase pool based on player level + realm accuracy
// Images via Unsplash Source (free, no key needed)

// ── Main selector ─────────────────────────────────────────────
export function selectQuestion(questions, playerStats, realm, seenIds = []) {
  if (!questions || questions.length === 0) return null

  const level = playerStats.level || 1
  const realmData = playerStats.realm?.[String(realm.id)]
  const accuracy = realmData ? realmData.c / Math.max(1, realmData.t) : 0.5

  // Adjust difficulty based on accuracy
  const diffBonus = accuracy > 0.80 ? 3 : accuracy > 0.60 ? 1 : accuracy < 0.30 ? -3 : 0
  const targetLevel = Math.max(1, level + diffBonus)

  // Filter by level range (±5 window around target)
  const range = 6
  let pool = questions.filter(q =>
    q.level_min <= targetLevel + range && q.level_max >= targetLevel - range
  )

  if (pool.length === 0) pool = questions

  // Prefer unseen questions
  const unseen = pool.filter(q => !seenIds.includes(q.id))
  const candidates = unseen.length >= 3 ? unseen : pool

  // Weighted random: questions shown fewer times get higher weight
  return weightedRandom(candidates)
}

// ── Weighted random selection ──────────────────────────────────
function weightedRandom(items) {
  if (items.length === 0) return null
  if (items.length === 1) return items[0]

  // Weight = inverse of times_shown (less shown = more likely to pick)
  const weights = items.map(q => Math.max(1, 20 - (q.times_shown || 0)))
  const total = weights.reduce((a, b) => a + b, 0)

  // Deterministic enough for our purposes (we do want some randomness in question selection)
  let rand = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    rand -= weights[i]
    if (rand <= 0) return items[i]
  }
  return items[items.length - 1]
}

// ── Format DB question for game ───────────────────────────────
export function formatQuestion(dbQ) {
  if (!dbQ) return null

  const options = Array.isArray(dbQ.options)
    ? dbQ.options
    : JSON.parse(dbQ.options || '[]')

  const crossRefs = Array.isArray(dbQ.cross_refs)
    ? dbQ.cross_refs
    : JSON.parse(dbQ.cross_refs || '[]')

  return {
    db_id:          dbQ.id,
    question:       dbQ.question,
    options:        options,
    correct_index:  dbQ.correct_idx,
    knowledge_type: dbQ.knowledge_type,
    explanation:    dbQ.explanation,
    insight:        dbQ.insight || '',
    cross_references: crossRefs,
    image_search:   dbQ.image_search || '',
    image_url:      dbQ.image_url || '',
    realm_id:       dbQ.realm_id,
  }
}

// ── Image URL builder (Unsplash Source — free, no key) ────────
// Returns a consistent image URL for each question based on search terms
export function getImageUrl(question, fallbackRealm = '') {
  const search = question?.image_search || fallbackRealm
  if (!search) return null

  const encoded = encodeURIComponent(search)
  // sig= makes the image consistent per question (deterministic)
  const sig = question?.db_id?.slice(0, 8) || Math.floor(Math.random() * 1000)
  return `https://source.unsplash.com/800x450/?${encoded}&sig=${sig}`
}

// ── Difficulty label for UI ────────────────────────────────────
export function getDifficultyLabel(levelMin, levelMax) {
  if (levelMin <= 3) return { label: 'Initiate', color: '#4ADE80' }
  if (levelMin <= 8) return { label: 'Seeker',   color: '#FCD34D' }
  return { label: 'Adept', color: '#F87171' }
}
