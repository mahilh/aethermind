// AetherMind: HomeScreen · T1 LANE
// Props: { stats, playerName, onBegin }
// T1: implement cosmic portal design (see T1_BOOT.md Task 1)
// Stars from STARS constant · gold ◉ portal · gradient title · player name input · XP bar

import { useState, useEffect } from 'react'
import { STARS, ATTRS } from '../lib/constants'
import { useGameStore } from '../store/useGameStore'
import { getTodayResult, dailyLabel } from './DailyAether'

// Rotating esoteric wisdom (zero em dashes, commas only)
const QUOTES = [
  '"Not how much you know, but how clearly you see the nature of what you know."',
  '"The universe is change, our life is what our thoughts make it."',
  '"As within, so without. As above, so below."',
  '"Seek not outside yourself. The source of all light is within."',
  '"Through every answer, the question deepens."',
  '"Knowledge without wisdom is like water poured into sand."',
  '"The initiate sees what others walk past."',
]

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

export default function HomeScreen({ stats, playerName, onBegin, onDaily }) {
  const { setPlayerName } = useGameStore()
  const [name, setName] = useState(playerName || '')
  const dailyDone = getTodayResult()   // null until today's Daily Aether is completed
  const acc = stats.answered ? Math.round(stats.correct/stats.answered*100) : 0
  const xpPct = Math.min(100, (stats.xp/stats.xpToNext)*100)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [quoteVisible, setQuoteVisible] = useState(true)
  useEffect(() => {
    let inner
    const id = setInterval(() => {
      setQuoteVisible(false)
      inner = setTimeout(() => { setQuoteIdx(q => (q + 1) % QUOTES.length); setQuoteVisible(true) }, 500)
    }, 6000)
    return () => { clearInterval(id); clearTimeout(inner) }
  }, [])

  const F = '"EB Garamond","Georgia",serif'
  const PIXEL = "'Press Start 2P','Courier New',monospace"
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
        <h1 style={{fontSize:'clamp(1.5rem,6vw,3rem)',fontWeight:'bold',letterSpacing:'0.13em',marginBottom:'0.3rem',background:'linear-gradient(135deg,#D4AF37,#A855F7 80%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',margin:'0 0 0.3rem 0'}}>
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
          <div style={{height:'100%',borderRadius:'3px',background:'linear-gradient(90deg,#7B2FBE,#D4AF37,#F0C040,#D4AF37,#7B2FBE)',backgroundSize:'200% 100%',animation:'shimmer 3s linear infinite',width:xpPct+'%',transition:'width 0.6s ease'}}/>
        </div>
        <p style={{fontSize:'0.62rem',color:'rgba(232,217,192,0.28)',marginBottom:'1.5rem',letterSpacing:'0.08em'}}>{stats.xp}/{stats.xpToNext} XP, Level {stats.level+1}</p>
        {/* Player name: a ritual entry, not a form field */}
        <p style={{fontFamily:F,fontSize:'13px',fontStyle:'italic',color:'rgba(212,175,55,0.5)',textAlign:'center',marginBottom:'6px',letterSpacing:'0.04em'}}>Who seeks the AetherMind?</p>
        <input
          className="home-name-input"
          type="text" value={name} maxLength={20}
          onChange={e=>setName(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&handleBegin()}
          placeholder="Enter your name"
          style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(212,175,55,0.3)',borderRadius:'8px',padding:'0.75rem 1rem',color:TEXT,fontFamily:'var(--font-question)',fontSize:'15px',letterSpacing:'0.05em',marginBottom:'1.25rem',outline:'none',textAlign:'center'}}
        />
        {/* Daily Aether: same 5 questions for everyone each day, shareable emoji grid */}
        <button onClick={onDaily} aria-label="Daily Aether challenge"
          style={{width:'100%',background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.45)',borderRadius:'10px',padding:'0.8rem 1rem',marginBottom:'0.9rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'0.6rem',minHeight:'44px',transition:'border-color 0.2s,box-shadow 0.2s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#D4AF37';e.currentTarget.style.boxShadow='0 0 20px rgba(212,175,55,0.25)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(212,175,55,0.45)';e.currentTarget.style.boxShadow='none'}}>
          <span style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:'4px'}}>
            <span style={{fontFamily:PIXEL,fontSize:'11px',color:'#D4AF37',letterSpacing:'1.5px'}}>DAILY AETHER</span>
            <span style={{fontSize:'0.66rem',color:'rgba(232,217,192,0.5)',letterSpacing:'0.05em'}}>{dailyDone ? 'Ascended today, come back tomorrow' : `TODAY'S CHALLENGE · ${dailyLabel()}`}</span>
          </span>
          <span style={{fontFamily:PIXEL,fontSize:'12px',color:dailyDone?'#39FF14':'#D4AF37',whiteSpace:'nowrap'}}>{dailyDone ? `${dailyDone.score}/5 ✓` : '▶'}</span>
        </button>
        {/* Begin (gentle bob on a wrapper so it does not fight the hover scale on the button) */}
        <div style={{animation:'enterBob 3s ease-in-out infinite'}}>
          <button onClick={handleBegin} style={{background:'linear-gradient(135deg,#7B2FBE,#D4AF37)',border:'none',borderRadius:'10px',padding:'1rem 3rem',fontSize:'0.98rem',color:'#050510',fontWeight:'bold',cursor:'pointer',fontFamily:F,letterSpacing:'0.13em',boxShadow:'0 0 40px #9B59B640',transition:'transform 0.2s,box-shadow 0.2s',width:'100%'}}
            onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.03)';e.currentTarget.style.boxShadow='0 0 60px #9B59B670'}}
            onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 0 40px #9B59B640'}}>
            ENTER THE AETHERMIND
          </button>
        </div>
        <p style={{marginTop:'1.8rem',fontSize:'0.75rem',color:'rgba(232,217,192,0.28)',lineHeight:'1.75',fontStyle:'italic',minHeight:'2.6em',opacity:quoteVisible?1:0,transition:'opacity 0.5s ease'}}>
          {QUOTES[quoteIdx]}
        </p>
      </div>
    </div>
  )
}
