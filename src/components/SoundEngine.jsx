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
// Called on every answer, so it also RECOVERS a context the OS suspended (mobile screen lock /
// app switch): without the re-resume below, all SFX would go silent for the rest of the session.
export async function initSound() {
  try {
    if (ready) {
      if (ctx && ctx.state === 'suspended') await ctx.resume()
      return
    }
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    ctx = new AC()
    if (ctx.state === 'suspended') await ctx.resume()
    ready = true
  } catch { /* leave ready as-is; a later gesture retries */ }
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

// Shared AudioContext accessor: the ambient music engine reuses the chiptune context (one context,
// one gesture-unlock) instead of spawning a second one that would need its own resume.
export function getAudioCtx() { return ctx }

// Continuous solfeggio ambient drone layered under the chiptune SFX. Four barely-audible harmonics
// that ramp to a per-realm solfeggio frequency over 3s. Additive: it never touches the SFX above.
class AetherMusicEngine {
  constructor() {
    this.ctx = null
    this.nodes = []
    this.masterGain = null
    this.currentFreq = 528
    this.muted = false
    this.initialized = false
  }

  async init(audioCtx) {
    if (this.initialized) return
    this.ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)()
    if (this.ctx.state === 'suspended') await this.ctx.resume()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.035, this.ctx.currentTime)
    this.masterGain.connect(this.ctx.destination)
    this._buildLayers(this.currentFreq)
    this.initialized = true
  }

  _buildLayers(freq) {
    this.nodes.forEach(n => { try { n.stop() } catch (e) { /* already stopped */ } })
    this.nodes = []
    const ctx = this.ctx
    const now = ctx.currentTime
    const specs = [
      { type: 'sine', mult: 1, vol: 0.50 },
      { type: 'triangle', mult: 1.5, vol: 0.25 },
      { type: 'sine', mult: 2, vol: 0.15 },
      { type: 'triangle', mult: 3, vol: 0.07 },
    ]
    specs.forEach(({ type, mult, vol }) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq * mult, now)
      g.gain.setValueAtTime(vol * 0.08, now)
      osc.connect(g)
      g.connect(this.masterGain)
      osc.start(now)
      this.nodes.push(osc)
    })
  }

  setRealm(realmName) {
    const freqMap = {
      'Ancient Civilizations': 963,
      'Hermetic Wisdom': 852,
      'Gnosticism': 741,
      'Eastern Traditions': 639,
      'Consciousness': 528,
      'Psychology': 396,
      'Quantum Physics': 432,
      'Esoteric Science': 285,
      'Comparative Religion': 417,
      'Hidden History': 174,
      'Symbolism': 528,
      'Ethics & Wisdom': 432,
    }
    const target = freqMap[realmName] || 528
    if (!this.initialized || target === this.currentFreq) return
    const now = this.ctx.currentTime
    const mults = [1, 1.5, 2, 3]
    this.nodes.forEach((osc, i) => {
      osc.frequency.linearRampToValueAtTime(target * mults[i], now + 3)
    })
    this.currentFreq = target
  }

  setMuted(muted) {
    this.muted = muted
    if (!this.masterGain) return
    const now = this.ctx.currentTime
    this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.035, now, 0.3)
  }

  stop() {
    this.nodes.forEach(n => { try { n.stop() } catch (e) { /* already stopped */ } })
    this.nodes = []
    this.initialized = false
  }
}

export const aetherMusic = new AetherMusicEngine()
