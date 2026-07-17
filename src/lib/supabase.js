// AetherMind, Supabase client + leaderboard + questions
// T2 LANE · Table: am_scores (leaderboard) · am_questions (question bank)
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) console.warn('[AetherMind] Supabase env vars missing, DB disabled')

export const supabase = (url && key) ? createClient(url, key) : null

// ── QUESTIONS ─────────────────────────────────────────────────

// Fetch all questions for a realm (called once per realm session)
export async function fetchQuestionsForRealm(realmId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('am_questions')
    .select('*')
    .eq('realm_id', realmId)
    .order('times_shown', { ascending: true })
  if (error) { console.error('[Supabase] fetchQuestionsForRealm:', error.message); return [] }
  return data || []
}

// Fetch a random question (no realm filter, for mixed mode)
export async function fetchMixedQuestion(level = 1) {
  if (!supabase) return null
  const minLevel = Math.max(1, level - 5)
  const maxLevel = level + 5
  const { data, error } = await supabase
    .from('am_questions')
    .select('*')
    .lte('level_min', maxLevel)
    .gte('level_max', minLevel)
    .order('times_shown', { ascending: true })
    .limit(20)
  if (error) { console.error('[Supabase] fetchMixedQuestion:', error.message); return null }
  if (!data || data.length === 0) return null
  return data[Math.floor(Math.random() * data.length)]
}

// Server-side answer check (used once the client stops trusting the shipped correct_idx). Pass the
// am_questions uuid (question.db_id) and the picked option index; the serverless route compares
// against the stored correct_idx and returns { isCorrect, correctIdx }, or null on failure so the
// caller can fall back. ADDITIVE: correct_idx still ships in fetchQuestionsForRealm today. The plan
// is to wire this into QuizScreen + DailyAether first, THEN drop correct_idx from the SELECT.
export async function checkAnswer(questionId, pickedIdx) {
  try {
    const res = await fetch('/api/check-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, pickedIdx }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[AetherMind] checkAnswer:', err.error || res.status)
      return null
    }
    return await res.json()
  } catch (err) {
    console.error('[AetherMind] checkAnswer:', err.message)
    return null
  }
}

// ── LEADERBOARD ───────────────────────────────────────────────

// Writes go through the service-role serverless route (/api/save-score), never
// direct anon upsert. After migration 004 anon has no am_scores write grant.
export async function saveScore(playerName, stats) {
  if (!playerName?.trim()) return null
  try {
    const res = await fetch('/api/save-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: playerName.trim(), stats }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[AetherMind] saveScore:', err.error || res.status)
      return null
    }
    const { score } = await res.json()
    return score
  } catch (err) {
    console.error('[AetherMind] saveScore:', err.message)
    return null
  }
}

export async function getLeaderboard(period = 'all') {
  if (!supabase) return []
  let query = supabase
    .from('am_scores')
    .select('*')
    .order('xp', { ascending: false })
    .limit(20)
  if (period === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('updated_at', weekAgo)
  }
  const { data, error } = await query
  if (error) { console.error('[Supabase] getLeaderboard:', error.message); return [] }
  return data || []
}

export function subscribeLeaderboard(callback) {
  if (!supabase) return null
  return supabase
    .channel('am_leaderboard_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'am_scores' }, callback)
    .subscribe()
}

export function unsubscribeLeaderboard(channel) {
  if (!supabase || !channel) return
  supabase.removeChannel(channel)
}
