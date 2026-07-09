// AetherMind — CharacterSheet · T1 LANE
// Props: { stats, onBack }
import { ATTRS, REALMS, STARS } from '../lib/constants'

const F='"EB Garamond","Georgia",serif',TEXT='#E8D9C0',MUTED='rgba(232,217,192,0.4)'
const navBtn={background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'0.38rem 0.85rem',color:MUTED,cursor:'pointer',fontSize:'0.76rem',fontFamily:F}
const card={background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:'14px',padding:'1.4rem'}

function Stars() {
  return <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>{STARS.map((s,i)=>(
    <div key={i} style={{position:'absolute',left:s.x+'%',top:s.y+'%',width:s.s+'px',height:s.s+'px',background:'#fff',borderRadius:'50%',opacity:s.o,animation:`tw ${3+(i%5)}s ${s.d}s infinite alternate`}}/>
  ))}</div>
}

export default function CharacterSheet({ stats, onBack }) {
  const acc = stats.answered ? Math.round(stats.correct/stats.answered*100) : 0
  const xpPct = Math.min(100,(stats.xp/stats.xpToNext)*100)

  return (
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 50% -5%,#060a22 0%,#050510 55%)',padding:'1.4rem 1.4rem 3rem',fontFamily:F,color:TEXT,position:'relative',overflow:'hidden'}}>
      <Stars/>
      <div style={{position:'relative',maxWidth:'550px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.8rem'}}>
          <button style={navBtn} onClick={onBack}>← Back</button>
          <span style={{fontSize:'0.67rem',letterSpacing:'0.25em',color:MUTED}}>CONSCIOUSNESS PROFILE</span>
          <div style={{width:'60px'}}/>
        </div>
        {/* Level */}
        <div style={{...card,border:'1px solid rgba(212,175,55,0.25)',textAlign:'center',marginBottom:'1.2rem',padding:'2rem'}}>
          <div style={{fontSize:'3.4rem',color:'#D4AF37',fontWeight:'bold',lineHeight:1}}>{stats.level}</div>
          <div style={{fontSize:'0.62rem',letterSpacing:'0.25em',color:MUTED,margin:'0.35rem 0 0.9rem'}}>CONSCIOUSNESS LEVEL</div>
          <div style={{height:'5px',background:'rgba(255,255,255,0.08)',borderRadius:'3px',overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:'3px',background:'linear-gradient(90deg,#7B2FBE,#D4AF37)',width:xpPct+'%',transition:'width 0.6s ease'}}/>
          </div>
          <div style={{fontSize:'0.62rem',color:'rgba(232,217,192,0.28)',marginTop:'0.38rem'}}>{stats.xp} / {stats.xpToNext} XP</div>
        </div>
        {/* Attributes */}
        <div style={{...card,marginBottom:'1.2rem'}}>
          <div style={{fontSize:'0.62rem',letterSpacing:'0.2em',color:MUTED,marginBottom:'1.05rem'}}>ATTRIBUTES</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.05rem'}}>
            {ATTRS.map(a=>(
              <div key={a.key}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.28rem'}}>
                  <span style={{fontSize:'0.76rem',color:a.color}}>{a.label}</span>
                  <span style={{fontSize:'0.68rem',color:MUTED}}>{Math.round(stats.attrs[a.key])}</span>
                </div>
                <div style={{height:'4px',background:'rgba(255,255,255,0.08)',borderRadius:'3px',overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:'3px',background:a.color,boxShadow:`0 0 5px ${a.color}80`,width:`${Math.min(100,stats.attrs[a.key])}%`,transition:'width 0.5s ease'}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Summary */}
        <div style={{...card,marginBottom:'1.2rem'}}>
          <div style={{display:'flex',justifyContent:'space-around'}}>
            {[{v:stats.answered,l:'ANSWERED'},{v:stats.correct,l:'CORRECT'},{v:acc+'%',l:'ACCURACY'}].map(({v,l})=>(
              <div key={l} style={{textAlign:'center'}}>
                <div style={{color:'#D4AF37',fontSize:'1.25rem',fontWeight:'bold'}}>{v}</div>
                <div style={{fontSize:'0.58rem',color:MUTED,letterSpacing:'0.12em'}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Realm performance */}
        {Object.keys(stats.realm).length>0&&(
          <div style={card}>
            <div style={{fontSize:'0.62rem',letterSpacing:'0.2em',color:MUTED,marginBottom:'1rem'}}>REALM PERFORMANCE</div>
            {Object.entries(stats.realm).map(([rid,rs])=>{
              const r=REALMS.find(x=>x.id===parseInt(rid)); if(!r) return null
              const pct=Math.round(rs.c/rs.t*100)
              return (
                <div key={rid} style={{marginBottom:'0.82rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}>
                    <span style={{fontSize:'0.76rem',color:r.color}}>{r.glyph} {r.name}</span>
                    <span style={{fontSize:'0.68rem',color:pct>=70?'#4ADE80':pct>=50?'#FCD34D':'#F87171'}}>{rs.c}/{rs.t}</span>
                  </div>
                  <div style={{height:'4px',background:'rgba(255,255,255,0.08)',borderRadius:'3px',overflow:'hidden'}}>
                    <div style={{height:'100%',borderRadius:'3px',background:r.color,width:`${pct}%`}}/>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
