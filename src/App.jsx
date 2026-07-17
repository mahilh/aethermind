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
  if (screen === 'home')         return <HomeScreen stats={stats} playerName={playerName} onBegin={() => setScreen('mode-select')} onDaily={() => setScreen('daily')} />
  if (screen === 'daily')        return <DailyAether nav={nav} />
  if (screen === 'mode-select')  return <ModeSelect onModeSelect={handleModeSelect} nav={nav} />
  if (screen === 'realm-select') return <RealmSelect stats={stats} learningCardsCount={uniqueCardCount} onPick={handleSelectRealm} nav={nav} />
  if (screen === 'quiz')         return <QuizScreen realm={realm} question={question} loading={loading} error={error} picked={picked} revealed={revealed} sessionScore={sessionScore} stats={stats} learningCardsCount={uniqueCardCount} onAnswer={handleAnswer} onNext={handleNext} onRetry={() => { setSeenIds([]); pickQuestion(realmQuestions, stats, realm, []) }} onSessionEnd={handleSessionEnd} nav={nav} />
  if (screen === 'character')    return <CharacterSheet stats={stats} onBack={() => setScreen(realm ? 'quiz' : 'realm-select')} />
  if (screen === 'cards')        return <WisdomVault cards={learningCards} cardOpen={cardOpen} onToggle={setCardOpen} onBack={() => setScreen(realm ? 'quiz' : 'realm-select')} />
  if (screen === 'leaderboard')  return <Leaderboard leaderboard={leaderboard} playerName={playerName} onBack={() => setScreen('realm-select')} />
  return null
}
