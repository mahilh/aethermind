// AetherMind: Main App Shell (Supabase-powered questions)
// T1 LANE: this file + all components
// T2 provides store + lib (read only for T1)
import { useEffect, useCallback, useState } from 'react'
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

export default function App() {
  const {
    screen, realm, question, loading, error, picked, revealed,
    sessionScore, learningCards, cardOpen, leaderboard, playerName, stats,
    setScreen, setRealm, setQuestion, setLoading, setError,
    resetQuestion, resetSession, answerQuestion, setCardOpen, setLeaderboard, setGameMode,
  } = useGameStore()

  // Realm question pool (loaded once per realm session, free Supabase reads)
  const [realmQuestions, setRealmQuestions] = useState([])
  const [seenIds, setSeenIds] = useState([])

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
    const dbQ = selectQuestion(questions, currentStats, currentRealm, currentSeenIds)
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
    setSeenIds([])
    setScreen('quiz')
    const questions = await loadRealmQuestions(r)
    if (questions.length > 0) {
      pickQuestion(questions, stats, r, [])
    }
  }, [setRealm, resetSession, setScreen, loadRealmQuestions, pickQuestion, stats])

  // ── Next question from existing pool ──────────────────────────
  const handleNext = useCallback(() => {
    pickQuestion(realmQuestions, useGameStore.getState().stats, realm, seenIds)
  }, [realmQuestions, realm, seenIds, pickQuestion])

  // ── Mode chosen → store it, then go to realm select ───────────
  const handleModeSelect = useCallback((modeId) => {
    setGameMode(modeId)
    setScreen('realm-select')
  }, [setGameMode, setScreen])

  // ── Answer handler ────────────────────────────────────────────
  const handleAnswer = useCallback((idx) => {
    answerQuestion(idx)
    if (playerName) {
      const updated = useGameStore.getState().stats
      saveScore(playerName, updated).catch(console.error)
    }
  }, [answerQuestion, playerName])

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

  // ── Screen routing ────────────────────────────────────────────
  if (screen === 'home')         return <HomeScreen stats={stats} playerName={playerName} onBegin={() => setScreen('mode-select')} />
  if (screen === 'mode-select')  return <ModeSelect onModeSelect={handleModeSelect} nav={nav} />
  if (screen === 'realm-select') return <RealmSelect stats={stats} learningCardsCount={learningCards.length} onPick={handleSelectRealm} nav={nav} />
  if (screen === 'quiz')         return <QuizScreen realm={realm} question={question} loading={loading} error={error} picked={picked} revealed={revealed} sessionScore={sessionScore} stats={stats} learningCardsCount={learningCards.length} onAnswer={handleAnswer} onNext={handleNext} onRetry={() => pickQuestion(realmQuestions, stats, realm, seenIds)} nav={nav} />
  if (screen === 'character')    return <CharacterSheet stats={stats} onBack={() => setScreen(realm ? 'quiz' : 'realm-select')} />
  if (screen === 'cards')        return <WisdomVault cards={learningCards} cardOpen={cardOpen} onToggle={setCardOpen} onBack={() => setScreen(realm ? 'quiz' : 'realm-select')} />
  if (screen === 'leaderboard')  return <Leaderboard leaderboard={leaderboard} playerName={playerName} onBack={() => setScreen('realm-select')} />
  return null
}
