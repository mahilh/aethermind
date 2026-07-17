// AetherMind: Leaderboard · T1 LANE
// Props: { leaderboard, playerName, onBack }
import { useState, useEffect } from 'react'
import { STARS } from '../lib/constants'
import { getLeaderboard } from '../lib/supabase'

const F='"EB Garamond","Georgia",serif',TEXT='#E8D9C0',MUTED='rgba(232,217,192,0.4)'
const navBtn={background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'0.38rem 0.85rem',color:MUTED,cursor:'pointer',fontSize:'0.76rem',fontFamily:F}

const MEDALS = ['🥇','🥈','🥉']

function Stars() {
  return <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>{STARS.map((s,i)=>(
    <div key={i} style={{position:'absolute',left:s.x+'%',top:s.y+'%',width:s.s+'px',height:s.s+'px',background:'#fff',borderRadius:'50%',opacity:s.o,animation:`tw ${3+(i%5)}s ${s.d}s infinite alternate`}}/>
  ))}</div>
}

function timeAgo(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff/60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export default function Leaderboard({ leaderboard, playerName, onBack }) {
  const acc = (c,t) => t ? Math.round(c/t*100) : 0
  const [period, setPeriod] = useState('all')
  const [weekEntries, setWeekEntries] = useState(null)  // null = not yet fetched (distinguishes loading from genuinely empty)
  // 'all' uses the realtime prop from App; 'week' fetches a snapshot on demand.
  useEffect(() => {
    if (period !== 'week') return
    getLeaderboard('week').then(setWeekEntries).catch(() => setWeekEntries([]))
  }, [period])
  const entries = period === 'week' ? (weekEntries ?? []) : leaderboard
  const weekLoading = period === 'week' && weekEntries === null

  return (
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 50% -5%,#001a2e 0%,#050510 55%)',padding:'1.4rem 1.4rem 3rem',fontFamily:F,color:TEXT,position:'relative',overflow:'hidden'}}>
      <Stars/>
      <div style={{position:'relative',maxWidth:'600px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.8rem'}}>
          <button style={navBtn} onClick={onBack}>← Back</button>
          <div style={{textAlign:'center'}}>
            <span style={{fontSize:'0.67rem',letterSpacing:'0.25em',color:MUTED}}>🌍 GLOBAL INDEX</span>
            <span style={{marginLeft:'0.75rem',fontSize:'0.55rem',padding:'0.12rem 0.5rem',borderRadius:'20px',background:'rgba(74,222,128,0.15)',color:'#4ADE80',border:'1px solid rgba(74,222,128,0.3)',letterSpacing:'0.1em',animation:'pulse 2s infinite'}}>LIVE</span>
          </div>
          <div style={{width:'60px'}}/>
        </div>

        {/* All-time / weekly tabs */}
        <div style={{display:'flex',gap:'8px',marginBottom:'16px',justifyContent:'center'}}>
          {['all','week'].map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              fontFamily:'"Press Start 2P",monospace', fontSize:'9px',
              color: period===p ? '#04040A' : '#D4AF37',
              background: period===p ? '#D4AF37' : 'transparent',
              border:'1px solid rgba(212,175,55,0.5)', borderRadius:'6px',
              padding:'7px 12px', cursor:'pointer', transition:'all 0.2s ease',
            }}>{p==='all' ? 'ALL TIME' : 'THIS WEEK'}</button>
          ))}
        </div>

        {weekLoading ? (
          <div style={{textAlign:'center',padding:'4rem 2rem',color:MUTED}}>
            <div style={{fontSize:'2.5rem',marginBottom:'1rem',color:'#D4AF37',animation:'spin 3s linear infinite'}}>◉</div>
            <div style={{lineHeight:'1.75',fontSize:'0.82rem',letterSpacing:'0.1em'}}>Consulting this week's index...</div>
          </div>
        ) : entries.length === 0 ? (
          <div style={{textAlign:'center',padding:'2.5rem 2rem'}}>
            <div style={{fontSize:'3.5rem',marginBottom:'1.1rem',opacity:0.85}}>🌍</div>
            <div style={{fontFamily:'"Cinzel","Times New Roman",Georgia,serif',fontStyle:'italic',fontSize:'1.08rem',color:'#D4AF37',lineHeight:'1.65',letterSpacing:'0.02em'}}>
              {period==='week'
                ? <>No ascensions this week.<br/>Claim the board.</>
                : <>No souls registered yet.<br/>Be the first to ascend.</>}
            </div>
          </div>
        ) : (
          <>
            {/* Top 3 */}
            <div style={{display:'flex',flexDirection:'column',gap:'0.6rem',marginBottom:'1rem'}}>
              {entries.slice(0,3).map((p,i) => {
                const isMe = p.player_name === playerName
                const borderColor = i===0?'rgba(212,175,55,0.5)':i===1?'rgba(192,192,192,0.4)':'rgba(205,127,50,0.4)'
                const bg = i===0?'rgba(212,175,55,0.1)':i===1?'rgba(192,192,192,0.08)':'rgba(205,127,50,0.08)'
                const pct = acc(p.total_correct,p.total_answered)
                return (
                  <div key={p.player_name} style={{background:bg,border:`1px solid ${isMe?'rgba(212,175,55,0.7)':borderColor}`,borderRadius:'14px',padding:'1.1rem 1.3rem',display:'flex',alignItems:'center',gap:'1rem',boxShadow:isMe?'0 0 20px rgba(212,175,55,0.2)':'none'}}>
                    <span style={{fontSize:'1.8rem',flexShrink:0}}>{MEDALS[i]}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:'bold',fontSize:'1rem',color:isMe?'#D4AF37':TEXT,marginBottom:'0.2rem'}}>
                        {p.player_name} {isMe&&'(you)'}
                      </div>
                      <div style={{fontSize:'0.7rem',color:MUTED}}>Level {p.level} · {pct}% accuracy · {timeAgo(p.updated_at)}</div>
                      {p.max_streak > 0 && <div style={{marginTop:'0.25rem',fontFamily:'"Press Start 2P",monospace',fontSize:'9px',color:'#F59E0B'}}>{p.max_streak} STREAK</div>}
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'1.3rem',color:'#D4AF37',fontWeight:'bold'}}>{p.xp}</div>
                      <div style={{fontSize:'0.55rem',color:MUTED,letterSpacing:'0.12em'}}>XP</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Rest */}
            {entries.slice(3).map((p,i) => {
              const isMe = p.player_name === playerName
              const pct = acc(p.total_correct,p.total_answered)
              return (
                <div key={p.player_name} style={{background:isMe?'rgba(212,175,55,0.06)':'rgba(255,255,255,0.02)',border:`1px solid ${isMe?'rgba(212,175,55,0.4)':'rgba(255,255,255,0.07)'}`,borderRadius:'10px',padding:'0.75rem 1rem',marginBottom:'0.5rem',display:'flex',alignItems:'center',gap:'0.75rem'}}>
                  <span style={{fontSize:'0.75rem',color:MUTED,minWidth:'1.5rem',textAlign:'right'}}>#{i+4}</span>
                  <div style={{flex:1}}>
                    <span style={{fontSize:'0.9rem',color:isMe?'#D4AF37':TEXT}}>{p.player_name} {isMe&&'(you)'}</span>
                    <span style={{fontSize:'0.68rem',color:MUTED,marginLeft:'0.6rem'}}>Lv.{p.level} · {pct}%</span>
                    {p.max_streak > 0 && <span style={{fontFamily:'"Press Start 2P",monospace',fontSize:'9px',color:'#F59E0B',marginLeft:'0.5rem'}}>{p.max_streak} STREAK</span>}
                  </div>
                  <div style={{color:'#9B59B6',fontSize:'0.85rem',fontWeight:'bold'}}>{p.xp} XP</div>
                </div>
              )
            })}
          </>
        )}
        <p style={{textAlign:'center',fontSize:'0.62rem',color:'rgba(232,217,192,0.2)',marginTop:'1.5rem',letterSpacing:'0.08em'}}>Updates live as souls play ◉</p>
      </div>
    </div>
  )
}
