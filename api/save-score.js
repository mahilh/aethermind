// AetherMind · POST /api/save-score · T2 LANE · raw fetch to PostgREST (no supabase-js)
// The service_role key must hold SELECT/INSERT/UPDATE GRANT on am_scores (migration 005);
// PostgREST returns 42501 for any client until that grant is applied.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
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

  const xp       = Math.min(Number(stats.xp)       || 0, 99999)
  const level    = Math.min(Number(stats.level)    || 1, 100)
  const correct  = Math.min(Number(stats.correct)  || 0, 99999)
  const answered = Math.min(Number(stats.answered) || 0, 99999)

  if (correct > answered) {
    return res.status(400).json({ error: 'correct cannot exceed answered' })
  }

  const realmScores = stats.realm && typeof stats.realm === 'object' ? stats.realm : {}
  const attributes  = stats.attrs && typeof stats.attrs === 'object'  ? stats.attrs  : {}

  if (JSON.stringify(realmScores).length > 5000) {
    return res.status(400).json({ error: 'realm_scores too large' })
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
      return res.status(500).json({ error: 'Failed to save score', status: response.status })
    }

    console.log('[AetherMind API] save-score: ok', playerName.trim(), 'xp', xp)
    return res.status(200).json({ ok: true })

  } catch (err) {
    console.error('[AetherMind API] save-score: network exception', err.message)
    return res.status(500).json({ error: 'Network error' })
  }
}
