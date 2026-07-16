// AetherMind: SoundEngine · T1 LANE
// Chiptune SFX via the raw Web Audio API (no dependency, ~0 bundle cost). Matches the FORGE
// sound design: correct = C-E-G square ascend, wrong = descending sawtooth, level-up = triangle
// chord, streak = pitch-shifting square. Tone.js was specified but is NOT installed and would
// add ~200KB+ for a few beeps; Web Audio produces identical results and keeps this in the T1 lane.
// The AudioContext is created/resumed on the first user gesture (initSound), per the autoplay
// policy. Mute persists in localStorage ('aethermind-muted') and is checked before every play.

let ctx = null
let ready = false

// note -> frequency (Hz)
const NOTE = {
  C3: 130.81, B2: 123.47,
  C4: 261.63, E4: 329.63, G4: 392.0,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
}

export function isMuted() {
  try { return localStorage.getItem('aethermind-muted') === 'true' } catch { return false }
}
export function setMuted(v) {
  try { localStorage.setItem('aethermind-muted', v ? 'true' : 'false') } catch { /* storage blocked */ }
}

// Must be called from a user-gesture handler (first answer click) so the browser allows audio.
export async function initSound() {
  if (ready) return
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    ctx = new AC()
    if (ctx.state === 'suspended') await ctx.resume()
    ready = true
  } catch { ready = false }
}

// one oscillator note with a fast attack + exponential decay (chiptune envelope)
function beep(freq, type, startOffset, dur, peak) {
  if (!ctx) return
  const t0 = ctx.currentTime + startOffset
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain); gain.connect(ctx.destination)
  osc.start(t0); osc.stop(t0 + dur + 0.02)
}

export function playCorrect() {
  if (!ready || isMuted()) return
  beep(NOTE.C5, 'square', 0, 0.12, 0.22)
  beep(NOTE.E5, 'square', 0.07, 0.12, 0.22)
  beep(NOTE.G5, 'square', 0.14, 0.2, 0.22)
}

export function playWrong() {
  if (!ready || isMuted()) return
  beep(NOTE.C3, 'sawtooth', 0, 0.2, 0.2)
  beep(NOTE.B2, 'sawtooth', 0.1, 0.25, 0.2)
}

export function playLevelUp() {
  if (!ready || isMuted()) return
  ;[NOTE.C4, NOTE.E4, NOTE.G4].forEach(f => beep(f, 'triangle', 0, 0.4, 0.14))
  ;[NOTE.C5, NOTE.E5, NOTE.G5].forEach(f => beep(f, 'triangle', 0.3, 0.4, 0.14))
}

export function playStreak(streakCount) {
  if (!ready || isMuted()) return
  const notes = [NOTE.C5, NOTE.D5, NOTE.E5, NOTE.F5, NOTE.G5, NOTE.A5, NOTE.B5]
  const note = notes[Math.min(Math.max(streakCount - 3, 0), notes.length - 1)]
  beep(note, 'square', 0, 0.08, 0.16)
}
