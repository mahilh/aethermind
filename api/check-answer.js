// AetherMind, POST /api/check-answer, T2 LANE, raw fetch to PostgREST (no supabase-js)
// Server-side answer validation. The client sends { questionId (the am_questions uuid), pickedIdx }
// and the server compares against the stored correct_idx, so the answer key does not have to ship in
// the question payload. This route is ADDITIVE and inert until the client is cut over: it is safe to
// deploy while fetchQuestionsForRealm still returns correct_idx. The correct_idx strip from the fetch
// happens ONLY after T1 wires checkAnswer() into QuizScreen and DailyAether, so the live game never
// scores every answer wrong during the transition (correct_index would be undefined client-side).
//
// It also increments times_shown / times_correct. Nothing currently writes those (the client only
// reads them for question weighting), so this is a net-new populate, not a double count. The read
// then write is not atomic, so a concurrent burst can drop a count, which is fine for analytics.
//
// ── Rate limiting (Session 9, unblocks the checkAnswer() client cutover) ─────────────────────
// Two best-effort layers. Both maps are per serverless instance (module memory): under Fluid
// Compute an instance is reused, so counts persist within an instance but are NOT shared across
// instances. This is throttling, not a hard security boundary.
//
// Layer A, per IP: check-answer fires once per answer, far more often than save-score (50/hr), so
// the ceiling is per-minute and generous. The friend group can share a NAT (see the save-score
// shared-NAT caveat in CLAUDE.md), so 60/min clears a small group answering quickly while still
// stopping a runaway loop. It does NOT stop a patient answer-key scrape (118 calls under the limit);
// it cannot, because correctIdx ships on every call. Raise the 60 below if 429s appear on shared NAT.
//
// Layer B, per IP + question: DELIBERATE DEVIATION from the FORGE spec, which keyed this by
// questionId alone. A global per-question counter would 429 the Nth *legitimate* concurrent player
// on a shared question, breaking multiplayer. Keying by IP+question throttles only a single abuser
// hammering one question (which would also inflate that row's times_shown/times_correct via the
// counter bump below) and leaves other players untouched. Per-question limiting is NOT real
// anti-enumeration here (this route returns correctIdx on every call); true anti-cheat needs a
// stateful design that never ships correctIdx before an answer is locked (larger change, deferred).
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
  const e = _rl.get(ip) || { n: 0, t: now + 60000 }
  if (now > e.t) { e.n = 0; e.t = now + 60000 }
  e.n++
  _rl.set(ip, e)
  return e.n > 60
}
const _qrl = new Map()
function questionRateLimit(ip, qid) {
  const key = ip + '|' + qid
  const now = Date.now()
  if (_qrl.size > 2000) { for (const [k, v] of _qrl) if (now > v.t) _qrl.delete(k) }
  const e = _qrl.get(key) || { n: 0, t: now + 600000 }
  if (now > e.t) { e.n = 0; e.t = now + 600000 }
  e.n++
  _qrl.set(key, e)
  return e.n > 30
}

function envConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY || ''
  return { supabaseUrl, serviceKey }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const ip = clientIp(req)
  if (rateLimit(ip)) {
    console.warn('[AetherMind API] check-answer rate-limited (ip):', ip)
    return res.status(429).json({ error: 'Rate limit exceeded' })
  }

  const { supabaseUrl, serviceKey } = envConfig()
  if (!supabaseUrl || !serviceKey) {
    console.error('[AetherMind API] check-answer: missing env vars', { hasUrl: !!supabaseUrl, hasKey: !!serviceKey })
    return res.status(500).json({ error: 'Server misconfiguration' })
  }

  const { questionId, pickedIdx } = req.body || {}

  // questionId is an am_questions uuid. Validate shape before it enters a PostgREST filter (hex and
  // hyphen only, so no query-string injection is possible).
  if (typeof questionId !== 'string' || !/^[0-9a-fA-F-]{36}$/.test(questionId)) {
    return res.status(400).json({ error: 'Invalid questionId' })
  }
  // pickedIdx must be one of the four option slots.
  if (!Number.isInteger(pickedIdx) || pickedIdx < 0 || pickedIdx > 3) {
    return res.status(400).json({ error: 'Invalid pickedIdx' })
  }

  // Layer B: per IP + question. Keyed by IP (not question alone) so concurrent legit players on the
  // same question are never blocked; only a single IP hammering one question is throttled. Runs
  // after shape validation so only well-formed uuids enter the map.
  if (questionRateLimit(ip, questionId)) {
    console.warn('[AetherMind API] check-answer rate-limited (ip+question):', ip, questionId)
    return res.status(429).json({ error: 'Question check limit exceeded' })
  }

  try {
    const lookup = await fetch(
      `${supabaseUrl}/rest/v1/am_questions?id=eq.${questionId}&select=correct_idx,times_shown,times_correct`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    )
    if (!lookup.ok) {
      const body = await lookup.text()
      console.error('[AetherMind API] check-answer: lookup error', lookup.status, body)
      return res.status(500).json({ error: 'Lookup failed' })
    }
    const rows = await lookup.json()
    const row = Array.isArray(rows) ? rows[0] : null
    if (!row) return res.status(404).json({ error: 'Question not found' })

    const correctIdx = row.correct_idx
    const isCorrect  = pickedIdx === correctIdx

    // Best-effort analytics bump. Never fail the answer because a counter write failed.
    try {
      await fetch(`${supabaseUrl}/rest/v1/am_questions?id=eq.${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey:         serviceKey,
          Authorization:  `Bearer ${serviceKey}`,
          Prefer:         'return=minimal'
        },
        body: JSON.stringify({
          times_shown:   (row.times_shown   || 0) + 1,
          times_correct: (row.times_correct || 0) + (isCorrect ? 1 : 0)
        })
      })
    } catch (bumpErr) {
      console.warn('[AetherMind API] check-answer: counter bump failed', bumpErr.message)
    }

    // correctIdx is returned so the client can render the reveal (which option was right). It is only
    // exposed AFTER a pick is submitted, so the answer key is no longer readable up front in DevTools.
    return res.status(200).json({ isCorrect, correctIdx })

  } catch (err) {
    console.error('[AetherMind API] check-answer: network exception', err.message)
    return res.status(500).json({ error: 'Network error' })
  }
}
