'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Star, 
  Info, 
  Shuffle, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Award,
  Search,
  Sparkles,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { difficultyThemes } from '@/lib/theme'
import AnimatedShaderBackground from '@/components/ui/animated-shader-background'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

type AgentRow = Database['public']['Tables']['agents']['Row']
type DifficultyKey = 'moderate' | 'hard' | 'veryHard' | 'expert' | 'easy'
interface HomeownerAgent {
  id: string
  name: string
  agentId: string
  age?: number
  occupation?: string
  location?: string
  personality?: string
  challengeLevel: number
  challengeLabel: string
  difficulty: DifficultyKey
  traits: string[]
  bestFor: string
  recommended?: boolean
  mostChallenging?: boolean
  avatar: string
  color: string
  estimatedTime?: string
  startingScore?: number
  targetScore?: number
}

const SUPABASE_COLOR_MAP = ['green', 'yellow', 'red', 'orange', 'purple', 'blue', 'teal', 'emerald', 'pink', 'sky'] as const
const SUPABASE_AVATARS = ['🏡', '💼', '🔍', '💵', '📊', '🛡️', '🧠', '🏙️', '🎯', '🏠'] as const

const FALLBACK_AGENTS: HomeownerAgent[] = [
  {
    id: 'austin',
    name: 'Austin',
    agentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz',
    age: 38,
    occupation: 'Works from Home',
    location: 'Texas',
    personality: 'Skeptical but fair, direct communicator',
    challengeLevel: 2,
    challengeLabel: 'Moderate',
    difficulty: 'moderate',
    startingScore: 50,
    targetScore: 70,
    estimatedTime: '5-8 min',
    traits: [
      'Asks direct questions',
      'Detects pressure tactics',
      'Terminates after 3 pricing deflections',
      'Has ants in kitchen',
    ],
    bestFor: 'Learning to handle direct questions and build trust',
    recommended: true,
    avatar: '🏡',
    color: 'green',
  },
  {
    id: 'derek',
    name: 'Decisive Derek',
    agentId: 'agent_5401k6bysxp8frv80yn1p6ecbvb7',
    age: 45,
    occupation: 'VP of Operations',
    location: 'Executive',
    personality: 'Time-conscious executive, premium buyer',
    challengeLevel: 3,
    challengeLabel: 'Hard',
    difficulty: 'hard',
    startingScore: 50,
    targetScore: 70,
    estimatedTime: '8-10 min',
    traits: [
      '10-minute HARD time limit',
      'Requires termite expertise (CRITICAL)',
      'Wants executive-level service',
      'Has termite damage and carpenter bees',
    ],
    bestFor: 'Practicing efficiency and executive-level communication',
    avatar: '💼',
    color: 'yellow',
  },
  {
    id: 'sarah',
    name: 'Skeptical Sarah',
    agentId: 'agent_5501k6bys8swf03sqaa13pf1xda5',
    age: 42,
    occupation: 'Single Mom',
    location: 'Previously Scammed',
    personality: 'Requires extensive verification, extremely cautious',
    challengeLevel: 5,
    challengeLabel: 'Expert',
    difficulty: 'expert',
    startingScore: 20,
    targetScore: 120,
    estimatedTime: '12-15 min',
    traits: [
      'Real-time credential verification required',
      'Needs references and documentation',
      'HIGHEST trust threshold',
      'Zero tolerance for lies or missing credentials',
    ],
    bestFor: 'Mastering trust-building and credential presentation',
    recommended: false,
    mostChallenging: true,
    avatar: '🔍',
    color: 'red',
  },
  {
    id: 'bill',
    name: 'Budget-Conscious Bill',
    agentId: 'agent_7001k6bynr1sfsvaqkd1a3r9j7j3',
    age: 62,
    occupation: 'Retired Veteran',
    location: 'Fixed Income',
    personality: 'Price-focused, needs value justification',
    challengeLevel: 3,
    challengeLabel: 'Hard',
    difficulty: 'hard',
    startingScore: 50,
    targetScore: 80,
    estimatedTime: '8-12 min',
    traits: [
      '$25-40/month budget maximum',
      'Requires senior/veteran discount',
      'Currently using $8 Home Depot spray',
      'Rejects if over budget',
    ],
    bestFor: 'Learning discount strategies and value communication',
    recommended: false,
    avatar: '💵',
    color: 'yellow',
  },
  {
    id: 'ashley',
    name: 'Analytical Ashley',
    agentId: 'agent_6301k6byn0x4ff3ryjvg3fee6gpg',
    age: 38,
    occupation: 'Data Analyst, PhD',
    location: 'Research-Focused',
    personality: 'Evidence-based decisions, research-heavy',
    challengeLevel: 4,
    challengeLabel: 'Very Hard',
    difficulty: 'veryHard',
    startingScore: 40,
    targetScore: 120,
    estimatedTime: '10-15 min',
    traits: [
      'Asks technical EPA regulation questions',
      'Wants 5-7 days to analyze',
      'Catches made-up data instantly',
      'Has German cockroaches (difficult pest)',
    ],
    bestFor: 'Practicing technical knowledge and documentation skills',
    recommended: false,
    avatar: '📊',
    color: 'orange',
  },
]

const FALLBACK_AGENT_MAP = FALLBACK_AGENTS.reduce<Record<string, HomeownerAgent>>((acc, agent) => {
  acc[agent.name] = agent
  return acc
}, {})

const difficultyLabelMap: Record<DifficultyKey, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
  veryHard: 'Very Hard',
  expert: 'Expert',
}

const difficultyLevelMap: Record<DifficultyKey, number> = {
  easy: 1,
  moderate: 2,
  hard: 3,
  veryHard: 4,
  expert: 5,
}

const sanitizePersonaTraits = (persona?: string | null): string[] => {
  if (!persona) return []
  const cleaned = persona
    .split(/\r?\n|\.|•|-|\u2022/)
    .map((part) => part.replace(/^[•\-\s]+/, '').trim())
    .filter((part) => part.length > 2)
  return Array.from(new Set(cleaned)).slice(0, 4)
}

const parseDifficulty = (persona?: string | null): DifficultyKey | undefined => {
  const match = persona?.match(/(easy|moderate|very hard|hard|expert)/i)?.[1]?.toLowerCase()
  if (!match) return undefined
  if (match === 'very hard') return 'veryHard'
  if (match === 'hard') return 'hard'
  if (match === 'moderate') return 'moderate'
  if (match === 'expert') return 'expert'
  if (match === 'easy') return 'easy'
  return undefined
}

const hydrateAgent = (row: AgentRow, index: number): HomeownerAgent => {
  const fallback = FALLBACK_AGENT_MAP[row.name]
  const difficultyFromPersona = parseDifficulty(row.persona) ?? fallback?.difficulty ?? 'moderate'
  const challengeLabel = fallback?.challengeLabel ?? difficultyLabelMap[difficultyFromPersona]
  const challengeLevel = fallback?.challengeLevel ?? difficultyLevelMap[difficultyFromPersona]
  const traits = fallback?.traits ?? sanitizePersonaTraits(row.persona)
  const avatar = fallback?.avatar ?? SUPABASE_AVATARS[index % SUPABASE_AVATARS.length]
  const color = fallback?.color ?? SUPABASE_COLOR_MAP[index % SUPABASE_COLOR_MAP.length]

  return {
    id: row.id,
    name: row.name,
    agentId: row.eleven_agent_id,
    age: fallback?.age,
    occupation: fallback?.occupation ?? 'Homeowner',
    location: fallback?.location ?? 'United States',
    personality: fallback?.personality ?? (row.persona?.split('.').at(0)?.trim() || 'Dynamic homeowner persona'),
    challengeLevel,
    challengeLabel,
    difficulty: difficultyFromPersona,
    traits: traits.length > 0 ? traits : ['Dynamic objections', 'Authentic reactions', 'Personalized skepticism', 'Realistic scheduling concerns'],
    bestFor: fallback?.bestFor ?? 'Sharpen diverse objection handling and value delivery',
    recommended: fallback?.recommended,
    mostChallenging: fallback?.mostChallenging,
    avatar,
    color,
    estimatedTime: fallback?.estimatedTime ?? '8-12 min',
    startingScore: fallback?.startingScore ?? 40,
    targetScore: fallback?.targetScore ?? 90,
  }
}

interface HomeownerSelectorProps {
  onSelect?: (agentId: string, agentName: string) => void
  standalone?: boolean
}

export default function HomeownerSelector({ onSelect, standalone = false }: HomeownerSelectorProps) {
  const router = useRouter()
  const supabase = createClient()
  const [showTooltip, setShowTooltip] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recommended' | 'difficulty' | 'name'>('recommended')
  const [agents, setAgents] = useState<HomeownerAgent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Failed to load homeowner agents:', error)
        setLoading(false)
        return
      }

      if (data) {
        const hydrated: HomeownerAgent[] = data
          .filter((agent) => Boolean(agent.eleven_agent_id))
          .map((agent, index) => hydrateAgent(agent as AgentRow, index))
        setAgents(hydrated)
      }
      setLoading(false)
    }

    fetchAgents()
  }, [])

  const handleSelectAgent = (agentId: string, agentName: string) => {
    setSelectedAgent(agentId)

    // Small delay for visual feedback
    setTimeout(() => {
      if (onSelect) {
        onSelect(agentId, agentName)
      } else if (standalone) {
        router.push(`/trainer?agent=${agentId}&name=${encodeURIComponent(agentName)}`)
      }
    }, 300)
  }

  const handleRandomSelection = () => {
    const collection = agents.length > 0 ? agents : FALLBACK_AGENTS
    if (collection.length === 0) return
    const randomIndex = Math.floor(Math.random() * collection.length)
    const randomAgent = collection[randomIndex]
    if (randomAgent) {
      handleSelectAgent(randomAgent.agentId, randomAgent.name)
    }
  }

  const renderStars = (level: number, size: number = 16) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={size}
            className={cn(
              "transition-all duration-200",
              i < level ? 'fill-current opacity-100' : 'opacity-20'
            )}
          />
        ))}
      </div>
    )
  }

const filteredAgents = useMemo(() => {
  const list = agents.length > 0 ? agents : FALLBACK_AGENTS

  return [...list]
    .filter((agent) => {
      const target = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !target ||
        agent.name.toLowerCase().includes(target) ||
        (agent.occupation ?? '').toLowerCase().includes(target) ||
        (agent.personality ?? '').toLowerCase().includes(target)
      const matchesDifficulty =
        filterDifficulty === 'all' || agent.difficulty === filterDifficulty
      return matchesSearch && matchesDifficulty
    })
    .sort((a, b) => {
      if (sortBy === 'recommended') {
        if (a.recommended && !b.recommended) return -1
        if (!a.recommended && b.recommended) return 1
        return a.challengeLevel - b.challengeLevel
      }
      if (sortBy === 'difficulty') {
        return a.challengeLevel - b.challengeLevel
      }
      return a.name.localeCompare(b.name)
    })
}, [agents, filterDifficulty, searchQuery, sortBy])

  const usingFallback = !loading && agents.length === 0

  return (
    <div className="min-h-screen bg-black relative">
      {/* Animated Shader Background */}
      <AnimatedShaderBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-6 py-2 mb-6"
          >
            <Sparkles size={18} className="text-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">Premium Sales Training</span>
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight drop-shadow-lg">
            Choose Your
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"> Challenge</span>
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            Select a homeowner persona to practice your sales skills in realistic scenarios
          </p>

          {usingFallback && (
            <p className="text-sm text-amber-300/90 bg-amber-500/10 border border-amber-400/30 rounded-full inline-block px-4 py-1">
              Showing default personas while we load your Supabase agents
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <button
              onClick={handleRandomSelection}
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105"
            >
              <Shuffle size={20} className="group-hover:rotate-180 transition-transform duration-500" />
              Surprise Me
            </button>

            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/30 hover:border-white/40 text-white px-6 py-3 rounded-xl transition-all duration-200 font-medium"
            >
              <Info size={18} />
              Difficulty Guide
            </button>
          </div>

          {/* Tooltip */}
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="inline-block bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-2xl p-6 shadow-2xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex text-emerald-400">{renderStars(2)}</div>
                    <span className="text-sm text-slate-300">Moderate - Great for beginners</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-400">{renderStars(3)}</div>
                    <span className="text-sm text-slate-300">Hard - Requires skill</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex text-orange-400">{renderStars(4)}</div>
                    <span className="text-sm text-slate-300">Very Hard - Advanced tactics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex text-red-400">{renderStars(5)}</div>
                    <span className="text-sm text-slate-300">Expert - Master level</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search homeowners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/70 backdrop-blur-sm border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Filter by Difficulty */}
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="bg-slate-900/70 backdrop-blur-sm border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-4 py-3 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
            <option value="veryHard">Very Hard</option>
            <option value="expert">Expert</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900/70 backdrop-blur-sm border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-4 py-3 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="recommended">Recommended</option>
            <option value="difficulty">By Difficulty</option>
            <option value="name">By Name</option>
          </select>
        </motion.div>

        {/* Homeowner Cards Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredAgents.map((agent, index) => {
            const theme = difficultyThemes[agent.difficulty] ?? difficultyThemes.moderate
            const isSelected = selectedAgent === agent.agentId

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative"
              >
                <div
                  className={cn(
                    "relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border-2 transition-all duration-300 overflow-hidden h-full shadow-xl",
                    theme.border,
                    theme.hover,
                    isSelected && "ring-4 ring-indigo-500/50 shadow-2xl"
                  )}
                >
                  {/* Gradient overlay on hover */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300",
                    theme.gradient
                  )} />

                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-10">
                    {agent.recommended && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1 shadow-lg"
                      >
                        <Award size={12} />
                        Recommended
                      </motion.span>
                    )}
                    {agent.mostChallenging && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1 shadow-lg"
                      >
                        <AlertTriangle size={12} />
                        Expert Level
                      </motion.span>
                    )}
                  </div>

                  <div className="relative p-6">
                    {/* Avatar & Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className={cn(
                        "text-5xl p-3 rounded-2xl",
                        theme.bg
                      )}>
                        {agent.avatar}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-1">{agent.name}</h2>
                        <p className="text-slate-400 text-sm">
                          {agent.age} • {agent.occupation}
                        </p>
                        <p className="text-slate-500 text-xs italic mt-0.5">{agent.location}</p>
                      </div>
                    </div>

                    {/* Challenge Level */}
                    <div className={cn("rounded-xl p-4 mb-6", theme.bg)}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-300">Challenge Level</span>
                        <span className={cn("text-sm font-bold", theme.text)}>
                          {agent.challengeLabel}
                        </span>
                      </div>
                      <div className={theme.text}>
                        {renderStars(agent.challengeLevel, 16)}
                      </div>
                    </div>

                    {/* Key Challenges */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                        <TrendingUp size={16} />
                        Key Challenges
                      </h3>
                      <ul className="space-y-2">
                        {agent.traits.map((trait, idx) => (
                          <li key={idx} className="text-sm text-slate-400 flex items-start gap-2 leading-relaxed">
                            <span className={cn("mt-1 flex-shrink-0", theme.text)}>•</span>
                            <span className="flex-1">{trait}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Best For */}
                    <div className="mb-6 p-4 bg-slate-900/30 rounded-xl border border-slate-700/50">
                      <h3 className="text-xs font-semibold text-slate-400 mb-2">Best For:</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">{agent.bestFor}</p>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => handleSelectAgent(agent.agentId, agent.name)}
                      className={cn(
                        "w-full text-white py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg group/btn",
                        theme.button,
                        isSelected && "ring-2 ring-white/50"
                      )}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle size={20} />
                          Selected - Starting...
                        </>
                      ) : (
                        <>
                          Start Practice
                          <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col gap-3 bg-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-8 py-6 shadow-xl">
            <p className="text-sm text-white/80 flex items-center gap-2 drop-shadow">
              <Sparkles size={16} className="text-indigo-400" />
              New to sales training? Start with Austin to build foundational skills
            </p>
            <p className="text-xs text-white/60 drop-shadow">
              Each persona is designed to challenge different aspects of your sales technique
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}