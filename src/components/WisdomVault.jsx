// AetherMind: WisdomVault (Learning Cards) · T1 LANE
// Props: { cards, cardOpen, onToggle, onBack }
import { STARS } from '../lib/constants'

const F='"EB Garamond","Georgia",serif',TEXT='#E8D9C0',MUTED='rgba(232,217,192,0.4)'
const navBtn={background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'0.38rem 0.85rem',color:MUTED,cursor:'pointer',fontSize:'0.76rem',fontFamily:F}

function Stars() {
  return <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>{STARS.map((s,i)=>(
    <div key={i} style={{position:'absolute',left:s.x+'%',top:s.y+'%',width:s.s+'px',height:s.s+'px',background:'#fff',borderRadius:'50%',opacity:s.o,animation:`tw ${3+(i%5)}s ${s.d}s infinite alternate`}}/>
  ))}</div>
}

export default function WisdomVault({ cards, cardOpen, onToggle, onBack }) {
  return (
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 50% -5%,#1a0800 0%,#050510 55%)',padding:'1.4rem 1.4rem 3rem',fontFamily:F,color:TEXT,position:'relative',overflow:'hidden'}}>
      <Stars/>
      <div style={{position:'relative',maxWidth:'580px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.8rem'}}>
          <button style={navBtn} onClick={onBack}>← Back</button>
          <span style={{fontSize:'0.67rem',letterSpacing:'0.25em',color:MUTED}}>📚 WISDOM VAULT</span>
          <span style={{fontSize:'0.68rem',color:MUTED}}>{cards.length} card{cards.length!==1?'s':''}</span>
        </div>
        {cards.length===0?(
          <div style={{textAlign:'center',padding:'4rem 2rem',color:MUTED}}>
            <div style={{fontSize:'3.5rem',marginBottom:'1rem'}}>📚</div>
            <div style={{lineHeight:'1.75',fontSize:'0.88rem'}}>Your Wisdom Vault is empty.<br/>Every wrong answer becomes a card to revisit.</div>
          </div>
        ):(
          [...cards].reverse().map((c,ri)=>{
            const i=cards.length-1-ri, isOpen=cardOpen===i
            return (
              <div key={c.id} onClick={()=>onToggle(i)} style={{background:`${c.color}08`,border:`1px solid ${c.color}25`,borderRadius:'12px',padding:'1.1rem',marginBottom:'0.72rem',cursor:'pointer',transition:'border-color 0.18s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=`${c.color}55`}
                onMouseLeave={e=>e.currentTarget.style.borderColor=`${c.color}25`}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.45rem'}}>
                  <span style={{fontSize:'0.63rem',color:c.color,letterSpacing:'0.08em'}}>{c.realm}</span>
                  <span style={{fontSize:'0.63rem',color:MUTED}}>{c.date} {isOpen?'▲':'▼'}</span>
                </div>
                <div style={{fontSize:'0.86rem',marginBottom:'0.55rem',lineHeight:'1.55'}}>{c.question}</div>
                <div style={{fontSize:'0.76rem'}}>
                  <span style={{color:'#F87171'}}>✗ {c.wrong}</span>
                  <span style={{color:'rgba(232,217,192,0.22)',margin:'0 0.45rem'}}>→</span>
                  <span style={{color:'#4ADE80'}}>✓ {c.correct}</span>
                </div>
                {isOpen&&(
                  <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
                    <p style={{fontSize:'0.82rem',lineHeight:'1.75',color:'rgba(232,217,192,0.75)',marginBottom:'0.75rem'}}>{c.explanation}</p>
                    {c.insight&&<div style={{color:c.color,fontSize:'0.77rem',fontStyle:'italic'}}>✧ {c.insight}</div>}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
