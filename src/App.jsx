// AetherMind — Main App Shell
// T1 LANE: this file + all components · T2 provides store + lib (read only for T1)
import { useEffect, useCallback } from 'react'
import { useGameStore } from './store/useGameStore'
import { generateQuestion } from './lib/questionGenerator'
import { saveScore, getLeaderboard, subscribeLeaderboard, unsubscribeLeaderboard } from './lib/supabase'
import HomeScreen from './components/HomeScreen'
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
    resetQuestion, resetSession, answerQuestion, setCardOpen, setLeaderboard,
  } = useGameStore()

  const fetchQuestion = useCallback(async (r, level) => {
    setLoading(true); setError(null); resetQuestion()
    try { setQuestion(await generateQuestion(r, level)) }
    catch(e) { console.error('[AetherMind]', e); setError('The ether is disrupted — try again.') }
    finally { setLoading(false) }
  }, [setLoading, setError, resetQuestion, setQuestion])

  const handleSelectRealm = useCallback((r) => {
    setRealm(r); resetSession(); fetchQuestion(r, stats.level); setScreen('quiz')
  }, [setRealm, resetSession, fetchQuestion, stats.level, setScreen])

  const handleAnswer = useCallback((idx) => {
    answerQuestion(idx)
    if (playerName) saveScore(playerName, useGameStore.getState().stats).catch(console.error)
  }, [answerQuestion, playerName])

  useEffect(() => {
    if (screen !== 'leaderboard') return
    getLeaderboard().then(setLeaderboard).catch(console.error)
    const ch = subscribeLeaderboard(() => getLeaderboard().then(setLeaderboard).catch(console.error))
    return () => unsubscribeLeaderboard(ch)
  }, [screen, setLeaderboard])

  const nav = {
    home: () => setScreen('home'), realms: () => setScreen('realm-select'),
    character: () => setScreen('character'), cards: () => setScreen('cards'),
    leaderboard: () => setScreen('leaderboard'),
  }

  if (screen==='home')         return <HomeScreen stats={stats} playerName={playerName} onBegin={()=>setScreen('realm-select')} />
  if (screen==='realm-select') return <RealmSelect stats={stats} learningCardsCount={learningCards.length} onPick={handleSelectRealm} nav={nav} />
  if (screen==='quiz')         return <QuizScreen realm={realm} question={question} loading={loading} error={error} picked={picked} revealed={revealed} sessionScore={sessionScore} stats={stats} learningCardsCount={learningCards.length} onAnswer={handleAnswer} onNext={()=>fetchQuestion(realm,stats.level)} onRetry={()=>fetchQuestion(realm,stats.level)} nav={nav} />
  if (screen==='character')    return <CharacterSheet stats={stats} onBack={()=>setScreen(realm?'quiz':'realm-select')} />
  if (screen==='cards')        return <WisdomVault cards={learningCards} cardOpen={cardOpen} onToggle={setCardOpen} onBack={()=>setScreen(realm?'quiz':'realm-select')} />
  if (screen==='leaderboard')  return <Leaderboard leaderboard={leaderboard} playerName={playerName} onBack={()=>setScreen('realm-select')} />
  return null
}
