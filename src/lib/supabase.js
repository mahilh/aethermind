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

// ── LEADERBOARD ───────────────────────────────────────────────

export async function saveScore(playerName, stats) {
  if (!supabase || !playerName?.trim()) return null
  const { data, error } = await supabase
    .from('am_scores')
    .upsert({
      player_name:    playerName.trim(),
      level:          stats.level,
      total_correct:  stats.correct,
      total_answered: stats.answered,
      xp:             stats.xp,
      realm_scores:   stats.realm,
      attributes:     stats.attrs,
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'player_name' })
  if (error) console.error('[Supabase] saveScore:', error.message)
  return data
}

export async function getLeaderboard() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('am_scores')
    .select('player_name, level, xp, total_correct, total_answered, updated_at')
    .order('xp', { ascending: false })
    .limit(20)
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
