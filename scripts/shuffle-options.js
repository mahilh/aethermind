// scripts/shuffle-options.js  (Session 14)  [ES module: package.json has "type":"module"]
// One-time fix: the seed data put the correct answer at options[0] with correct_idx=0 for ALL 118
// questions, so "always tap A" scored 100%. This deterministically reorders each question's options
// (seeded by question id, so the result is reproducible) and updates correct_idx to keep pointing at
// the same correct answer text.
//
// SAFETY: dry-run by DEFAULT. Computes the full plan, asserts for EVERY question that the correct
// answer text is preserved at the new index and that the new options are a true permutation of the
// old ones, and prints the resulting correct_idx distribution. Writes NOTHING unless run with
// `--apply` AND every sanity check passed.
//
// NOTE vs the boot brief's script: (1) the brief's seededShuffle used Math.imul(s,16807), which
// truncates to 32 bits, goes NEGATIVE, and yields negative indices / undefined options; fixed here to
// a correct Park-Miller step (s*16807 is exact in JS since < 2^53). (2) the brief used CommonJS
// require + dotenv; this project is ESM and dotenv may be absent, so env is loaded manually. Writes go
// through the service_role key (present in the shell env), not anon (anon lacks the UPDATE grant).

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

function loadEnv() {
  const env = { ...process.env }
  try {
    const txt = readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
    }
  } catch {}
  return env
}

const env = loadEnv()
const url = env.VITE_SUPABASE_URL
const key = env.SUPABASE_SERVICE_KEY
if (!url || !key) { console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY'); process.exit(1) }
const supabase = createClient(url, key)

const APPLY = process.argv.includes('--apply')

function hashId(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Deterministic Fisher-Yates seeded by a Park-Miller LCG. Full-precision multiply keeps s in
// (0, 2147483647), so j = s % (i+1) is always a valid index in [0, i].
function seededShuffle(arr, seed) {
  const result = [...arr]
  let s = (seed % 2147483646) + 1
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647
    const j = s % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

async function run() {
  const { data: questions, error } = await supabase
    .from('am_questions').select('id, options, correct_idx')
  if (error) throw new Error('Fetch failed: ' + error.message)
  console.log('Mode:', APPLY ? 'APPLY (will write)' : 'DRY-RUN (no writes)')
  console.log('Questions fetched:', questions.length)

  const plan = []
  const failures = []
  const dist = {}

  for (const q of questions) {
    const order = seededShuffle([0, 1, 2, 3], hashId(q.id))
    const newOptions = order.map(i => q.options[i])
    const newCorrectIdx = order.indexOf(q.correct_idx)

    const isPerm = [...order].sort().join(',') === '0,1,2,3'
    const preserved = newOptions[newCorrectIdx] === q.options[q.correct_idx]
    const sameSet = [...newOptions].sort().join('') === [...q.options].sort().join('')
    if (!isPerm || !preserved || !sameSet) {
      failures.push({ id: q.id, isPerm, preserved, sameSet })
      continue
    }
    dist[newCorrectIdx] = (dist[newCorrectIdx] || 0) + 1
    plan.push({ id: q.id, newOptions, newCorrectIdx })
  }

  console.log('New correct_idx distribution:', JSON.stringify(dist))
  console.log('Planned updates:', plan.length, '| sanity failures:', failures.length)
  if (failures.length) { console.error('ABORT: sanity failures', failures.slice(0, 5)); process.exit(1) }
  const spread = Object.keys(dist).length
  if (spread < 2) { console.error('ABORT: shuffle did not vary correct_idx (spread=' + spread + ')'); process.exit(1) }

  if (!APPLY) {
    console.log('\nDRY-RUN OK. All', plan.length, 'sanity-checked; distribution spread across', spread, 'positions.')
    console.log('Re-run with --apply to write.')
    return
  }

  let updated = 0
  for (const p of plan) {
    const { error: uerr } = await supabase.from('am_questions')
      .update({ options: p.newOptions, correct_idx: p.newCorrectIdx }).eq('id', p.id)
    if (uerr) console.error('FAIL', p.id, uerr.message); else updated++
  }
  console.log('Updated:', updated, '/', plan.length)

  const { data: verify } = await supabase.from('am_questions').select('correct_idx')
  const vdist = verify.reduce((a, q) => { a[q.correct_idx] = (a[q.correct_idx] || 0) + 1; return a }, {})
  console.log('POST-APPLY distribution:', JSON.stringify(vdist))
  if (Object.keys(vdist).length < 2) { console.error('FAIL: still single idx'); process.exit(1) }
  console.log('SUCCESS: correct_idx is now varied.')
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
