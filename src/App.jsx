// AetherMind: Main App Shell (Supabase-powered questions)
// T1 LANE: this file + all components
// T2 provides store + lib (read only for T1)
import { useEffect, useCallback, useState, useRef } from 'react'
import { useGameStore } from './store/useGameStore'
import { fetchQuestionsForRealm, saveScore, getLeaderboard, subscribeLeaderboard, unsubscribeLeaderboard } from './lib/supabase'
import { selectQuestion, formatQuestion } from './lib/questionSelector'
import HomeScreen from './components/HomeScreen'
import ModeSelect from './components/ModeSelect'
import RealmSelect from './components/RealmSelect'
import QuizScreen from './components/QuizScreen'
import CharacterSheet from './components/CharacterSheet'
import WisdomVault from './components/WisdomVault'
import Leaderboard from './components/Leaderboard'
import DailyAether from './components/DailyAether'

// ── Hash-based routing map ────────────────────────────────────
// Mirror the store `screen` into window.location.hash so the browser Back/Forward buttons move
// between screens instead of leaving the app, and a shared link like /#daily deep-links straight in.
// Hash routing (not react-router) is deliberate: `screen` lives in T2's store and the whole
// question-load flow is wired through setScreen, so a full router swap would be cross-lane and
// high-risk on a live auto-deploy. Hash sync stays in this file, needs no dependency and no
// server rewrite (the hash never reaches Vercel, so /#daily can never 404).
const SCREEN_TO_HASH = { home:'', 'mode-select':'mode', 'realm-select':'realm', quiz:'quiz', daily:'daily', character:'character', cards:'vault', leaderboard:'leaderboard' }
const HASH_TO_SCREEN = { '':'home', home:'home', mode:'mode-select', realm:'realm-select', quiz:'quiz', daily:'daily', character:'character', vault:'cards', leaderboard:'leaderboard' }

export default function App() {
  const {
    screen, realm, question, loading, error, picked, revealed,
    sessionScore, learningCards, cardOpen, leaderboard, playerName, stats,
    setScreen, setRealm, setQuestion, setLoading, setError,
    resetQuestion, resetSession, answerQuestion, setCardOpen, setLeaderboard, setGameMode,
    setLivesRemaining, resetGauntlet,
  } = useGameStore()

  // Realm question pool (loaded once per realm session, free Supabase reads)
  const [realmQuestions, setRealmQuestions] = useState([])
  const [seenIds, setSeenIds] = useState([])

  // Leaderboard write throttle: track the last-saved xp + level so saveScore fires at most
  // once per ~25 XP (protects the write path so T2 can safely rate-limit /api/save-score).
  const lastSavedXpRef = useRef(0)
  const lastSavedLevelRef = useRef(0)

  // ── Load questions from Supabase for realm ────────────────────
  const loadRealmQuestions = useCallback(async (r) => {
    setLoading(true)
    setError(null)
    try {
      const questions = await fetchQuestionsForRealm(r.id)
      setRealmQuestions(questions)
      return questions
    } catch (e) {
      console.error('[AetherMind] loadRealmQuestions:', e)
      setError('Could not load questions from the archive. Check your connection.')
      return []
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  // ── Pick next question from loaded pool ────────────────────────
  const pickQuestion = useCallback((questions, currentStats, currentRealm, currentSeenIds) => {
    resetQuestion()
    // Gauntlet needs 10 unique questions per run. selectQuestion recycles seen questions once
    // fewer than 3 remain unseen (questionSelector line 28), causing repeats mid-run. Hard-prefer
    // unseen here so a run never repeats until the whole realm pool is exhausted (only reachable
    // when wrong answers push a run past the pool size, since gauntlet advances on correct only).
    let pool = questions
    if (useGameStore.getState().gameMode === 'gauntlet') {
      const unseen = questions.filter(q => !currentSeenIds.includes(q.id))
      pool = unseen.length > 0 ? unseen : questions
    }
    const dbQ = selectQuestion(pool, currentStats, currentRealm, currentSeenIds)
    if (!dbQ) {
      setError('All questions in this realm explored. More coming soon.')
      return
    }
    setQuestion(formatQuestion(dbQ))
    setSeenIds(prev => [...prev, dbQ.id])
  }, [resetQuestion, setQuestion, setError])

  // ── Select realm → load questions → pick first ────────────────
  const handleSelectRealm = useCallback(async (r) => {
    setRealm(r)
    resetSession()
    setLivesRemaining(3)
    resetGauntlet()
    setSeenIds([])
    setScreen('quiz')
    const questions = await loadRealmQuestions(r)
    if (questions.length > 0) {
      pickQuestion(questions, stats, r, [])
    }
  }, [setRealm, resetSession, setLivesRemaining, resetGauntlet, setScreen, loadRealmQuestions, pickQuestion, stats])

  // ── Next question from existing pool ──────────────────────────
  const handleNext = useCallback(() => {
    pickQuestion(realmQuestions, useGameStore.getState().stats, realm, seenIds)
  }, [realmQuestions, realm, seenIds, pickQuestion])

  // ── Mode chosen → store it, then go to realm select ───────────
  const handleModeSelect = useCallback((modeId) => {
    setGameMode(modeId)
    setScreen('realm-select')
  }, [setGameMode, setScreen])

  // ── Save score, debounced to every ~25 XP ─────────────────────
  // stats.xp wraps DOWN on level-up, so a raw xp diff alone would stall saves after leveling;
  // a level increase also triggers a save. maxStreak (top-level session state) rides along for
  // the streak leaderboard. force=true is used at session end to guarantee the final stats land.
  const persistScore = useCallback((force = false) => {
    if (!playerName) return
    const s = useGameStore.getState()
    const xp = s.stats?.xp || 0
    const level = s.stats?.level || 1
    if (force || level > lastSavedLevelRef.current || xp - lastSavedXpRef.current >= 25) {
      saveScore(playerName, { ...s.stats, maxStreak: s.maxStreak || 0 }).catch(console.error)
      lastSavedXpRef.current = xp
      lastSavedLevelRef.current = level
    }
  }, [playerName])

  // ── Answer handler ────────────────────────────────────────────
  const handleAnswer = useCallback((idx) => {
    answerQuestion(idx)
    persistScore(false)
  }, [answerQuestion, persistScore])

  // ── Session end (Survival GameOver / Gauntlet complete): force a final save so the last
  // sub-25 XP and the run's maxStreak always reach the leaderboard. ───────────────────────
  const handleSessionEnd = useCallback(() => { persistScore(true) }, [persistScore])

  // ── Leaderboard realtime subscription ─────────────────────────
  useEffect(() => {
    if (screen !== 'leaderboard') return
    getLeaderboard().then(setLeaderboard).catch(console.error)
    const ch = subscribeLeaderboard(() => {
      getLeaderboard().then(setLeaderboard).catch(console.error)
    })
    return () => unsubscribeLeaderboard(ch)
  }, [screen, setLeaderboard])

  // ── Cinzel warm-up ────────────────────────────────────────────
  // Paired with the <link rel=preload> in index.html: the preload caches the woff2 during HTML parse,
  // this actively loads it into the FontFace set so Cinzel is fully ready before the quiz renders,
  // killing the flash of the EB Garamond fallback (and making document.fonts.check('1em Cinzel') true).
  useEffect(() => {
    if (document.fonts?.load) { document.fonts.load('1em Cinzel'); document.fonts.load('600 1em Cinzel') }
  }, [])

  // ── Hash routing ──────────────────────────────────────────────
  // hashReady gates the screen->hash sync until after the one-time deep-link adopt below, so the
  // sync can never clobber an incoming /#daily before it is read (this ordering is also what makes
  // the flow safe under StrictMode's double-invoke of effects in dev).
  const [hashReady, setHashReady] = useState(false)

  // Once on mount: adopt a deep-link hash as the screen. Quiz is excluded because it needs a realm
  // loaded through realm-select, so a bare /#quiz falls back to home via the sync effect.
  useEffect(() => {
    const h = window.location.hash.replace(/^#/, '')
    const deep = HASH_TO_SCREEN[h]
    if (deep && deep !== 'quiz' && deep !== useGameStore.getState().screen) setScreen(deep)
    setHashReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Screen -> hash: setting the hash pushes a history entry, so Back returns to the prior screen.
  useEffect(() => {
    if (!hashReady) return
    const target = SCREEN_TO_HASH[screen] ?? ''
    const current = window.location.hash.replace(/^#/, '')
    if (current !== target) window.location.hash = target
  }, [screen, hashReady])

  // Hash -> screen on Back/Forward. Guard quiz (no realm -> realm-select). The `next === screen`
  // check makes our own programmatic hash writes above no-ops, so the two effects never loop.
  useEffect(() => {
    const onHash = () => {
      const next = HASH_TO_SCREEN[window.location.hash.replace(/^#/, '')]
      if (!next) return   // unknown fragment (e.g. the #main-content skip-link target): not a screen, ignore
      const s = useGameStore.getState()
      if (next === s.screen) return
      if (next === 'quiz' && !s.realm) { setScreen('realm-select'); return }
      setScreen(next)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [setScreen])

  // ── Navigation helper ─────────────────────────────────────────
  const nav = {
    home:        () => setScreen('home'),
    realms:      () => setScreen('realm-select'),
    character:   () => setScreen('character'),
    cards:       () => setScreen('cards'),
    leaderboard: () => setScreen('leaderboard'),
  }

  // Unique learning-card count for the nav badge: the store can hold duplicate cards for the same
  // question (id is a timestamp), and WisdomVault dedups by question text, so the badge dedups too
  // to stay consistent. Store-level dedup-on-add is flagged to T2.
  const uniqueCardCount = new Set(learningCards.map(c => c.question)).size

  // ── Screen routing ────────────────────────────────────────────
  // Every screen renders inside a <main> landmark, fronted by a skip-to-content link (revealed on
  // keyboard focus) so screen-reader / keyboard users can jump past the decorative star field and
  // nav straight to the screen content.
  let screenEl = null
  if (screen === 'home')              screenEl = <HomeScreen stats={stats} playerName={playerName} onBegin={() => setScreen('mode-select')} onDaily={() => setScreen('daily')} />
  else if (screen === 'daily')        screenEl = <DailyAether nav={nav} />
  else if (screen === 'mode-select')  screenEl = <ModeSelect onModeSelect={handleModeSelect} nav={nav} />
  else if (screen === 'realm-select') screenEl = <RealmSelect stats={stats} learningCardsCount={uniqueCardCount} onPick={handleSelectRealm} nav={nav} />
  else if (screen === 'quiz')         screenEl = <QuizScreen realm={realm} question={question} loading={loading} error={error} picked={picked} revealed={revealed} sessionScore={sessionScore} stats={stats} learningCardsCount={uniqueCardCount} onAnswer={handleAnswer} onNext={handleNext} onRetry={() => { setSeenIds([]); pickQuestion(realmQuestions, stats, realm, []) }} onSessionEnd={handleSessionEnd} nav={nav} />
  else if (screen === 'character')    screenEl = <CharacterSheet stats={stats} onBack={() => setScreen(realm ? 'quiz' : 'realm-select')} />
  else if (screen === 'cards')        screenEl = <WisdomVault cards={learningCards} cardOpen={cardOpen} onToggle={setCardOpen} onBack={() => setScreen(realm ? 'quiz' : 'realm-select')} />
  else if (screen === 'leaderboard')  screenEl = <Leaderboard leaderboard={leaderboard} playerName={playerName} onBack={() => setScreen('realm-select')} />

  return (
    <>
      {/* CSS :focus (not JS onFocus) reveals this so an App re-render can never reset the inline style.
          onClick focuses <main> directly and preventDefault keeps the hash clean so the routing
          hashchange listener never sees a #main-content fragment. */}
      <a href="#main-content" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main-content')?.focus() }}>Skip to main content</a>
      <main id="main-content" tabIndex={-1} style={{outline:'none'}}>{screenEl}</main>
    </>
  )
}
