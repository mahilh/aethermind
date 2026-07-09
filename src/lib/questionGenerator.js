// AetherMind — Question Generator · T2 LANE
// Anthropic claude-sonnet-4-6 · max_tokens 900

function getDepth(level) {
  if (level <= 3)  return 'basic definitions and essential facts'
  if (level <= 8)  return 'meaningful connections between concepts'
  if (level <= 18) return 'cross-disciplinary synthesis and hidden patterns'
  if (level <= 30) return 'advanced integration, paradoxes, and original insight'
  return 'master level — reality modeling and the ineffable'
}

export async function generateQuestion(realm, level) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  "insight": "deeper wisdom or mind-expanding connection this reveals",
  "cross_references": ["primary source","related concept"]
}

Rules:
- knowledge_type: empirical | historical | philosophical | esoteric | channeled | speculative
- correct_index: 0-3
- Wrong options must be plausible, not obviously wrong`
      }]
    })
  })

  if (!response.ok) throw new Error(`Anthropic API ${response.status}`)

  const data = await response.json()
  let text = data.content[0].text.trim()
  text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  const parsed = JSON.parse(text)

  const valid = ['empirical','historical','philosophical','esoteric','channeled','speculative']
  if (!valid.includes(parsed.knowledge_type)) parsed.knowledge_type = 'philosophical'

  return parsed
}
