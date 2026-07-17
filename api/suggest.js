// AetherMind, POST /api/suggest, T2 LANE
// Community knowledge suggestions: players suggest books/topics/teachers/traditions for new questions.
// Writes to am_suggestions via the service_role key (server-side), with input validation and a per-IP
// rate limit. NOTE: am_suggestions also allows anon INSERT directly via PostgREST (the anon key is
// public), so this endpoint's validation + throttle only bind clients that go through it; a determined
// spammer can hit PostgREST directly (same public-anon-key tradeoff as the rest of the app). The DB
// CHECK constraints (type whitelist, title 4-200, description <=500) are the backstop that binds even
// direct inserts.

const _rl = new Map()

function clientIp(req) {
  const xff = req.headers['x-forwarded-for']
  const lastHop = xff ? xff.split(',').pop().trim() : ''
  const raw = req.headers['x-real-ip'] || lastHop || req.socket?.remoteAddress || 'unknown'
  return String(raw).replace(/[^0-9a-fA-F:.]/g, '').slice(0, 45) || 'unknown'
}

// 20/hour per IP. Suggestions are low-frequency, so this is generous for legit use (a player adding a
// few books) while blocking flooding through the app.
function rateLimit(ip) {
  const now = Date.now()
  if (_rl.size > 1000) { for (const [k, v] of _rl) if (now > v.t) _rl.delete(k) }
  const e = _rl.get(ip) || { n: 0, t: now + 3600000 }
  if (now > e.t) { e.n = 0; e.t = now + 3600000 }
  e.n++
  _rl.set(ip, e)
  return e.n > 20
}

const VALID_TYPES = ['book', 'topic', 'teacher', 'tradition', 'other']
const VALID_REALMS = new Set([
  'Ancient Civilizations', 'Hermetic Wisdom', 'Gnosticism', 'Eastern Traditions',
  'Consciousness', 'Psychology', 'Quantum Physics', 'Esoteric Science',
  'Comparative Religion', 'Hidden History', 'Symbolism', 'Ethics & Wisdom',
])

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const ip = clientIp(req)
  if (rateLimit(ip)) {
    console.warn('[AetherMind] suggest rate-limited:', ip)
    return res.status(429).json({ error: 'Rate limit exceeded. Please slow down.' })
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || ''
  if (!supabaseUrl || !serviceKey) {
    console.error('[AetherMind] suggest: missing env vars')
    return res.status(500).json({ error: 'Server misconfiguration' })
  }

  const { playerName, type, title, description, realmName } = req.body || {}

  if (!title || typeof title !== 'string' || title.trim().length < 4 || title.length > 200) {
    return res.status(400).json({ error: 'Title must be 4-200 characters' })
  }
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Type must be one of: ' + VALID_TYPES.join(', ') })
  }

  const payload = {
    player_name: (typeof playerName === 'string' && playerName.trim() ? playerName.trim() : 'Anonymous').slice(0, 30),
    type,
    title: title.trim().slice(0, 200),
    description: (typeof description === 'string' ? description.trim().slice(0, 500) : '') || null,
    realm_name: VALID_REALMS.has(realmName) ? realmName : null,
  }

  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/am_suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(payload),
    })
    if (!resp.ok) {
      const body = await resp.text()
      console.error('[AetherMind] suggest: write error', resp.status, body)
      return res.status(500).json({ error: 'Failed to save suggestion' })
    }
    console.log('[AetherMind] suggest: saved', payload.type, payload.title.slice(0, 40))
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[AetherMind] suggest: exception', err.message)
    return res.status(500).json({ error: 'Network error' })
  }
}
