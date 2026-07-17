// AetherMind: Daily Aether (Wordle-style daily challenge) · T1 LANE
// Props: { nav }  (nav.home, nav.realms from App)
// 5 deterministic questions per UTC day, same for everyone. No timer, classic rules.
// Result is a shareable emoji grid. Completion is tracked in localStorage 'am-daily-v1',
// separate from the main game store, so a daily run never touches XP/level.
import { useState, useEffect, useRef } from 'react'
import { REALMS, STARS } from '../lib/constants'
import { fetchQuestionsForRealm } from '../lib/supabase'
import { formatQuestion } from '../lib/questionSelector'

const F='"EB Garamond","Georgia",serif'
const PIXEL="'Press Start 2P','Courier New',monospace"
const GOLD='#D4AF37', TEXT='#E8D9C0', MUTED='rgba(232,217,192,0.4)', PURPLE='#9B6FE0'
const SITE='aethermind-five.vercel.app'
const DAILY_KEY='am-daily-v1'
const MONTHS=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

// ---- deterministic daily selection ---------------------------------------------------------
// The question id is a uuid string, so the naive Math.sin(seed + id) resolves to NaN (number +
// string is a string). We hash the id to an int first, then use the fractional part of a
// sin-based hash as a stable per-day sort key. Same UTC date -> same realms -> same questions.
function todayKey(){ return new Date().toISOString().split('T')[0] }            // YYYY-MM-DD (UTC)
function yesterdayKey(){ const d=new Date(); d.setUTCDate(d.getUTCDate()-1); return d.toISOString().split('T')[0] }
export function dailyLabel(){ const d=new Date(); return MONTHS[d.getUTCMonth()]+' '+d.getUTCDate() }
function prettyDate(){ const d=new Date(); return MONTHS[d.getUTCMonth()][0]+MONTHS[d.getUTCMonth()].slice(1).toLowerCase()+' '+d.getUTCDate()+', '+d.getUTCFullYear() }
function prettyShort(){ const d=new Date(); const m=MONTHS[d.getUTCMonth()]; return m[0]+m.slice(1).toLowerCase()+' '+d.getUTCDate() }
function seedFrom(key){ return key.split('-').reduce((a,v)=>a*31+parseInt(v,10),0) }
function hashStr(s){ let h=0; s=String(s); for(let i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))|0 } return h }
function seededSort(items, seed){
  return items.map(it=>{ const x=Math.sin(seed+hashStr(it.id))*10000; return {it, r:x-Math.floor(x)} })
    .sort((a,b)=>a.r-b.r).map(o=>o.it)
}

// ---- localStorage (separate from the main game store) --------------------------------------
export function getDailyRecord(){
  // Always resolve to a plain object: getTodayResult() indexes this on the HomeScreen render path,
  // so a corrupt localStorage value (e.g. the literal "null" or a primitive) must not throw.
  try{ const v = JSON.parse(localStorage.getItem(DAILY_KEY)||'{}'); return (v && typeof v==='object' && !Array.isArray(v)) ? v : {} }catch{ return {} }
}
export function getTodayResult(){ return getDailyRecord()[todayKey()] || null }
function saveTodayResult(res){
  const r=getDailyRecord()
  // Daily completion streak: +1 if yesterday was completed too, else reset to 1. Computed once per
  // day (completion locks re-entry to the done screen), so re-opening today never re-increments it.
  const streak = r[yesterdayKey()] ? (r.streak||1)+1 : 1
  res.streak = streak                 // embed in the day result so the done-view on reload shows DAY N
  r[todayKey()]=res
  r.streak = streak
  try{ localStorage.setItem(DAILY_KEY,JSON.stringify(r)) }catch{ /* storage blocked */ }
  return streak
}

const gridOf = (results) => results.map(r=>r?'🟨':'⬛').join('')
// Share text points at /#daily so a tapped link deep-links friends straight into today's challenge.
const shareTextOf = (results, streak) => {
  const score = results.filter(Boolean).length
  const streakLine = streak ? `Streak: ${streak}${streak>=2?' 🔥':''}\n` : ''
  return `AetherMind Daily · ${prettyShort()}\n${gridOf(results)}  ${score}/5\n${streakLine}${SITE}/#daily`
}

function Stars(){
  return <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>{STARS.map((s,i)=>(
    <div key={i} style={{position:'absolute',left:s.x+'%',top:s.y+'%',width:s.s+'px',height:s.s+'px',background:'#fff',borderRadius:'50%',opacity:s.o,animation:`tw ${3+(i%5)}s ${s.d}s infinite alternate`}}/>
  ))}</div>
}

export default function DailyAether({ nav }){
  const existing = getTodayResult()
  const [phase, setPhase] = useState(existing ? 'done' : 'loading')  // loading | playing | result | done
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [results, setResults] = useState([])       // boolean[] once answered
  const [picked, setPicked] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dailyStreak, setDailyStreak] = useState(existing?.streak || 0)
  const [loadError, setLoadError] = useState(false)
  const advRef = useRef(null)

  // Load the 5 deterministic daily questions (one per 5 seeded realms) unless already done today.
  useEffect(() => {
    if (existing) return
    let alive = true
    const seed = seedFrom(todayKey())
    const realms = seededSort([...REALMS], seed).slice(0, 5)
    Promise.all(realms.map(r => fetchQuestionsForRealm(r.id)))
      .then(pools => {
        if (!alive) return
        const qs = pools
          .map(pool => (pool && pool.length ? formatQuestion(seededSort([...pool], seed)[0]) : null))
          .filter(Boolean)
        if (qs.length < 5) { setLoadError(true); return }
        setQuestions(qs)
        setPhase('playing')
      })
      .catch(() => { if (alive) setLoadError(true) })
    return () => { alive = false; if (advRef.current) clearTimeout(advRef.current) }
  }, [existing])

  const answer = (i) => {
    if (revealed) return
    setPicked(i)
    setRevealed(true)
    const correct = i === questions[idx].correct_index
    const nextResults = [...results, correct]
    advRef.current = setTimeout(() => {
      if (idx + 1 >= questions.length) {
        const res = { score: nextResults.filter(Boolean).length, emojis: gridOf(nextResults), results: nextResults }
        const streak = saveTodayResult(res)
        setResults(nextResults)
        setDailyStreak(streak)
        setPhase('result')
      } else {
        setResults(nextResults)
        setIdx(idx + 1)
        setPicked(null)
        setRevealed(false)
      }
    }, 1250)
  }

  const share = (results, streak) => {
    const text = shareTextOf(results, streak)
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000) }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(done)
      else done()
    } catch { done() }
  }

  const wrap = (children) => (
    <div style={{minHeight:'100vh',background:'radial-gradient(ellipse at 50% -5%,#160b33 0%,#050510 55%)',padding:'1.5rem 1.25rem 3rem',fontFamily:F,color:TEXT,position:'relative',overflow:'hidden'}}>
      <Stars/>
      <div style={{position:'relative',maxWidth:'540px',margin:'0 auto'}}>
        <button onClick={nav.home} aria-label="Home" title="Home" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'0.4rem 0.85rem',color:MUTED,cursor:'pointer',fontSize:'0.76rem',fontFamily:F,marginBottom:'1.6rem',minHeight:'44px',display:'inline-flex',alignItems:'center'}}>← Home</button>
        {children}
      </div>
    </div>
  )

  // ---- Result / already-done screen --------------------------------------------------------
  const ResultView = ({ score, resultsArr, alreadyDone, streak }) => (
    <div style={{textAlign:'center'}}>
      <div style={{fontFamily:PIXEL,fontSize:'12px',color:GOLD,letterSpacing:'3px',marginBottom:'0.9rem',filter:`drop-shadow(0 0 8px ${GOLD}55)`}}>DAILY AETHER</div>
      <div style={{fontFamily:'var(--font-question)',fontSize:'1.05rem',color:MUTED,marginBottom:'1.4rem'}}>{prettyDate()}</div>
      {/* Daily completion streak: DAY N above the score, gold->amber once the streak is alight */}
      {streak>0 && <div style={{marginBottom:'1.6rem'}}>
        <div style={{fontFamily:PIXEL,fontSize:'13px',color:streak>=2?'#F59E0B':GOLD,letterSpacing:'2px',textShadow:streak>=2?'0 0 10px rgba(245,158,11,0.5)':'none'}}>DAY {streak}{streak>=2?' 🔥':''}</div>
        <div style={{fontFamily:F,fontStyle:'italic',fontSize:'0.74rem',color:MUTED,marginTop:'0.4rem'}}>of your Aether journey</div>
      </div>}
      <div role="img" aria-label={`${score} of 5 correct`} style={{fontSize:'40px',letterSpacing:'8px',marginBottom:'1.4rem'}}>{gridOf(resultsArr)}</div>
      <div style={{fontFamily:PIXEL,fontSize:'18px',color:score>=3?'#39FF14':GOLD,letterSpacing:'2px',marginBottom:'2rem'}}>{score}/5 ASCENDED</div>
      {alreadyDone && <div style={{fontFamily:F,fontStyle:'italic',fontSize:'0.95rem',color:'rgba(232,217,192,0.6)',marginBottom:'1.8rem',lineHeight:1.7}}>You have ascended today.<br/>Come back tomorrow for a new challenge.</div>}
      <pre style={{fontFamily:PIXEL,fontSize:'11px',lineHeight:2,color:TEXT,background:'rgba(212,175,55,0.06)',border:'1px solid rgba(212,175,55,0.2)',borderRadius:'10px',padding:'1rem',marginBottom:'1.4rem',whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{shareTextOf(resultsArr, streak)}</pre>
      <button onClick={()=>share(resultsArr, streak)} style={{width:'100%',background:copied?'#39FF14':'linear-gradient(135deg,#E8C766,#D4AF37)',border:'none',borderRadius:'8px',padding:'1rem',color:'#04040A',fontFamily:PIXEL,fontSize:'11px',letterSpacing:'1.5px',cursor:'pointer',marginBottom:'0.8rem',minHeight:'44px',transition:'background 0.2s',boxShadow:`0 0 26px ${GOLD}33`}}>{copied?'COPIED!':'SHARE RESULT'}</button>
      <button onClick={nav.realms} style={{width:'100%',background:'transparent',border:`1px solid ${GOLD}55`,borderRadius:'8px',padding:'0.85rem',color:GOLD,fontFamily:PIXEL,fontSize:'10px',letterSpacing:'1px',cursor:'pointer',minHeight:'44px'}}>PLAY ALL REALMS</button>
    </div>
  )

  if (phase === 'done' && existing) return wrap(<ResultView score={existing.score} resultsArr={existing.results||[]} streak={existing.streak || getDailyRecord().streak || 0} alreadyDone />)
  if (phase === 'result') return wrap(<ResultView score={results.filter(Boolean).length} resultsArr={results} streak={dailyStreak} alreadyDone={false} />)

  if (loadError) return wrap(
    <div style={{textAlign:'center',padding:'3rem 1rem'}}>
      <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🌌</div>
      <div style={{fontFamily:F,color:'rgba(232,217,192,0.7)',lineHeight:1.7}}>The daily archive is unreachable right now.<br/>Try again in a moment.</div>
    </div>
  )

  if (phase === 'loading') return wrap(
    <div style={{textAlign:'center',padding:'3rem 1rem'}} role="status" aria-label="Loading today's challenge">
      <div style={{fontSize:'2.5rem',color:GOLD,animation:'pulse 2s ease-in-out infinite'}}>◉</div>
      <div style={{fontFamily:PIXEL,fontSize:'10px',color:MUTED,letterSpacing:'2px',marginTop:'1.2rem'}}>CHANNELING TODAY'S 5</div>
    </div>
  )

  // ---- Playing -----------------------------------------------------------------------------
  const q = questions[idx]
  return wrap(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.4rem'}}>
        <span style={{fontFamily:PIXEL,fontSize:'11px',color:GOLD,letterSpacing:'2px'}}>DAILY AETHER</span>
        <span style={{fontFamily:PIXEL,fontSize:'9px',color:MUTED,letterSpacing:'1px'}}>{dailyLabel()}</span>
      </div>
      {/* progress dots */}
      <div role="img" aria-label={`Question ${idx+1} of ${questions.length}`} style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'1.8rem'}}>
        {questions.map((_,i)=>{
          const state = i<results.length ? (results[i]?'done-ok':'done-no') : (i===idx?'now':'todo')
          const bg = state==='done-ok'?'#39FF14':state==='done-no'?'#FF3131':state==='now'?GOLD:'rgba(212,175,55,0.2)'
          return <div key={i} style={{width:state==='now'?'14px':'10px',height:state==='now'?'14px':'10px',borderRadius:'50%',background:bg,transition:'all 0.2s'}}/>
        })}
      </div>
      {/* aria-live for daily answer feedback */}
      <div role="status" aria-live="polite" aria-atomic="true" style={{position:'absolute',width:'1px',height:'1px',padding:0,margin:'-1px',overflow:'hidden',clip:'rect(0,0,0,0)',whiteSpace:'nowrap',border:0}}>
        {revealed ? (picked===q.correct_index ? 'Correct.' : 'Not this time. The correct answer is: '+q.options[q.correct_index]) : ''}
      </div>
      <div style={{fontFamily:'var(--font-question)',fontSize:'20px',lineHeight:1.7,color:TEXT,marginBottom:'1.6rem',minHeight:'3em'}}>{q.question}</div>
      <div style={{display:'flex',flexDirection:'column',gap:'0.7rem'}}>
        {q.options.map((opt,i)=>{
          let bdr='rgba(212,175,55,0.25)', bg='rgba(255,255,255,0.02)', tc=TEXT, anim
          if (revealed){
            if (i===q.correct_index){ bdr='#39FF14'; bg='#39FF1412'; tc='#39FF14'; anim='correctFlash 1s ease-out forwards' }
            else if (i===picked){ bdr='#FF3131'; bg='#FF313112'; tc='#FF3131'; anim='wrongShake 0.5s ease-out' }
            else tc='rgba(232,217,192,0.3)'
          }
          return (
            <button key={i} onClick={()=>answer(i)} disabled={revealed} aria-label={`Answer ${['A','B','C','D'][i]}: ${opt}`}
              style={{background:bg,border:`1px solid ${bdr}`,borderRadius:'10px',padding:'0.82rem 1.1rem',textAlign:'left',cursor:revealed?'default':'pointer',color:tc,fontFamily:'var(--font-question)',fontSize:'16px',lineHeight:1.6,transition:'all 0.16s',animation:anim,minHeight:'44px'}}>
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}
