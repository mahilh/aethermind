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

function envConfig() {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY || ''
  return { supabaseUrl, serviceKey }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
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
