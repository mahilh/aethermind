// AetherMind — Vercel Serverless API Route
// Proxies Anthropic API calls server-side to avoid CORS
// Env var required: ANTHROPIC_API_KEY (server-side, no VITE_ prefix)

function getDepth(level) {
  if (level <= 3)  return 'basic definitions and essential facts'
  if (level <= 8)  return 'meaningful connections between concepts'
  if (level <= 18) return 'cross-disciplinary synthesis and hidden patterns'
  if (level <= 30) return 'advanced integration, paradoxes, and original insight'
  return 'master level — reality modeling and the ineffable'
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' })
  }

  const { realm, level } = req.body
  if (!realm || !level) {
    return res.status(400).json({ error: 'Missing realm or level in request body' })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 900,
        system: `You are the AetherMind Examiner — a deep guide for esoteric, philosophical, and scientific wisdom. Generate consciousness-expanding quiz questions. Respond ONLY with raw valid JSON. No markdown, no code fences, no preamble.`,
        messages: [{
          role: 'user',
          content: `Generate one multiple-choice question for AetherMind.

Realm: "${realm.name}"
Topics: ${realm.topics}
Level: ${level} — Depth: ${getDepth(level)}

Return ONLY raw JSON (no backticks):
{
  "question": "specific surprising question",
  "options": ["A","B","C","D"],
  "correct_index": 0,
  "knowledge_type": "esoteric",
  "explanation": "rich explanation with context (2+ sentences)",
  "insight": "deeper wisdom or mind-expanding connection",
  "cross_references": ["primary source","related concept"]
}

Rules:
- knowledge_type: empirical | historical | philosophical | esoteric | channeled | speculative
- correct_index: 0-3
- Wrong options must be plausible, not obviously wrong`
        }]
      })
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(response.status).json({ error: `Anthropic API error: ${err}` })
    }

    const data = await response.json()
    return res.status(200).json(data)

  } catch (err) {
    console.error('[AetherMind API] generate-question error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
