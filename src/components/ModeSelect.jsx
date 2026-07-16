// AetherMind: ModeSelect · T1 LANE
// Props: { onModeSelect, nav }
// Shown after the player enters a name, before realm selection.
import { useState } from 'react'
import { GAME_MODES, STARS } from '../lib/constants'

const F='"EB Garamond","Georgia",serif'
const PIXEL="'Press Start 2P','Courier New',monospace"
const GOLD='#D4AF37', AMBER='#FCD34D', TEXT='#E8D9C0', MUTED='rgba(232,217,192,0.4)'

function Stars() {
  return <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>{STARS.map((s,i)=>(
    <div key={i} style={{position:'absolute',left:s.x+'%',top:s.y+'%',width:s.s+'px',height:s.s+'px',background:'#fff',borderRadius:'50%',opacity:s.o,animation:`tw ${3+(i%5)}s ${s.d}s infinite alternate`}}/>
  ))}</div>
}

// xpMult 1.0 -> "1x XP", 1.5 -> "1.5x XP", 2.0 -> "2x XP"
const xpLabel = (m) => `${m.xpMult}x XP`

export default function ModeSelect({ onModeSelect, nav }) {
  const [selected, setSelected] = useState('classic')

  return (
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 50% -5%,#140833 0%,#050510 55%)',padding:'1.5rem 1.25rem 2.5rem',fontFamily:F,color:TEXT,position:'relative',overflow:'hidden'}}>
      <Stars/>
      <div style={{position:'relative',maxWidth:'540px',margin:'0 auto'}}>
        {/* Back */}
        {nav&&<button onClick={nav.home} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'0.4rem 0.85rem',color:MUTED,cursor:'pointer',fontSize:'0.76rem',fontFamily:F,marginBottom:'1.7rem'}}>← Home</button>}

        {/* Title */}
        <h1 style={{fontFamily:PIXEL,fontSize:'clamp(11px,3.6vw,15px)',color:GOLD,textAlign:'center',letterSpacing:'3px',lineHeight:1.5,margin:'0 0 2rem',filter:`drop-shadow(0 0 10px ${GOLD}55)`}}>CHOOSE YOUR MODE</h1>

        {/* Mode cards: flex wrap gives 2-2-1 on desktop, 1 per row on mobile, lone 5th auto-centered */}
        <div style={{display:'flex',flexWrap:'wrap',justifyContent:'center',gap:'0.9rem',marginBottom:'2rem'}}>
          {GAME_MODES.map(m=>{
            const on = selected===m.id
            return (
              <button key={m.id} onClick={()=>setSelected(m.id)}
                style={{
                  position:'relative',flex:'1 1 200px',maxWidth:'250px',minHeight:'134px',
                  textAlign:'center',cursor:'pointer',fontFamily:F,color:TEXT,borderRadius:'4px',
                  padding:'1.25rem 1rem 1.7rem',
                  background: on ? '#0D0A1A' : '#0A0A1A',
                  border: on ? '1px solid transparent' : '1px solid rgba(212,175,55,0.2)',
                  boxShadow: on ? `0 0 0 2px ${GOLD}, 0 0 0 4px #04040A, 0 0 0 6px ${GOLD}` : 'none',
                  animation: on ? 'selectedPulse 2s ease-in-out infinite' : undefined,
                  transition:'border-color 0.16s, box-shadow 0.16s, background 0.16s',
                }}
                onMouseEnter={e=>{ if(!on){ e.currentTarget.style.borderColor='rgba(212,175,55,0.5)'; e.currentTarget.style.boxShadow=`0 0 16px ${GOLD}24` } }}
                onMouseLeave={e=>{ if(!on){ e.currentTarget.style.borderColor='rgba(212,175,55,0.2)'; e.currentTarget.style.boxShadow='none' } }}
              >
                <div style={{fontSize:'36px',lineHeight:1,color:GOLD,marginBottom:'0.7rem',filter:`drop-shadow(0 0 8px ${GOLD}55)`}}>{m.icon}</div>
                <div style={{fontFamily:'var(--font-question)',fontWeight:600,fontSize:'16px',color:GOLD,letterSpacing:'0.03em',lineHeight:1.35,marginBottom:'0.55rem'}}>{m.label}</div>
                <div style={{fontFamily:F,fontStyle:'italic',fontSize:'14px',color:MUTED,lineHeight:1.35}}>{m.desc}</div>
                <span style={{position:'absolute',bottom:'0.55rem',right:'0.65rem',fontFamily:PIXEL,fontSize:'7px',color:AMBER,letterSpacing:'0.5px'}}>{xpLabel(m)}</span>
              </button>
            )
          })}
        </div>

        {/* Enter */}
        <button onClick={()=>onModeSelect(selected)}
          style={{width:'100%',background:'linear-gradient(135deg,#E8C766,#D4AF37)',border:'none',borderRadius:'6px',padding:'1rem',color:'#04040A',fontFamily:PIXEL,fontSize:'9px',letterSpacing:'1.5px',cursor:'pointer',boxShadow:`0 0 30px ${GOLD}33`,transition:'transform 0.18s, box-shadow 0.18s'}}
          onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 0 44px ${GOLD}55`}}
          onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 0 30px ${GOLD}33`}}
        >ENTER THE REALM</button>
      </div>
    </div>
  )
}
