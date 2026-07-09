// AetherMind — Supabase client + leaderboard
// T2 LANE · Table: am_scores · Channel: am_leaderboard_realtime
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) console.warn('[AetherMind] Supabase env vars missing — leaderboard disabled')

export const supabase = (url && key) ? createClient(url, key) : null

export async function saveScore(playerName, stats) {
  if (!supabase || !playerName?.trim()) return null
  const { data, error } = await supabase.from('am_scores').upsert({
    player_name: playerName.trim(),
    level: stats.level,
    total_correct: stats.correct,
    total_answered: stats.answered,
    xp: stats.xp,
    realm_scores: stats.realm,
    attributes: stats.attrs,
    updated_at: new Date().toISOString(),
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
  return supabase.channel('am_leaderboard_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'am_scores' }, callback)
    .subscribe()
}

export function unsubscribeLeaderboard(channel) {
  if (!supabase || !channel) return
  supabase.removeChannel(channel)
}
