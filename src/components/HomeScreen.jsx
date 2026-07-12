// AetherMind: HomeScreen · T1 LANE
// Props: { stats, playerName, onBegin }
// T1: implement cosmic portal design (see T1_BOOT.md Task 1)
// Stars from STARS constant · gold ◉ portal · gradient title · player name input · XP bar

import { useState } from 'react'
import { STARS, ATTRS } from '../lib/constants'
import { useGameStore } from '../store/useGameStore'

function Stars() {
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>
      {STARS.map((s,i) => (
        <div key={i} style={{
          position:'absolute', left:s.x+'%', top:s.y+'%',
          width:s.s+'px', height:s.s+'px', background:'#fff', borderRadius:'50%',
          opacity:s.o, animation:`tw ${3+(i%5)}s ${s.d}s infinite alternate ease-in-out`,
        }}/>
      ))}
    </div>
  )
}

export default function HomeScreen({ stats, playerName, onBegin }) {
  const { setPlayerName } = useGameStore()
  const [name, setName] = useState(playerName || '')
  const acc = stats.answered ? Math.round(stats.correct/stats.answered*100) : 0
  const xpPct = Math.min(100, (stats.xp/stats.xpToNext)*100)

  const F = '"EB Garamond","Georgia",serif'
  const TEXT = '#E8D9C0'
  const MUTED = 'rgba(232,217,192,0.4)'

  const handleBegin = () => {
    if (name.trim()) setPlayerName(name.trim())
    onBegin()
  }

  return (
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 50% -5%,#1e0640 0%,#050510 58%)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',fontFamily:F,color:TEXT,position:'relative',overflow:'hidden'}}>
      <Stars/>
      <div style={{position:'relative',textAlign:'center',maxWidth:'520px',width:'100%'}}>
        {/* Portal */}
        <div style={{fontSize:'5rem',lineHeight:1,marginBottom:'1.2rem',color:'#D4AF37',filter:'drop-shadow(0 0 24px #D4AF3770)',animation:'pulse 4s ease-in-out infinite'}}>◉</div>
        {/* Title */}
        <h1 style={{fontSize:'clamp(1.5rem,4vw,2.3rem)',fontWeight:'bold',letterSpacing:'0.13em',marginBottom:'0.3rem',background:'linear-gradient(135deg,#D4AF37,#A855F7 80%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',margin:'0 0 0.3rem 0'}}>
          AETHERMIND
        </h1>
        <p style={{fontSize:'0.68rem',letterSpacing:'0.3em',color:MUTED,marginBottom:'2rem'}}>MEASURE · EXPAND · TRANSCEND</p>
        {/* Stats */}
        <div style={{display:'flex',gap:'0.9rem',justifyContent:'center',marginBottom:'1.5rem'}}>
          {[{v:`Lv.${stats.level}`,l:'LEVEL'},{v:stats.answered,l:'ANSWERED'},{v:acc+'%',l:'ACCURACY'}].map(({v,l})=>(
            <div key={l} style={{background:'rgba(212,175,55,0.08)',border:'1px solid rgba(212,175,55,0.22)',borderRadius:'12px',padding:'0.85rem 1.2rem',minWidth:'70px'}}>
              <div style={{fontSize:'1.25rem',color:'#D4AF37',fontWeight:'bold'}}>{v}</div>
              <div style={{fontSize:'0.58rem',letterSpacing:'0.14em',color:MUTED,marginTop:'0.2rem'}}>{l}</div>
            </div>
          ))}
        </div>
        {/* XP bar */}
        <div style={{height:'5px',background:'rgba(255,255,255,0.08)',borderRadius:'3px',overflow:'hidden',marginBottom:'0.4rem'}}>
          <div style={{height:'100%',borderRadius:'3px',background:'linear-gradient(90deg,#7B2FBE,#D4AF37)',width:xpPct+'%',transition:'width 0.6s ease'}}/>
        </div>
        <p style={{fontSize:'0.62rem',color:'rgba(232,217,192,0.28)',marginBottom:'1.5rem',letterSpacing:'0.08em'}}>{stats.xp}/{stats.xpToNext} XP, Level {stats.level+1}</p>
        {/* Player name */}
        <input
          type="text" value={name} maxLength={20}
          onChange={e=>setName(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&handleBegin()}
          placeholder="Enter your name (optional)"
          style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(212,175,55,0.3)',borderRadius:'8px',padding:'0.75rem 1rem',color:TEXT,fontSize:'0.9rem',marginBottom:'1.25rem',outline:'none',textAlign:'center'}}
        />
        {/* Begin */}
        <button onClick={handleBegin} style={{background:'linear-gradient(135deg,#7B2FBE,#D4AF37)',border:'none',borderRadius:'10px',padding:'1rem 3rem',fontSize:'0.98rem',color:'#050510',fontWeight:'bold',cursor:'pointer',fontFamily:F,letterSpacing:'0.13em',boxShadow:'0 0 40px #9B59B640',transition:'transform 0.2s,box-shadow 0.2s',width:'100%'}}
          onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.03)';e.currentTarget.style.boxShadow='0 0 60px #9B59B670'}}
          onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 0 40px #9B59B640'}}>
          ENTER THE AETHERMIND
        </button>
        <p style={{marginTop:'1.8rem',fontSize:'0.75rem',color:'rgba(232,217,192,0.28)',lineHeight:'1.75',fontStyle:'italic'}}>
          "Not how much you know, but how clearly you see the nature of what you know."
        </p>
      </div>
    </div>
  )
}
