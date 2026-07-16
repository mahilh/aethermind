// AetherMind · Core constants · T2 LANE
// Realms linked to books in Drive: 1eUnI4kX4joj_EwRy6GTdoLJav7AwobbF

const STORAGE = 'https://gsogycwtllthrenqaxlh.supabase.co/storage/v1/object/public/question-images/realms'

export const REALMS = [
  { id:1,  name:'Ancient Civilizations', glyph:'𓂀', color:'#D4AF37', desc:'Egypt · Sumer · Maya · Göbekli Tepe',
    topics:'Egyptian mysteries pyramids hieroglyphs, Sumerian tablets Anunnaki, Mayan calendar, Göbekli Tepe megalithic, Dogon tribe Sirius, ancient astronomical alignments, pyramid engineering',
    imageUrl:STORAGE+'/realm-01-ancient-civilizations.png' },
  { id:2,  name:'Hermetic Wisdom',        glyph:'☿', color:'#C9A227', desc:'Emerald Tablet · Alchemy · Kybalion',
    topics:'seven Hermetic principles, Corpus Hermeticum Poemandres, Emerald Tablet, Kybalion mentalism vibration correspondence, sacred geometry, alchemy transmutation, mystery schools Pythagoras',
    imageUrl:STORAGE+'/realm-02-hermetic-wisdom.png' },
  { id:3,  name:'Gnosticism',             glyph:'⊛', color:'#A855F7', desc:'Sophia · Nag Hammadi · Aeons',
    topics:'Demiurge false creator, Sophia fallen wisdom, Aeons Pleroma, Nag Hammadi texts, Gospel of Thomas, archons matrix, gnosis divine spark trapped in matter, pistis sophia',
    imageUrl:STORAGE+'/realm-03-gnosticism.png' },
  { id:4,  name:'Eastern Traditions',    glyph:'☯', color:'#10B981', desc:'Vedanta · Buddhism · Taoism · Zen',
    topics:'Advaita Vedanta non-dual, Buddhist dharma Four Noble Truths, Tao Te Ching wu wei, Zen koans satori, Kashmir Shaivism Shiva, chakras kundalini, tantra, karma samsara moksha maya',
    imageUrl:STORAGE+'/realm-04-eastern-traditions.png' },
  { id:5,  name:'Consciousness',          glyph:'◉', color:'#EC4899', desc:'NDEs · Meditation · Quantum Mind',
    topics:'near-death experiences light tunnel, out-of-body astral projection, lucid dreaming WILD MILD, meditation samadhi, flow state, psychedelic research DMT psilocybin, Default Mode Network, hard problem of consciousness',
    imageUrl:STORAGE+'/realm-05-consciousness.png' },
  { id:6,  name:'Psychology',             glyph:'🜲', color:'#F59E0B', desc:'Jung · Shadow · Archetypes',
    topics:'Jungian psychology archetypes shadow integration, individuation Self, collective unconscious, anima animus, synchronicity, active imagination, persona complex, hero myth monomyth Campbell',
    imageUrl:STORAGE+'/realm-06-psychology.png' },
  { id:7,  name:'Quantum Physics',        glyph:'⚛', color:'#06B6D4', desc:'Quantum · Holographic · Cosmology',
    topics:'wave-particle duality double slit, quantum entanglement nonlocality, observer effect consciousness, holographic principle Bohm implicate order, superposition collapse, many worlds, zero-point field',
    imageUrl:STORAGE+'/realm-07-quantum-physics.png' },
  { id:8,  name:'Esoteric Science',       glyph:'✦', color:'#C084FC', desc:'Law of One · Bashar · Council of Nine',
    topics:'Ra Material Law of One densities wanderers harvest, Bashar excitement parallel realities, Dolores Cannon QHHT, Theosophy Blavatsky root races, Seth Material, Council of Nine, Michael Newton between lives',
    imageUrl:STORAGE+'/realm-08-esoteric-science.png' },
  { id:9,  name:'Comparative Religion',   glyph:'✡', color:'#6EE7B7', desc:'Sufism · Kabbalah · Mysticism',
    topics:'Sufi mysticism Rumi fana, Kabbalah Sefirot Tree of Life Ein Sof, Christian mysticism Eckhart, Islamic esotericism, Zoroastrianism, perennial philosophy Huxley, mystical union unio mystica',
    imageUrl:STORAGE+'/realm-09-comparative-religion.png' },
  { id:10, name:'Hidden History',         glyph:'◈', color:'#F97316', desc:'Atlantis · Annunaki · Lost Civilizations',
    topics:'Atlantis Plato Timaeus Critias, Lemuria Mu Churchward, Annunaki Sitchin Sumerian gods, ancient astronaut theory, megalithic Puma Punku Baalbek, alternative archaeology Graham Hancock, Younger Dryas',
    imageUrl:STORAGE+'/realm-10-hidden-history.png' },
  { id:11, name:'Symbolism',              glyph:'⬡', color:'#8B5CF6', desc:'Tarot · Sacred Numbers · Mandalas',
    topics:'Major Arcana Tarot archetypes, sacred numerology Pythagoras, Flower of Life Metatrons Cube, mandalas yantras, alchemical symbols, astrology natal chart, sigils, cymatics sacred sound geometry',
    imageUrl:STORAGE+'/realm-11-symbolism.png' },
  { id:12, name:'Ethics & Wisdom',        glyph:'⚖', color:'#7DD3FC', desc:'Stoics · Plato · Wisdom Traditions',
    topics:'Stoic virtue Marcus Aurelius Epictetus, Socratic method examined life, Plato philosopher king Republic, practical wisdom phronesis, Buddhist ethics, golden rule all traditions, karma moral law',
    imageUrl:STORAGE+'/realm-12-ethics-wisdom.png' },
]

// Deterministic daily realm: same for every player on a given calendar day (UTC),
// rotates every 24h. T1 consumes this for a "TODAY'S REALM" spotlight on RealmSelect.
export const getDailyRealm = () => {
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  return REALMS[daysSinceEpoch % REALMS.length]
}

export const KNOWLEDGE_TYPES = {
  empirical:     { label:'Empirically Established', stars:'★★★★★', color:'#4ADE80' },
  historical:    { label:'Historically Documented',  stars:'★★★★☆', color:'#86EFAC' },
  philosophical: { label:'Philosophically Argued',   stars:'★★★☆☆', color:'#FCD34D' },
  esoteric:      { label:'Esoteric Tradition',       stars:'★★☆☆☆', color:'#FB923C' },
  channeled:     { label:'Channeled Material',       stars:'★☆☆☆☆', color:'#C084FC' },
  speculative:   { label:'Speculative Hypothesis',   stars:'★★☆☆☆', color:'#F87171' },
}

export const ATTRS = [
  { key:'wisdom',      label:'Wisdom',         color:'#FCD34D' },
  { key:'discernment', label:'Discernment',    color:'#4ADE80' },
  { key:'intuition',   label:'Intuition',      color:'#E879F9' },
  { key:'logic',       label:'Logic',          color:'#22D3EE' },
  { key:'pattern',     label:'Pattern Sight',  color:'#A78BFA' },
  { key:'compassion',  label:'Compassion',     color:'#FB923C' },
]

export const GAME_MODES = [
  { id:'classic',  label:'Classic Quest',  icon:'◉', desc:'Adaptive · unlimited time',   xpMult:1.0 },
  { id:'speed',    label:'Speed Oracle',   icon:'⚡', desc:'30 seconds per question',     xpMult:1.5 },
  { id:'survival', label:'Survival Run',   icon:'♥', desc:'3 lives · wrong = lose one',   xpMult:2.0 },
  { id:'gauntlet', label:'Realm Gauntlet', icon:'⚔', desc:'10 questions · one realm',     xpMult:2.5 },
  { id:'blind',    label:'Blind Seer',     icon:'◈', desc:'No knowledge badge',           xpMult:3.0 },
]

// Deterministic star positions: never Math.random() (it changes every render)
export const STARS = Array.from({length:70}, (_,i) => ({
  x: (i*137.5)%100, y: (i*97.3)%100,
  s: 1+(i%3), o: 0.15+(i%6)*0.1, d: (i%8)*0.6,
}))
