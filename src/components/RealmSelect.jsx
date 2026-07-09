// AetherMind — RealmSelect · T1 LANE
// Props: { stats, learningCardsCount, onPick, nav }
import { REALMS, STARS } from '../lib/constants'

const F='"EB Garamond","Georgia",serif',TEXT='#E8D9C0',MUTED='rgba(232,217,192,0.4)'
const navBtn={background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'0.4rem 0.85rem',color:MUTED,cursor:'pointer',fontSize:'0.76rem',fontFamily:F}

function Stars() {
  return <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>{STARS.map((s,i)=>(
    <div key={i} style={{position:'absolute',left:s.x+'%',top:s.y+'%',width:s.s+'px',height:s.s+'px',background:'#fff',borderRadius:'50%',opacity:s.o,animation:`tw ${3+(i%5)}s ${s.d}s infinite alternate`}}/>
  ))}</div>
}

export default function RealmSelect({ stats, learningCardsCount, onPick, nav }) {
  const xpPct = Math.min(100,(stats.xp/stats.xpToNext)*100)
  return (
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 50% -5%,#0d0028 0%,#050510 55%)',padding:'1.4rem 1.4rem 3rem',fontFamily:F,color:TEXT,position:'relative',overflow:'hidden'}}>
      <Stars/>
      <div style={{position:'relative',maxWidth:'870px',margin:'0 auto'}}>
        {/* Nav */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.4rem'}}>
          <button style={navBtn} onClick={nav.home}>← Home</button>
          <span style={{fontSize:'0.67rem',letterSpacing:'0.25em',color:MUTED}}>CHOOSE YOUR REALM</span>
          <div style={{display:'flex',gap:'0.5rem'}}>
            {learningCardsCount>0&&<button style={{...navBtn,color:'#FB923C'}} onClick={nav.cards}>📚 {learningCardsCount}</button>}
            <button style={{...navBtn,color:'#D4AF37'}} onClick={nav.character}>◉ Lv.{stats.level}</button>
            <button style={{...navBtn,color:'#6EE7B7'}} onClick={nav.leaderboard}>🌍</button>
          </div>
        </div>
        {/* XP bar */}
        <div style={{marginBottom:'1.8rem'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.38rem'}}>
            <span style={{color:'#D4AF37',fontSize:'0.78rem'}}>Level {stats.level}</span>
            <span style={{fontSize:'0.68rem',color:MUTED}}>{stats.xp}/{stats.xpToNext} XP</span>
          </div>
          <div style={{height:'5px',background:'rgba(255,255,255,0.08)',borderRadius:'3px',overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:'3px',background:'linear-gradient(90deg,#7B2FBE,#D4AF37)',width:xpPct+'%'}}/>
          </div>
        </div>
        {/* Realm grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'0.8rem'}}>
          {REALMS.map(r=>{
            const rs=stats.realm[String(r.id)], pct=rs?Math.round(rs.c/rs.t*100):null
            return (
              <button key={r.id} onClick={()=>onPick(r)} style={{background:`${r.color}0d`,border:`1px solid ${r.color}30`,borderRadius:'12px',padding:'1.1rem',cursor:'pointer',textAlign:'left',fontFamily:F,color:TEXT,transition:'border-color 0.18s,box-shadow 0.18s,transform 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=r.color;e.currentTarget.style.boxShadow=`0 0 18px ${r.color}30`;e.currentTarget.style.transform='translateY(-2px)'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=`${r.color}30`;e.currentTarget.style.boxShadow='none';e.currentTarget.style.transform='translateY(0)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.45rem'}}>
                  <span style={{fontSize:'1.55rem',lineHeight:1,color:r.color,filter:`drop-shadow(0 0 6px ${r.color}60)`}}>{r.glyph}</span>
                  {pct!==null&&<span style={{fontSize:'0.68rem',padding:'0.12rem 0.48rem',borderRadius:'20px',background:pct>=70?'#4ADE8020':pct>=50?'#FCD34D20':'#F8717120',color:pct>=70?'#4ADE80':pct>=50?'#FCD34D':'#F87171',border:`1px solid ${pct>=70?'#4ADE8040':pct>=50?'#FCD34D40':'#F8717140'}`}}>{pct}%</span>}
                </div>
                <div style={{fontSize:'0.86rem',fontWeight:'bold',color:r.color,marginBottom:'0.28rem'}}>{r.name}</div>
                <div style={{fontSize:'0.66rem',color:MUTED,lineHeight:'1.4'}}>{r.desc}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
