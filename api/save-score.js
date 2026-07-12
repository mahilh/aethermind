// AetherMind · Vercel Serverless API Route · POST /api/save-score
// T2 LANE · The ONLY sanctioned write path to am_scores once migration 004 is
// applied (004 revokes anon INSERT/UPDATE). Runs server-side with the service
// role, which bypasses RLS.
// Env vars: SUPABASE_SERVICE_KEY (server-side secret, required). The project URL
// is public, so it falls back to VITE_SUPABASE_URL when a plain SUPABASE_URL is
// not set (Vercel exposes VITE_ vars to functions too).
import { createClient } from '@supabase/supabase-js'

const MAX_XP = 5000
const MAX_LEVEL = 50
const MAX_NAME = 40

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) {
    return res.status(500).json({ error: 'Supabase service env vars not configured' })
  }

  const { playerName, stats } = req.body || {}

  const name = typeof playerName === 'string' ? playerName.trim() : ''
  if (!name || name.length > MAX_NAME) {
    return res.status(400).json({ error: 'Invalid playerName' })
  }
  if (!stats || typeof stats !== 'object') {
    return res.status(400).json({ error: 'Missing stats' })
  }

  const level    = Number(stats.level)
  const xp       = Number(stats.xp)
  const correct  = Number(stats.correct)
  const answered = Number(stats.answered)
  if ([level, xp, correct, answered].some(n => !Number.isFinite(n) || n < 0)) {
    return res.status(400).json({ error: 'Invalid numeric stats' })
  }

  // Anti-cheat sanity bounds
  if (xp > MAX_XP || level > MAX_LEVEL || correct > answered) {
    return res.status(422).json({ error: 'Stats failed sanity check' })
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  const { data, error } = await admin
    .from('am_scores')
    .upsert({
      player_name:    name,
      level,
      total_correct:  correct,
      total_answered: answered,
      xp,
      realm_scores:   stats.realm ?? {},
      attributes:     stats.attrs ?? {},
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'player_name' })
    .select()
    .single()

  if (error) {
    console.error('[AetherMind API] save-score:', error.message)
    return res.status(500).json({ error: 'Failed to save score' })
  }

  return res.status(200).json({ ok: true, score: data })
}
