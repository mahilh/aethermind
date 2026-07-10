// AetherMind — Question Generator · T2 LANE
// Calls /api/generate-question (Vercel serverless proxy) to avoid CORS
// Anthropic API key lives server-side only — never exposed to browser

function getDepth(level) {
  if (level <= 3)  return 'basic definitions and essential facts'
  if (level <= 8)  return 'meaningful connections between concepts'
  if (level <= 18) return 'cross-disciplinary synthesis and hidden patterns'
  if (level <= 30) return 'advanced integration, paradoxes, and original insight'
  return 'master level — reality modeling and the ineffable'
}

export async function generateQuestion(realm, level) {
  const response = await fetch('/api/generate-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ realm, level }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`API error ${response.status}: ${err.error}`)
  }

  const data = await response.json()
  let text = data.content[0].text.trim()
  text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  const parsed = JSON.parse(text)

  const valid = ['empirical', 'historical', 'philosophical', 'esoteric', 'channeled', 'speculative']
  if (!valid.includes(parsed.knowledge_type)) parsed.knowledge_type = 'philosophical'

  return parsed
}
