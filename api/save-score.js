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

// Decode the Postgres role claim from a legacy Supabase JWT key. New-format opaque
// keys (sb_secret_..., sb_publishable_...) are not JWTs, so this returns null and
// callers must treat null as "unknown role, allow" rather than "invalid".
function decodeJwtRole(key) {
  try {
    const part = String(key).split('.')[1]
    if (!part) return null
    return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')).role || null
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) {
    return res.status(500).json({ error: 'Supabase service env vars not configured' })
  }

  // Fail fast on the classic misconfig: the anon key pasted into SUPABASE_SERVICE_KEY.
  // The service_role bypasses RLS and grants; an anon-role key is denied every write
  // once migration 004 revokes anon INSERT/UPDATE, surfacing as a silent 500 with
  // "permission denied for table am_scores" (Postgres 42501). We only act on a
  // positive anon/authenticated identification, so opaque secret keys pass through.
  const keyRole = decodeJwtRole(serviceKey)
  if (keyRole === 'anon' || keyRole === 'authenticated') {
    console.error(`[AetherMind API] save-score: SUPABASE_SERVICE_KEY authenticates as "${keyRole}", not service_role. Set the service_role secret in Vercel and redeploy.`)
    return res.status(500).json({ error: 'Server misconfigured: write key lacks privileges' })
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
    // Log the full Postgres error (code + hint) so grant/constraint failures are
    // diagnosable without a log dive. The client response stays generic on purpose.
    console.error(`[AetherMind API] save-score: ${error.code || 'ERR'} ${error.message}${error.hint ? ' | hint: ' + error.hint : ''}`)
    return res.status(500).json({ error: 'Failed to save score' })
  }

  return res.status(200).json({ ok: true, score: data })
}
