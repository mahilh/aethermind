// AetherMind — Global game state
// T2 LANE · Zustand + Immer + persist · key: am-game-v1
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'

const INIT = {
  level:1, xp:0, xpToNext:100, correct:0, answered:0,
  attrs:{ wisdom:10, discernment:10, intuition:10, logic:10, pattern:10, compassion:10 },
  realm:{},
}

export const useGameStore = create(
  persist(
    immer((set) => ({
      // Persisted across sessions
      playerName: '', stats: INIT, learningCards: [],
      // Session only
      screen:'home', realm:null, question:null, loading:false, error:null,
      picked:null, revealed:false, sessionScore:{c:0,t:0}, cardOpen:null, leaderboard:[],

      setScreen: (s) => set(st => { st.screen = s }),
      setPlayerName: (n) => set(st => { st.playerName = n }),
      setRealm: (r) => set(st => { st.realm = r }),
      setQuestion: (q) => set(st => { st.question = q }),
      setLoading: (v) => set(st => { st.loading = v }),
      setError: (e) => set(st => { st.error = e }),
      setLeaderboard: (lb) => set(st => { st.leaderboard = lb }),
      setCardOpen: (i) => set(st => { st.cardOpen = st.cardOpen===i ? null : i }),
      resetQuestion: () => set(st => { st.question=null; st.picked=null; st.revealed=false; st.error=null }),
      resetSession: () => set(st => { st.sessionScore={c:0,t:0} }),

      answerQuestion: (idx) => set(st => {
        const q=st.question, realm=st.realm
        if (!q || st.picked!==null) return
        st.picked=idx; st.revealed=true
        const ok = idx===q.correct_index
        st.sessionScore.t+=1; if(ok) st.sessionScore.c+=1
        const xpGain = ok ? 15+st.stats.level*3 : 5
        const newXP = st.stats.xp+xpGain
        const lvlUp = newXP>=st.stats.xpToNext
        st.stats.xp = lvlUp ? newXP-st.stats.xpToNext : newXP
        st.stats.xpToNext = lvlUp ? Math.ceil(st.stats.xpToNext*1.65) : st.stats.xpToNext
        st.stats.level = lvlUp ? st.stats.level+1 : st.stats.level
        st.stats.correct+=ok?1:0; st.stats.answered+=1
        const rk=String(realm.id), rs=st.stats.realm[rk]||{c:0,t:0}
        st.stats.realm[rk]={c:rs.c+(ok?1:0),t:rs.t+1}
        if(ok) st.stats.attrs.wisdom=Math.min(100,st.stats.attrs.wisdom+0.5)
        st.stats.attrs.discernment=Math.min(100,st.stats.attrs.discernment+0.2)
        if(ok){
          if([3,8,11].includes(realm.id)) st.stats.attrs.intuition=Math.min(100,st.stats.attrs.intuition+0.8)
          if(realm.id===7)                st.stats.attrs.logic=Math.min(100,st.stats.attrs.logic+0.8)
          if([11,2].includes(realm.id))   st.stats.attrs.pattern=Math.min(100,st.stats.attrs.pattern+0.8)
          if([9,12,4].includes(realm.id)) st.stats.attrs.compassion=Math.min(100,st.stats.attrs.compassion+0.8)
        }
        if(!ok) st.learningCards.push({
          id:Date.now(), question:q.question,
          wrong:q.options[idx], correct:q.options[q.correct_index],
          explanation:q.explanation, insight:q.insight,
          realm:realm.name, color:realm.color, kt:q.knowledge_type,
          date:new Date().toLocaleDateString(),
        })
      }),
    })),
    { name:'am-game-v1', partialize:(st)=>({playerName:st.playerName,stats:st.stats,learningCards:st.learningCards}) }
  )
)
