// AetherMind: GauntletComplete screen (Realm Gauntlet, 10 cleared) · T1 LANE
// Rendered by QuizScreen when gauntletCount reaches 10 in Realm Gauntlet.
// Props: { realm, sessionScore, onForgeAgain, onChooseRealm }
import { useState, useRef, useEffect } from 'react'
import { STARS } from '../lib/constants'
import { useGameStore } from '../store/useGameStore'
import { copyShareResult } from './shareResult'

const F = '"EB Garamond","Georgia",serif'
const PIXEL = "'Press Start 2P','Courier New',monospace"
const GREEN = '#39FF14'
const GOLD = '#D4AF37'

function StarField() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {STARS.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: s.x + '%', top: s.y + '%',
          width: s.s + 'px', height: s.s + 'px', background: '#fff',
          borderRadius: '50%', opacity: s.o * 0.7,
          animation: `tw ${3 + (i % 5)}s ${s.d}s infinite alternate`,
        }} />
      ))}
    </div>
  )
}

export default function GauntletComplete({ realm, sessionScore, onForgeAgain, onChooseRealm }) {
  const c = sessionScore?.c ?? 0
  const t = sessionScore?.t ?? 0
  const acc = t ? Math.round(c / t * 100) : 0
  const xp = useGameStore(s => s.stats.xp)
  const level = useGameStore(s => s.stats.level)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef(null)
  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current) }, [])
  const handleShare = async () => {
    const ok = await copyShareResult({ xp, realm: realm?.name, accuracy: acc, level })
    if (!ok) return
    setCopied(true)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#04040A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', fontFamily: F, position: 'relative', overflow: 'hidden' }}>
      <StarField />
      <div style={{ position: 'relative', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        <div style={{ fontFamily: PIXEL, fontSize: 'clamp(18px,5vw,24px)', color: GREEN, marginBottom: '1.3rem', animation: 'pulse 2.4s ease-in-out infinite' }}>✓</div>
        <div style={{ fontFamily: PIXEL, fontSize: 'clamp(11px,3.2vw,16px)', color: GREEN, textShadow: '0 0 20px rgba(57,255,20,0.55)', letterSpacing: '1px', lineHeight: '1.7' }}>GAUNTLET COMPLETE</div>
        <div style={{ fontFamily: PIXEL, fontSize: '7px', color: GOLD, marginTop: '1.1rem', lineHeight: '1.9', letterSpacing: '0.5px' }}>{realm?.name || ''}</div>
        <div style={{ fontFamily: PIXEL, fontSize: '6px', color: '#888', marginTop: '0.85rem', letterSpacing: '0.5px' }}>{c} / {t} · {acc}% ACCURACY</div>
        <div style={{ height: '1px', background: 'rgba(212,175,55,0.15)', width: '100%', margin: '24px 0' }} />
        <p style={{ fontFamily: F, fontStyle: 'italic', fontSize: '16px', color: GOLD, lineHeight: '1.7', maxWidth: '400px', margin: '0 auto' }}>
          The initiate who endures ten trials has earned the sight.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '32px' }}>
          <button
            onClick={onForgeAgain}
            style={{ width: '100%', border: 'none', borderRadius: '8px', padding: '0.95rem', fontFamily: PIXEL, fontSize: '8px', color: '#04040A', background: 'linear-gradient(90deg,#39FF14 0%,#D4AF37 100%)', cursor: 'pointer', letterSpacing: '1px', lineHeight: '1.7', transition: 'filter 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.12)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
          >FORGE AGAIN</button>
          <button
            onClick={onChooseRealm}
            style={{ width: '100%', background: '#0A0A1A', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px', padding: '0.85rem', fontFamily: PIXEL, fontSize: '7px', color: GOLD, cursor: 'pointer', letterSpacing: '1px', lineHeight: '1.7', transition: 'background 0.18s, border-color 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#12122A'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0A0A1A'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)' }}
          >CHOOSE REALM</button>
          <button
            onClick={handleShare}
            aria-live="polite"
            style={{ width: '100%', background: 'transparent', border: `1px solid ${copied ? 'rgba(212,175,55,0.4)' : 'rgba(212,175,55,0.14)'}`, borderRadius: '8px', padding: '0.7rem', fontFamily: PIXEL, fontSize: '7px', color: copied ? GOLD : 'rgba(232,217,192,0.4)', cursor: 'pointer', letterSpacing: '1px', lineHeight: '1.7', transition: 'color 0.18s, border-color 0.18s' }}
            onMouseEnter={e => { if (!copied) { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)' } }}
            onMouseLeave={e => { if (!copied) { e.currentTarget.style.color = 'rgba(232,217,192,0.4)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.14)' } }}
          >{copied ? 'COPIED ✓' : 'SHARE RESULT'}</button>
        </div>
      </div>
    </div>
  )
}
