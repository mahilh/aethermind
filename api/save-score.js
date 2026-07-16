// AetherMind · POST /api/save-score · T2 LANE · raw fetch to PostgREST (no supabase-js)
// The service_role key must hold SELECT/INSERT/UPDATE GRANT on am_scores (migration 005);
// PostgREST returns 42501 for any client until that grant is applied.

// IP rate limit: 50 writes/hour/IP, in-memory per warm serverless instance (not shared across
// instances, resets on cold start). Viable now that saveScore is debounced to ~25 XP (T1
// c7f4ef1). Note: XP accrues fast, so saves still run roughly once per answer at higher levels,
// and a heavy shared-NAT session (several players on one IP) can approach 50/hr; raise the cap
// if 429s show up in logs.
const _rl = new Map()

// Derive the client IP from platform-set headers only. Vercel sets x-real-ip to the true client
// address, and the LAST x-forwarded-for hop is the one Vercel appended, so neither can be spoofed
// the way the FIRST x-forwarded-for entry (client-controlled) can. Sanitize to an IP-shaped
// charset and cap the length before the value is logged or used as a map key, which blocks log
// forgery and bounds the key space.
function clientIp(req) {
  const xff = req.headers['x-forwarded-for']
  const lastHop = xff ? xff.split(',').pop().trim() : ''
  const raw = req.headers['x-real-ip'] || lastHop || req.socket?.remoteAddress || 'unknown'
  return String(raw).replace(/[^0-9a-fA-F:.]/g, '').slice(0, 45) || 'unknown'
}

function rateLimit(ip) {
  const now = Date.now()
  // Sweep expired buckets so the map cannot grow unbounded over the instance lifetime.
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
    console.error('[AetherMind API] save-score: missing env vars', { hasUrl: !!supabaseUrl, hasKey: !!serviceKey })
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

  // Reject non-finite, negative, or non-integer values BEFORE clamping, so a forged
  // negative or fractional stat cannot slip through Math.min into the leaderboard.
  for (const [k, v] of Object.entries({ xp: rawXp, level: rawLevel, correct: rawCorrect, answered: rawAnswered })) {
    if (!Number.isFinite(v) || v < 0 || !Number.isInteger(v)) {
      return res.status(400).json({ error: `Invalid ${k}` })
    }
  }

  const xp       = Math.min(rawXp, 99999)
  const level    = Math.min(Math.max(rawLevel, 1), 100)
  const correct  = Math.min(rawCorrect, 99999)
  const answered = Math.min(rawAnswered, 99999)

  if (correct > answered) {
    return res.status(400).json({ error: 'correct cannot exceed answered' })
  }

  // Optional per-run best streak. Coerce to a safe non-negative integer (0..120) so a
  // forged negative or fractional value cannot land in the leaderboard.
  const maxStreak = Math.max(0, Math.min(Math.floor(Number(stats.maxStreak) || 0), 120))

  const realmScores = stats.realm && typeof stats.realm === 'object' ? stats.realm : {}
  const attributes  = stats.attrs && typeof stats.attrs === 'object'  ? stats.attrs  : {}

  if (JSON.stringify(realmScores).length > 5000 || JSON.stringify(attributes).length > 5000) {
    return res.status(400).json({ error: 'stats payload too large' })
  }

  const payload = {
    player_name:    playerName.trim(),
    level:          level,
    xp:             xp,
    total_correct:  correct,
    total_answered: answered,
    realm_scores:   realmScores,
    attributes:     attributes,
    updated_at:     new Date().toISOString()
  }
  // Include max_streak only when present, so this route stays safe to deploy before the
  // am_scores.max_streak column (migration 007) is applied: a 0 carries no info and the
  // key is simply omitted. Once 007 is live, real streaks are stored.
  if (maxStreak > 0) payload.max_streak = maxStreak

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/am_scores`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer':        'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const body = await response.text()
      console.error('[AetherMind API] save-score: REST error', response.status, body)
      return res.status(500).json({ error: 'Failed to save score' })
    }

    console.log('[AetherMind API] save-score: ok', playerName.trim(), 'xp', xp)
    return res.status(200).json({ ok: true })

  } catch (err) {
    console.error('[AetherMind API] save-score: network exception', err.message)
    return res.status(500).json({ error: 'Network error' })
  }
}
