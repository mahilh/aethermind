// AetherMind: QuizScreen · T1 LANE
// Props: { realm, question, loading, error, picked, revealed, sessionScore, stats, learningCardsCount, onAnswer, onNext, onRetry, nav }
import { useState, useEffect, useRef } from 'react'
import { KNOWLEDGE_TYPES, STARS } from '../lib/constants'
import { getImageUrl } from '../lib/questionSelector'
import { useGameStore } from '../store/useGameStore'
import GameOver from './GameOver'
import GauntletComplete from './GauntletComplete'

const F='"EB Garamond","Georgia",serif',TEXT='#E8D9C0',MUTED='rgba(232,217,192,0.4)'
const PIXEL="'Press Start 2P','Courier New',monospace"
const fmtTime=(s)=>`0:${String(Math.max(0,s)).padStart(2,'0')}`
const navBtn={background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',padding:'0.38rem 0.85rem',color:MUTED,cursor:'pointer',fontSize:'0.76rem',fontFamily:F}
const xpBarOuter={height:'5px',background:'rgba(255,255,255,0.08)',borderRadius:'3px',overflow:'hidden'}

// image_url comes from am_questions, where anon holds UPDATE (migration 003) and
// the RLS policy is using(true), so the value is attacker writable. Only pass a
// DB image URL to <img src> when it is https and from a trusted host; otherwise
// fall through to getImageUrl(). Defense in depth: the real fix is the grant.
const SUPABASE_HOST=(()=>{try{return new URL(import.meta.env.VITE_SUPABASE_URL).hostname}catch{return null}})()
const IMG_HOSTS=new Set(['images.unsplash.com','source.unsplash.com','picsum.photos',SUPABASE_HOST].filter(Boolean))
function safeImageUrl(raw){
  if(!raw) return null
  try{
    const u=new URL(raw)
    return u.protocol==='https:'&&IMG_HOSTS.has(u.hostname)?u.href:null
  }catch{return null}
}

function Stars({color}) {
  return <div style={{position:'absolute',inset:0,pointerEvents:'none'}}>{STARS.map((s,i)=>(
    <div key={i} style={{position:'absolute',left:s.x+'%',top:s.y+'%',width:s.s+'px',height:s.s+'px',background:'#fff',borderRadius:'50%',opacity:s.o,animation:`tw ${3+(i%5)}s ${s.d}s infinite alternate`}}/>
  ))}</div>
}

export default function QuizScreen({ realm, question, loading, error, picked, revealed, sessionScore, stats, learningCardsCount, onAnswer, onNext, onRetry, nav }) {
  const gameMode = useGameStore(s => s.gameMode)
  const livesRemaining = useGameStore(s => s.livesRemaining)
  const gauntletCount = useGameStore(s => s.gauntletCount)
  const isSpeed = gameMode === 'speed'
  const isGauntlet = gameMode === 'gauntlet'
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameOver, setGameOver] = useState(false)
  const [gauntletDone, setGauntletDone] = useState(false)
  const barRef = useRef(null)
  const timedOutRef = useRef(false)

  // Speed Oracle: on each new question, reset the timer + bar and arm a real 30s deadline; freeze the bar on reveal.
  // The deadline is a setTimeout tied to THIS question's effect lifecycle, so it can never fire on a stale
  // timeLeft carried over from the previous question (which caused a cascade of instant auto-wrong answers).
  useEffect(() => {
    if (!isSpeed) return
    const bar = barRef.current
    if (revealed) {
      if (bar) { const w = getComputedStyle(bar).width; bar.style.transition = 'none'; bar.style.width = w }
      return
    }
    if (!question) return
    timedOutRef.current = false
    setTimeLeft(30)
    if (bar) {
      bar.style.transition = 'none'; bar.style.width = '100%'
      void bar.offsetWidth
      bar.style.transition = 'width 30s linear'; bar.style.width = '0%'
    }
    const ticker = setInterval(() => setTimeLeft(t => (t <= 1 ? 0 : t - 1)), 1000)
    const deadline = setTimeout(() => {
      clearInterval(ticker)
      setTimeLeft(0)
      timedOutRef.current = true
      // Timeout reveals the correct answer with 0 XP and no learning card (T2 store action).
      // NOT onAnswer/answerQuestion (those award 5 XP + push a card); the 2s effect below calls onNext.
      useGameStore.getState().timeoutQuestion()
    }, 30000)
    return () => { clearInterval(ticker); clearTimeout(deadline) }
  }, [question, isSpeed, revealed])

  // Speed Oracle: after a timeout reveal, advance to the next question after 2s
  useEffect(() => {
    if (!isSpeed || !revealed || !timedOutRef.current) return
    const adv = setTimeout(() => onNext(), 2000)
    return () => clearTimeout(adv)
  }, [revealed, isSpeed, onNext])

  // Answer click: run the normal answer flow, then apply mode consequences.
  // answerQuestion() touches neither lives nor gauntlet count, so both are driven here
  // via the public store actions (loseLife / incrementGauntlet).
  const handleSelect = (i) => {
    if (revealed || !question) return
    const correct = i === question.correct_index
    onAnswer(i)
    if (gameMode === 'survival' && !correct) {
      useGameStore.getState().loseLife()
      if (useGameStore.getState().livesRemaining <= 0) setGameOver(true)
    }
    if (gameMode === 'gauntlet' && correct) {
      useGameStore.getState().incrementGauntlet()
      if (useGameStore.getState().gauntletCount >= 10) setGauntletDone(true)
    }
  }

  if (!realm) return null

  // Survival Run: 0 hearts ends the run.
  if (gameOver && gameMode === 'survival') return (
    <GameOver
      realm={realm}
      sessionScore={sessionScore}
      gameMode={gameMode}
      onPlayAgain={() => {
        const s = useGameStore.getState()
        s.setLivesRemaining(3); s.resetSession(); s.clearSeenQuestions()
        setGameOver(false); onRetry()
      }}
      onChangeMode={() => { setGameOver(false); nav.home() }}
    />
  )

  // Realm Gauntlet: 10 cleared ends the trial.
  if (gauntletDone && gameMode === 'gauntlet') return (
    <GauntletComplete
      realm={realm}
      sessionScore={sessionScore}
      onForgeAgain={() => {
        const s = useGameStore.getState()
        s.resetGauntlet(); s.resetSession(); s.clearSeenQuestions()
        setGauntletDone(false); onRetry()
      }}
      onChooseRealm={() => { setGauntletDone(false); nav.realms() }}
    />
  )

  const ok = revealed && picked === question?.correct_index
  const kt = question ? (KNOWLEDGE_TYPES[question.knowledge_type] || KNOWLEDGE_TYPES.philosophical) : null
  const acc = stats.answered ? Math.round(stats.correct/stats.answered*100) : 0

  return (
    <div style={{minHeight:'100vh',background:`radial-gradient(ellipse at 50% -5%,${realm.color}18 0%,#050510 55%)`,padding:'1.25rem 1.25rem 3rem',fontFamily:F,color:TEXT,position:'relative',overflow:'hidden'}}>
      <Stars color={realm.color}/>
      <div style={{position:'relative',maxWidth:'650px',margin:'0 auto'}}>
        {/* Nav */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.2rem'}}>
          <button style={navBtn} onClick={nav.realms}>← Realms</button>
          <span style={{color:realm.color,fontSize:'0.84rem',filter:`drop-shadow(0 0 8px ${realm.color}60)`}}>{realm.glyph} {realm.name}</span>
          <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
            {gameMode==='survival'&&<span style={{display:'inline-flex',alignItems:'center',gap:'2px',fontSize:'0.95rem',marginRight:'0.1rem'}} title={`${livesRemaining} lives`}>
              {[0,1,2].map(i=><span key={i} style={{color:i<livesRemaining?'#F87171':'rgba(232,217,192,0.22)'}}>{i<livesRemaining?'♥':'♡'}</span>)}
            </span>}
            {learningCardsCount>0&&<button style={{...navBtn,color:'#FB923C'}} onClick={nav.cards}>📚 {learningCardsCount}</button>}
            <button style={{...navBtn,color:'#D4AF37'}} onClick={nav.character}>◉ Lv.{stats.level}</button>
            <button style={{...navBtn,color:'#6EE7B7'}} onClick={nav.leaderboard}>🌍</button>
          </div>
        </div>
        {/* Session stats */}
        <div style={{display:'flex',gap:'0.7rem',marginBottom:'1.2rem'}}>
          {[{v:`${sessionScore.c}/${sessionScore.t}`,l:'SESSION',c:'#D4AF37'},{v:stats.xp+' XP',l:'TOTAL XP',c:'#9B59B6'},{v:acc+'%',l:'ACCURACY',c:realm.color}].map(({v,l,c})=>(
            <div key={l} style={{flex:1,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.09)',borderRadius:'14px',padding:'0.6rem',textAlign:'center'}}>
              <div style={{color:c,fontSize:'0.98rem',fontWeight:'bold'}}>{v}</div>
              <div style={{fontSize:'0.58rem',color:MUTED,letterSpacing:'0.1em'}}>{l}</div>
            </div>
          ))}
        </div>
        {/* Loading */}
        {loading&&<div style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${realm.color}25`,borderRadius:'14px',padding:'4rem 2rem',textAlign:'center'}}>
          <div style={{fontSize:'2.8rem',color:realm.color,animation:'spin 3s linear infinite',marginBottom:'1rem'}}>◉</div>
          <div style={{fontSize:'0.72rem',letterSpacing:'0.2em',color:MUTED}}>CHANNELING QUESTION...</div>
        </div>}
        {/* Error */}
        {error&&!loading&&<div style={{background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:'14px',padding:'2rem',textAlign:'center'}}>
          <div style={{color:'#F87171',marginBottom:'1rem',fontSize:'0.88rem'}}>{error}</div>
          <button style={{...navBtn,color:'#D4AF37'}} onClick={onRetry}>Try Again</button>
        </div>}
        {/* Question */}
        {question&&!loading&&<>
          {/* Realm Gauntlet progress (Q x / 10) */}
          {isGauntlet&&<div style={{marginBottom:'1rem'}}>
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'0.4rem'}}>
              <span style={{fontFamily:PIXEL,fontSize:'7px',color:'#D4AF37',letterSpacing:'0.5px'}}>Q {Math.min(gauntletCount+1,10)} / 10</span>
            </div>
            <div style={{height:'3px',background:'rgba(255,255,255,0.07)',borderRadius:'3px',overflow:'hidden'}}>
              <div style={{height:'100%',background:'#D4AF37',borderRadius:'3px',width:`${Math.min(gauntletCount,10)/10*100}%`,transition:'width 0.4s ease'}}/>
            </div>
          </div>}
          {/* Speed Oracle timer (between stats row and knowledge badge) */}
          {isSpeed&&<div style={{marginBottom:'1rem'}}>
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'0.4rem'}}>
              <span style={{fontFamily:PIXEL,fontSize:'9px',color:'#D4AF37',letterSpacing:'0.5px'}}>{fmtTime(timeLeft)}</span>
            </div>
            <div style={{height:'6px',background:'rgba(255,255,255,0.07)',borderRadius:'3px',overflow:'hidden'}}>
              <div ref={barRef} style={{height:'100%',background:'#D4AF37',borderRadius:'3px'}}/>
            </div>
          </div>}
          {/* Knowledge badge (hidden in Blind Seer: the mystery is the mode) */}
          {gameMode!=='blind'&&kt&&<div style={{marginBottom:'0.9rem'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:'0.4rem',padding:'0.18rem 0.72rem',borderRadius:'20px',background:`${kt.color}18`,border:`1px solid ${kt.color}40`,fontSize:'0.63rem',color:kt.color}}>
              {kt.stars} {kt.label}
            </span>
          </div>}
          {/* Question image (stored URL or Unsplash fallback) */}
          {question?.image_search && (
            <div style={{
              width: '100%',
              height: '200px',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '1.2rem',
              border: '1px solid rgba(212,175,55,0.15)',
              background: 'rgba(255,255,255,0.02)',
              flexShrink: 0,
            }}>
              <img
                src={safeImageUrl(question.image_url) || getImageUrl(question, realm?.name || '')}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  opacity: 0.85,
                }}
                onError={(e) => { e.target.parentElement.style.display = 'none' }}
                loading="lazy"
              />
            </div>
          )}
          {/* Question text (Blind Seer: subtle purple tint replaces the knowledge cue) */}
          <div style={{background:gameMode==='blind'?'rgba(123,47,190,0.06)':'rgba(255,255,255,0.03)',border:`1px solid ${realm.color}30`,borderRadius:'14px',padding:'1.5rem',marginBottom:'1rem',fontFamily:'var(--font-question)',fontSize:'22px',lineHeight:'1.8',letterSpacing:'0.02em'}}>
            {question.question}
          </div>
          {/* Options */}
          <div style={{display:'flex',flexDirection:'column',gap:'0.55rem',marginBottom:'1.2rem'}}>
            {question.options.map((opt,i)=>{
              let bdr='rgba(255,255,255,0.09)',bg='rgba(255,255,255,0.025)',tc=TEXT,cur='pointer'
              if(revealed){cur='default';if(i===question.correct_index){bdr='#4ADE80';bg='#4ADE8012';tc='#4ADE80'}else if(i===picked){bdr='#F87171';bg='#F8717112';tc='#F87171'}else{tc='rgba(232,217,192,0.3)'}}
              return (
                <button key={i} onClick={()=>handleSelect(i)} disabled={revealed} style={{background:bg,border:`1px solid ${bdr}`,borderRadius:'10px',padding:'0.82rem 1.1rem',textAlign:'left',cursor:cur,color:tc,fontFamily:'var(--font-question)',fontSize:'17px',lineHeight:'1.7',letterSpacing:'0.01em',display:'flex',alignItems:'center',gap:'0.8rem',transition:'all 0.16s'}}
                  onMouseEnter={e=>{if(!revealed){e.currentTarget.style.borderColor=realm.color;e.currentTarget.style.background=`${realm.color}12`}}}
                  onMouseLeave={e=>{if(!revealed){e.currentTarget.style.borderColor='rgba(255,255,255,0.09)';e.currentTarget.style.background='rgba(255,255,255,0.025)'}}}>
                  <span style={{width:'22px',height:'22px',borderRadius:'50%',border:`1px solid ${bdr}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.68rem',flexShrink:0,color:tc}}>{['A','B','C','D'][i]}</span>
                  {opt}
                </button>
              )
            })}
          </div>
          {/* Result panel */}
          {revealed&&<>
            <div style={{background:ok?'#4ADE8008':'#F8717108',border:`1px solid ${ok?'#4ADE8025':'#F8717125'}`,borderRadius:'14px',padding:'1.4rem',marginBottom:'0.9rem'}}>
              <div style={{color:ok?'#4ADE80':'#F87171',fontWeight:'bold',fontSize:'0.98rem',marginBottom:'0.8rem'}}>
                {ok?'✓ Correct, well perceived':'✗ Not this time, wisdom grows from this'}
              </div>
              <p style={{fontFamily:'var(--font-wisdom)',fontSize:'16px',lineHeight:'1.85',fontStyle:'italic',color:'rgba(232,217,192,0.82)',marginBottom:'0.9rem'}}>{question.explanation}</p>
              {question.insight&&<div style={{borderLeft:`3px solid ${realm.color}`,paddingLeft:'1rem',color:'#D4AF37',fontFamily:'var(--font-wisdom)',fontSize:'15px',fontStyle:'italic',marginBottom:'0.75rem'}}>✧ {question.insight}</div>}
              {question.cross_references?.length>0&&<div style={{fontSize:'0.67rem',color:'rgba(232,217,192,0.3)'}}>📖 {question.cross_references.join(' · ')}</div>}
            </div>
            <button onClick={onNext} style={{width:'100%',background:`${realm.color}18`,border:`1px solid ${realm.color}50`,borderRadius:'10px',padding:'0.88rem',color:realm.color,fontSize:'0.93rem',fontFamily:F,cursor:'pointer',letterSpacing:'0.08em',transition:'background 0.18s'}}
              onMouseEnter={e=>e.currentTarget.style.background=`${realm.color}28`}
              onMouseLeave={e=>e.currentTarget.style.background=`${realm.color}18`}>
              Next Question →
            </button>
          </>}
        </>}
      </div>
    </div>
  )
}
