// AetherMind · POST /api/save-score · T2 LANE
// Uses explicit SELECT → INSERT or PATCH instead of resolution=merge-duplicates
// This avoids PostgREST upsert header compatibility issues entirely.
// max_streak is computed as GREATEST(existing, new) server-side in this function.

const _rl = new Map()

function clientIp(req) {
  const xff = req.headers['x-forwarded-for']
  const lastHop = xff ? xff.split(',').pop().trim() : ''
  const raw = req.headers['x-real-ip'] || lastHop || req.socket?.remoteAddress || 'unknown'
  return String(raw).replace(/[^0-9a-fA-F:.]/g, '').slice(0, 45) || 'unknown'
}

function rateLimit(ip) {
  const now = Date.now()
  if (_rl.size > 1000) { for (const [k, v] of _rl) if (now > v.t) _rl.delete(k) }
  const e = _rl.get(ip) || { n: 0, t: now + 3600000 }
  if (now > e.t) { e.n = 0; e.t = now + 3600000 }
  e.n++
  _rl.set(ip, e)
  return e.n > 50
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = clientIp(req)
  if (rateLimit(ip)) {
    console.warn('[AetherMind API] rate-limited:', ip)
    return res.status(429).json({ error: 'Rate limit exceeded. Please slow down.' })
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY || ''

  if (!supabaseUrl || !serviceKey) {
    console.error('[AetherMind API] save-score: missing env vars')
    return res.status(500).json({ error: 'Server misconfiguration' })
  }

  const { playerName, stats } = req.body || {}

  if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0 || playerName.length > 30) {
    return res.status(400).json({ error: 'Invalid playerName' })
  }

  if (!stats || typeof stats !== 'object') {
    return res.status(400).json({ error: 'Invalid stats' })
  }

  const rawXp       = Number(stats.xp)
  const rawLevel    = Number(stats.level)
  const rawCorrect  = Number(stats.correct)
  const rawAnswered = Number(stats.answered)

  for (const [k, v] of Object.entries({ xp: rawXp, level: rawLevel, correct: rawCorrect, answered: rawAnswered })) {
    if (!Number.isFinite(v) || v < 0 || !Number.isInteger(v)) {
      return res.status(400).json({ error: `Invalid ${k}` })
    }
  }

  const xp       = Math.min(rawXp, 99999)
  const level    = Math.min(Math.max(rawLevel, 1), 100)
  const correct  = Math.min(rawCorrect, 99999)
  const answered = Math.min(rawAnswered, 99999)

  // Curve-correct plausibility ceiling. Restored from 218df9f; the 7b1c557 rewrite dropped it and
  // left only the flat Math.min(rawXp, 99999) clamp (kept above as a hard backstop). xp is stored
  // PER LEVEL (it wraps to 0 on level-up), so the max legitimate in-level xp is bounded by the
  // xpToNext curve (~100*1.65^(level-1): ~2030 at L7, ~3350 at L8). 200*1.7^level+500 sits safely
  // above that at every level (L2=1078, L7=8707, L8=14452), so it never false-rejects a genuine
  // near-level-up score while still catching grossly inflated cheats.
  if (xp > 200 * Math.pow(1.7, level) + 500) {
    console.warn('[AetherMind API] save-score: implausible xp for level', { xp, level })
    return res.status(400).json({ error: 'Implausible score' })
  }

  if (correct > answered) {
    return res.status(400).json({ error: 'correct cannot exceed answered' })
  }

  const maxStreak = Math.max(0, Math.min(Math.floor(Number(stats.maxStreak) || 0), 120))

  if (maxStreak > answered && answered > 0) {
    return res.status(400).json({ error: 'Invalid streak' })
  }

  const realmScores = stats.realm && typeof stats.realm === 'object' ? stats.realm : {}
  const attributes  = stats.attrs && typeof stats.attrs === 'object'  ? stats.attrs  : {}

  if (JSON.stringify(realmScores).length > 5000 || JSON.stringify(attributes).length > 5000) {
    return res.status(400).json({ error: 'stats payload too large' })
  }

  const hdrs = {
    'Content-Type':  'application/json',
    'apikey':        serviceKey,
    'Authorization': `Bearer ${serviceKey}`,
    'Prefer':        'return=minimal'
  }

  const name = playerName.trim()

  try {
    // Step 1: check if player already exists
    const checkResp = await fetch(
      `${supabaseUrl}/rest/v1/am_scores?player_name=eq.${encodeURIComponent(name)}&select=max_streak`,
      { headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` } }
    )

    if (!checkResp.ok) {
      const body = await checkResp.text()
      console.error('[AetherMind API] save-score: SELECT error', checkResp.status, body)
      return res.status(500).json({ error: 'Failed to save score' })
    }

    const existing = await checkResp.json()
    const existingMaxStreak = existing?.[0]?.max_streak ?? 0

    // GREATEST computed server-side, not relying on DB trigger
    const finalMaxStreak = Math.max(existingMaxStreak, maxStreak)

    const payload = {
      player_name:    name,
      level:          level,
      xp:             xp,
      total_correct:  correct,
      total_answered: answered,
      realm_scores:   realmScores,
      attributes:     attributes,
      updated_at:     new Date().toISOString()
    }
    if (finalMaxStreak > 0) payload.max_streak = finalMaxStreak

    let response

    if (existing && existing.length > 0) {
      // Step 2a: PATCH (update existing row)
      response = await fetch(
        `${supabaseUrl}/rest/v1/am_scores?player_name=eq.${encodeURIComponent(name)}`,
        { method: 'PATCH', headers: hdrs, body: JSON.stringify(payload) }
      )
    } else {
      // Step 2b: POST (insert new row)
      response = await fetch(
        `${supabaseUrl}/rest/v1/am_scores`,
        { method: 'POST', headers: hdrs, body: JSON.stringify(payload) }
      )
    }

    if (!response.ok) {
      const body = await response.text()
      console.error('[AetherMind API] save-score: write error', response.status, body)
      return res.status(500).json({ error: 'Failed to save score' })
    }

    console.log('[AetherMind API] save-score: ok', name, 'xp', xp, 'max_streak', finalMaxStreak)
    return res.status(200).json({ ok: true })

  } catch (err) {
    console.error('[AetherMind API] save-score: exception', err.message)
    return res.status(500).json({ error: 'Network error' })
  }
}
