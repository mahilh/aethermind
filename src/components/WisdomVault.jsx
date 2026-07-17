// AetherMind: WisdomVault (Learning Cards) · T1 LANE
// Props: { cards, cardOpen, onToggle, onBack }  (cardOpen/onToggle now unused: flip state is local)
import { useState } from 'react'
import { STARS } from '../lib/constants'

const F='"EB Garamond","Georgia",serif',TEXT='#E8D9C0',MUTED='rgba(232,217,192,0.4)'
const PIXEL="'Press Start 2P','Courier New',monospace"
const navBtn={background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'0.38rem 0.85rem',color:MUTED,cursor:'pointer',fontSize:'0.76rem',fontFamily:F}

// Knowledge-type difficulty rank for the HARDEST sort. The spec's "wrong on a high-accuracy realm"
// needs per-realm accuracy, which is not passed to this screen; knowledge-type rarity is the
// available proxy (channeled/speculative are the hardest to have gotten wrong meaningfully).
const KT_RANK = { channeled:5, speculative:4, esoteric:3, philosophical:2, historical:1, empirical:0 }

function Stars() {
  return <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>{STARS.map((s,i)=>(
    <div key={i} style={{position:'absolute',left:s.x+'%',top:s.y+'%',width:s.s+'px',height:s.s+'px',background:'#fff',borderRadius:'50%',opacity:s.o,animation:`tw ${3+(i%5)}s ${s.d}s infinite alternate`}}/>
  ))}</div>
}

export default function WisdomVault({ cards, onBack }) {
  const [flipped, setFlipped] = useState({})   // card id -> flipped (showing explanation)
  const [sortBy, setSortBy] = useState('recent')

  // Dedup by question text: the store pushes a fresh card on every wrong answer (id is a
  // timestamp, not the question id), so re-missing the same question would list it twice.
  // Walk newest-first and keep only the most recent card per question. Root-cause dedup on
  // add is a store change flagged to T2.
  const seen = new Set()
  const unique = []
  for (let i = cards.length - 1; i >= 0; i--) {
    if (!seen.has(cards[i].question)) { seen.add(cards[i].question); unique.push(cards[i]) }
  }
  const sorted = [...unique]                                                  // already most recent first
  if (sortBy === 'hardest') sorted.sort((a,b) => (KT_RANK[b.kt]||0) - (KT_RANK[a.kt]||0))  // hardest concepts first

  const toggle = (id) => setFlipped(f => ({ ...f, [id]: !f[id] }))

  return (
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 50% -5%,#1a0800 0%,#050510 55%)',padding:'1.4rem 1.4rem 3rem',fontFamily:F,color:TEXT,position:'relative',overflow:'hidden'}}>
      <Stars/>
      <div style={{position:'relative',maxWidth:'580px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.4rem'}}>
          <button style={navBtn} onClick={onBack}>← Back</button>
          <span style={{fontSize:'0.67rem',letterSpacing:'0.25em',color:MUTED}}>📚 WISDOM VAULT</span>
          <span style={{fontSize:'0.68rem',color:MUTED}}>{unique.length} card{unique.length!==1?'s':''}</span>
        </div>

        {unique.length>0 && (
          <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'1.2rem'}}>
            {['recent','hardest'].map(s=>(
              <button key={s} onClick={()=>setSortBy(s)} style={{fontFamily:PIXEL,fontSize:'9px',color:sortBy===s?'#04040A':'#D4AF37',background:sortBy===s?'#D4AF37':'transparent',border:'1px solid rgba(212,175,55,0.5)',borderRadius:'6px',padding:'7px 12px',cursor:'pointer',transition:'all 0.2s ease'}}>{s==='recent'?'RECENT':'HARDEST'}</button>
            ))}
          </div>
        )}

        {unique.length===0 ? (
          <div style={{textAlign:'center',padding:'4rem 2rem'}}>
            <div style={{fontSize:'3.5rem',marginBottom:'1.2rem',color:'#D4AF37',filter:'drop-shadow(0 0 10px rgba(212,175,55,0.4))'}}>📚</div>
            <div style={{fontFamily:'var(--font-question)',fontStyle:'italic',lineHeight:'1.75',fontSize:'1.02rem',color:'#D4AF37',letterSpacing:'0.02em'}}>The vault fills as you learn.<br/>Every wrong answer becomes a lesson.</div>
          </div>
        ) : (
          sorted.map((c)=>{
            const isFlipped = !!flipped[c.id]
            return (
              <div key={c.id} style={{animation:'fadeInUp 0.4s ease-out both'}}>
              <div onClick={()=>toggle(c.id)} style={{background:`${c.color}08`,border:`1px solid ${c.color}25`,borderRadius:'12px',padding:'1.1rem',marginBottom:'0.72rem',cursor:'pointer',transition:'border-color 0.18s',animation:isFlipped?'cardFlip 0.5s ease':undefined}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=`${c.color}55`}
                onMouseLeave={e=>e.currentTarget.style.borderColor=`${c.color}25`}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.6rem'}}>
                  <span style={{fontFamily:PIXEL,fontSize:'9px',color:'rgba(212,175,55,0.7)',letterSpacing:'0.5px'}}>{c.realm}</span>
                  <span style={{fontSize:'0.63rem',color:MUTED}}>{c.date} {isFlipped?'▲':'▼'}</span>
                </div>
                {!isFlipped ? (
                  <>
                    <div style={{fontSize:'0.86rem',marginBottom:'0.55rem',lineHeight:'1.55'}}>{c.question}</div>
                    <div style={{fontSize:'0.76rem'}}>
                      <span style={{color:'#F87171'}}>✗ {c.wrong}</span>
                      <span style={{color:'rgba(232,217,192,0.22)',margin:'0 0.45rem'}}>→</span>
                      <span style={{color:'#4ADE80'}}>✓ {c.correct}</span>
                    </div>
                  </>
                ) : (
                  <div>
                    <p style={{fontSize:'0.82rem',lineHeight:'1.75',color:'rgba(232,217,192,0.75)',marginBottom:'0.75rem'}}>{c.explanation}</p>
                    {c.insight&&<div style={{color:c.color,fontSize:'0.77rem',fontStyle:'italic'}}>✧ {c.insight}</div>}
                  </div>
                )}
              </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
