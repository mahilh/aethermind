// AetherMind, GET /api/daily-questions, T2 LANE, raw fetch to PostgREST
// Returns today's 5 deterministic Daily Aether questions WITHOUT correct_idx, mirroring the client
// selection in src/components/DailyAether.jsx EXACTLY: same seedFrom / hashStr / seededSort, same
// pick of 5 seeded realms, then the seed-first question within each realm.
//
// This is inert infrastructure: nothing consumes it yet, and the live daily still grades on the
// client. If a consumer is ever wired, it must grade answers via /api/check-answer (correct_idx is
// intentionally never selected here) AND re-verify parity against DailyAether.jsx, which stays the
// canonical source of the daily selection. If T1 changes the client algorithm, update this to match.

const REALM_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const SAFE_COLS = 'id,realm_id,realm_name,level_min,level_max,question,options,knowledge_type,explanation,insight,cross_refs,image_search,image_url'

// Ported verbatim from DailyAether.jsx so the selection is byte-for-byte identical.
function seedFrom(key) { return key.split('-').reduce((a, v) => a * 31 + parseInt(v, 10), 0) }
function hashStr(s) { s = String(s); let h = 0; for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) | 0 } return h }
function seededSort(items, seed) {
  return items
    .map(it => { const x = Math.sin(seed + hashStr(it.id)) * 10000; return { it, r: x - Math.floor(x) } })
    .sort((a, b) => a.r - b.r)
    .map(o => o.it)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  // A plain SELECT of the safe columns is fine under the anon grant, so fall back to the anon key if
  // the service key is absent. correct_idx is never requested, so no privileged read is needed.
  const readKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  if (!supabaseUrl || !readKey) {
    console.error('[AetherMind API] daily-questions: missing env vars', { hasUrl: !!supabaseUrl, hasKey: !!readKey })
    return res.status(500).json({ error: 'Server misconfiguration' })
  }

  const today = new Date().toISOString().split('T')[0]   // YYYY-MM-DD (UTC), same as the client todayKey()
  const seed  = seedFrom(today)

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/am_questions?select=${SAFE_COLS}`,
      { headers: { apikey: readKey, Authorization: `Bearer ${readKey}` } }
    )
    if (!response.ok) {
      const body = await response.text()
      console.error('[AetherMind API] daily-questions: fetch error', response.status, body)
      return res.status(500).json({ error: 'Fetch failed' })
    }
    const all = await response.json()
    if (!Array.isArray(all) || all.length === 0) {
      return res.status(200).json({ date: today, questions: [] })
    }

    // Client parity: pick 5 realms by the seeded sort of realm ids (hashStr stringifies the id, so a
    // numeric realm id and the client's REALMS[i].id hash the same), then the seed-first question in
    // each realm. seededSort is a total order on the sin-fraction, so the DB row order does not matter.
    const realmOrder = seededSort(REALM_IDS.map(id => ({ id })), seed).slice(0, 5).map(o => o.id)
    const daily = realmOrder
      .map(rid => {
        const pool = all.filter(q => q.realm_id === rid)
        return pool.length ? seededSort(pool, seed)[0] : null
      })
      .filter(Boolean)

    return res.status(200).json({ date: today, questions: daily })

  } catch (err) {
    console.error('[AetherMind API] daily-questions: network exception', err.message)
    return res.status(500).json({ error: 'Network error' })
  }
}
