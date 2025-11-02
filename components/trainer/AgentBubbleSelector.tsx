'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { getAgentImageStyle } from '@/lib/agents/imageStyles'
import { cn } from '@/lib/utils'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import {
  ALLOWED_AGENT_SET,
  ALLOWED_AGENT_ORDER,
  AllowedAgentName,
  PERSONA_METADATA,
} from '@/components/trainer/personas'

type AgentRow = Database['public']['Tables']['agents']['Row']

interface HomeownerAgentDisplay {
  id: string
  name: string
  agentId: string
  subtitle: string
  difficulty: DifficultyKey
  color: keyof typeof COLOR_VARIANTS
  description: string
  image?: string
  sessionCount?: number
  bestScore?: number | null
  avgDuration?: number | null
  isLocked?: boolean
  isMastered?: boolean
}
const COLOR_CYCLE: (keyof typeof COLOR_VARIANTS)[] = [
  'primary',
  'tertiary',
  'quinary',
  'secondary',
  'senary',
  'quaternary',
  'septenary',
  'octonary',
  'nonary',
  'denary',
  'duodenary',
  'undenary',
]
type DifficultyKey = 'Easy' | 'Moderate' | 'Hard' | 'Very Hard' | 'Expert'
const DIFFICULTY_BADGES: Record<DifficultyKey, string> = {
  Easy: 'bg-green-500/20 text-green-300 border border-green-500/30',
  Moderate: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  Hard: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  'Very Hard': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  Expert: 'bg-red-500/20 text-red-300 border border-red-500/30',
}
const sanitizeDescription = (persona?: string | null): string => {
  if (!persona) return 'Dynamic AI homeowner with unique objections and goals'
  return persona.split(/\r?\n|\.|•|-/).map((part) => part.trim()).filter(Boolean)[0] ?? persona
}

const parseDifficulty = (agentName: string, persona?: string | null): DifficultyKey => {
  const personaMeta = PERSONA_METADATA[agentName as AllowedAgentName]
  const fallback = personaMeta?.bubble.difficulty
  const match = persona?.match(/(easy|moderate|very hard|hard|expert)/i)?.[1]?.toLowerCase()
  if (match === 'easy') return 'Easy'
  if (match === 'moderate') return 'Moderate'
  if (match === 'very hard') return 'Very Hard'
  if (match === 'hard') return 'Hard'
  if (match === 'expert') return 'Expert'
  return fallback ?? 'Moderate'
}

const mapAgentToDisplay = (agent: AgentRow, index: number): HomeownerAgentDisplay => {
  const fallback = PERSONA_METADATA[agent.name as AllowedAgentName]
  const difficulty = parseDifficulty(agent.name, agent.persona)
  const subtitle = fallback?.bubble.subtitle ?? 'Homeowner Persona'
  const description = fallback?.bubble.description ?? sanitizeDescription(agent.persona)
  const color = fallback?.bubble.color ?? COLOR_CYCLE[index % COLOR_CYCLE.length]
  const image = fallback?.bubble.image

  return {
    id: agent.id,
    name: agent.name,
    agentId: agent.eleven_agent_id,
    subtitle,
    difficulty,
    color,
    description,
    image,
  }
}

interface AgentBubbleSelectorProps {
  onSelect?: (agentId: string, agentName: string) => void
  standalone?: boolean
}

const AnimatedGrid = () => (
  <motion.div
    className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"
    animate={{
      backgroundPosition: ["0% 0%", "100% 100%"],
    }}
    transition={{
      duration: 40,
      repeat: Number.POSITIVE_INFINITY,
      ease: "linear",
    }}
  >
    <div className="h-full w-full [background-image:repeating-linear-gradient(100deg,#64748B_0%,#64748B_1px,transparent_1px,transparent_4%)] opacity-10" />
  </motion.div>
)

export default function AgentBubbleSelector({ onSelect, standalone = false }: AgentBubbleSelectorProps) {
  const router = useRouter()
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null)
  const supabase = createClient()
  const [agents, setAgents] = useState<HomeownerAgentDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'difficulty' | 'unplayed' | 'struggles'>('all')
  const [sortedAgents, setSortedAgents] = useState<HomeownerAgentDisplay[]>([])
  const [suggestedAgent, setSuggestedAgent] = useState<string | null>(null)

  useEffect(() => {
    const fetchAgents = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Fetch agents
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      
      // Check subscription status
      let hasActiveSubscription = false
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_status, trial_ends_at')
          .eq('id', user.id)
          .single()
        
        const status = userData?.subscription_status
        const isTrialing = status === 'trialing' && userData?.trial_ends_at && new Date(userData.trial_ends_at) > new Date()
        hasActiveSubscription = status === 'active' || isTrialing
      }
      
      // Fetch user's sessions for stats
      let sessions: any[] = []
      if (user) {
        const { data: sessionData } = await supabase
          .from('live_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { descending: true })
        if (sessionData) sessions = sessionData
      }
      
      if (!error && data) {
        const filtered = data.filter((agent: AgentRow) => Boolean(agent.eleven_agent_id) && ALLOWED_AGENT_SET.has(agent.name as AllowedAgentName))
        const sorted = filtered.sort((a: AgentRow, b: AgentRow) => ALLOWED_AGENT_ORDER.indexOf(a.name as AllowedAgentName) - ALLOWED_AGENT_ORDER.indexOf(b.name as AllowedAgentName))

        const hydrated = sorted.map((agent: AgentRow, index: number) => {
          const agentSessions = sessions.filter((s: any) => s.agent_name === agent.name)
          const completedSessions = agentSessions.filter(s => s.overall_score !== null && s.overall_score > 0)
          const bestScore = completedSessions.length > 0 
            ? Math.max(...completedSessions.map(s => s.overall_score || 0))
            : null
          const avgDuration = completedSessions.length > 0
            ? Math.round(completedSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / completedSessions.length / 60)
            : null
          
          // All agents remain visually available; access is enforced when starting a session
          const isLocked = false
          const isMastered = completedSessions.length >= 5 && bestScore && bestScore >= 80
          
          return {
            ...mapAgentToDisplay(agent as AgentRow, index),
            sessionCount: agentSessions.length,
            bestScore,
            avgDuration,
            isLocked,
            isMastered
          }
        })
        setAgents(hydrated)
        setSortedAgents(hydrated)
        
        // Determine suggested agent based on user analytics
        const unplayedAgents = hydrated.filter((a: HomeownerAgentDisplay) => !a.sessionCount || a.sessionCount === 0)
        const lowScoreAgents = hydrated.filter((a: HomeownerAgentDisplay) => a.bestScore && a.bestScore < 70).sort((a: HomeownerAgentDisplay, b: HomeownerAgentDisplay) => (a.bestScore || 0) - (b.bestScore || 0))
        const availableAgents = hydrated.filter((a: HomeownerAgentDisplay) => !a.isLocked)
        
        if (lowScoreAgents.length > 0) {
          // Suggest the agent with lowest score for improvement
          setSuggestedAgent(lowScoreAgents[0].name)
        } else if (unplayedAgents.length > 0) {
          // Suggest next unplayed agent
          setSuggestedAgent(unplayedAgents[0].name)
        } else if (availableAgents.length > 0) {
          // Suggest random available agent
          setSuggestedAgent(availableAgents[Math.floor(Math.random() * availableAgents.length)].name)
        }
      }
      setLoading(false)
    }
    fetchAgents()
  }, [])
  
  // Apply filtering
  useEffect(() => {
    let filtered = [...agents]
    
    switch (filter) {
      case 'difficulty':
        const difficultyOrder = ['Easy', 'Moderate', 'Hard', 'Very Hard', 'Expert']
        filtered.sort((a, b) => difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty))
        break
      case 'unplayed':
        filtered.sort((a, b) => (a.sessionCount || 0) - (b.sessionCount || 0))
        break
      case 'struggles':
        filtered.sort((a, b) => (a.bestScore || 100) - (b.bestScore || 100))
        break
      default:
        filtered = [...agents]
    }
    
    setSortedAgents(filtered)
  }, [filter, agents])

  const handleRandomAgent = () => {
    if (agents.length === 0) return
    const randomAgent = agents[Math.floor(Math.random() * agents.length)]
    handleSelectAgent(randomAgent.agentId, randomAgent.name)
  }

  const handleSelectAgent = async (agentId: string, agentName: string) => {
    // Check if user is logged in first
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Redirect to sign in page, preserving the intended agent selection
      router.push(`/auth/login?next=/trainer?agent=${agentId}&name=${encodeURIComponent(agentName)}`)
      return
    }
    
    setSelectedAgent(agentId)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('trainer:select-agent', {
        detail: {
          agentId,
          agentName,
        },
      }))
    }
    
    setTimeout(() => {
      if (onSelect) {
        onSelect(agentId, agentName)
      } else if (standalone) {
        router.push(`/trainer?agent=${agentId}&name=${encodeURIComponent(agentName)}`)
      }
    }, 400)
  }

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center">
        <AnimatedGrid />
        <div className="relative z-10 text-white">Loading homeowners…</div>
      </div>
    )
  }

  if (!loading && agents.length === 0) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center">
        <AnimatedGrid />
        <div className="relative z-10 text-center text-slate-300 space-y-3">
          <p className="text-xl font-semibold">No homeowner agents found</p>
          <p className="text-sm text-slate-500 max-w-sm">
            Add active homeowner personas in Supabase with an ElevenLabs agent ID to see them here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">
      <AnimatedGrid />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 flex flex-col items-center gap-2"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent pb-1 leading-tight">
            Choose Your Challenge
          </h1>
          <p className="text-sm text-slate-400">
            Select a homeowner to begin your training session
          </p>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6 flex flex-wrap items-center justify-center gap-2"
        >
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              filter === 'all'
                ? "bg-white/20 text-white border border-white/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter('difficulty')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              filter === 'difficulty'
                ? "bg-white/20 text-white border border-white/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
            )}
          >
            By Difficulty
          </button>
          <button
            onClick={() => setFilter('unplayed')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              filter === 'unplayed'
                ? "bg-white/20 text-white border border-white/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
            )}
          >
            Unplayed First
          </button>
          <button
            onClick={() => setFilter('struggles')}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              filter === 'struggles'
                ? "bg-white/20 text-white border border-white/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
            )}
          >
            Your Struggles
          </button>
          <div className="w-px h-4 bg-slate-700" />
          <button
            type="button"
            onClick={handleRandomAgent}
            disabled={loading || agents.length === 0}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
              "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white",
              "hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400",
              "shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50",
              loading || agents.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            )}
          >
            🎲 Surprise Me
          </button>
        </motion.div>

        {/* Agent Bubbles Grid - 4 rows x 3 columns */}
        <div className="grid grid-cols-3 gap-5 mb-8 max-w-5xl mx-auto">
          {sortedAgents.map((agent, index) => {
            const variantKey = agent.color as keyof typeof COLOR_VARIANTS
            const variantStyles = COLOR_VARIANTS[variantKey]
            const isHovered = hoveredAgent === agent.id
            const isSelected = selectedAgent === agent.agentId
            
            // Uniform grey background - difficulty shown via dot color
            const cardBg = 'bg-[#1a1a1a] border border-[#2a2a2a]'

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={cn(
                  "flex flex-col items-center relative rounded-xl p-5 select-none focus:outline-none",
                  cardBg,
                  agent.isLocked ? "opacity-40 grayscale cursor-not-allowed" : "cursor-pointer"
                )}
                role="button"
                tabIndex={agent.isLocked ? -1 : 0}
                onClick={() => !agent.isLocked && handleSelectAgent(agent.agentId, agent.name)}
                onKeyDown={(e) => {
                  if (agent.isLocked) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelectAgent(agent.agentId, agent.name)
                  }
                }}
                onMouseEnter={() => setHoveredAgent(agent.id)}
                onMouseLeave={() => setHoveredAgent(null)}
              >
                {/* Animated Bubble */}
                <motion.button
                  whileHover={!agent.isLocked ? { scale: 1.05 } : {}}
                  whileTap={!agent.isLocked ? { scale: 0.95 } : {}}
                  disabled={agent.isLocked}
                  tabIndex={-1}
                  className={cn("relative mb-4 focus:outline-none group", agent.isLocked && "cursor-not-allowed")}
                >
                  <div className="relative h-44 w-44 mx-auto">
                    {/* Concentric circles */}
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className={cn(
                          "absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent",
                          variantStyles.border[i],
                          variantStyles.gradient
                        )}
                        animate={isHovered ? {
                          rotate: 360,
                          scale: 1,
                          opacity: 1,
                        } : {
                          rotate: 360,
                          scale: [1, 1.05, 1],
                          opacity: isSelected ? [1, 1, 1] : [0.7, 0.9, 0.7],
                        }}
                        transition={isHovered ? {
                          rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                          scale: { duration: 0.3 },
                          opacity: { duration: 0.3 },
                        } : {
                          rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                          scale: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 },
                          opacity: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 },
                        }}
                      >
                        <div
                          className={cn(
                            "absolute inset-0 rounded-full mix-blend-screen",
                            `bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace(
                              "from-",
                              ""
                            )}/20%,transparent_70%)]`
                          )}
                        />
                      </motion.div>
                    ))}

                    {/* Profile Image in Center - synchronized with circles */}
                    {agent.image && (
                      <motion.div 
                        className="absolute inset-[2px] flex items-center justify-center pointer-events-none"
                        animate={isHovered ? {
                          scale: 1,
                        } : {
                          scale: [1, 1.05, 1],
                        }}
                        transition={isHovered ? {
                          duration: 0.3,
                        } : {
                          duration: 4,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
                          delay: 0,
                        }}
                      >
                        <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                          {(() => {
                            const imageStyle = getAgentImageStyle(agent.name)
                            const [horizontal, vertical] = (imageStyle.objectPosition?.toString() || '50% 52%').split(' ')
                            
                            // Convert vertical percentage to translateY
                            // For object-position, 50% = center, 100% = bottom edge, 200% = way below
                            // For translateY, we need to calculate based on container size
                            // Since we can't know exact container size, we'll use a percentage transform
                            // 50% (center) = 0, 100% (bottom) = 50% of container down, 200% = 100% down
                            let translateY = '0'
                            const verticalNum = parseFloat(vertical)
                            if (verticalNum !== 50) {
                              // Calculate translateY: if vertical is 200%, move down by ~50% of container
                              // Formula: (verticalNum - 50) / 150 gives us the percentage to translate
                              // For 200%: (200 - 50) / 150 = 100% translate down
                              const translatePercent = ((verticalNum - 50) / 150) * 100
                              translateY = `${translatePercent}%`
                            }
                            
                            // Combine transforms - scale from imageStyle and translateY
                            const scaleValue = imageStyle.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1'
                            const combinedTransform = translateY !== '0' 
                              ? `scale(${scaleValue}) translateY(${translateY})`
                              : imageStyle.transform || `scale(${scaleValue})`
                            
                            const finalStyle = {
                              objectFit: 'cover' as const,
                              objectPosition: `${horizontal} 50%`, // Keep horizontal, center vertical
                              transform: combinedTransform,
                            }
                            
                            if (agent.name === 'Not Interested Nick') {
                              console.log('🖼️ Nick style:', { 
                                agentName: agent.name,
                                horizontal, 
                                vertical,
                                verticalNum,
                                translateY,
                                combinedTransform,
                                finalObjectPosition: finalStyle.objectPosition,
                                finalTransform: finalStyle.transform
                              })
                            }
                            return (
                              <Image
                                src={agent.image}
                                alt={agent.name}
                                fill
                                style={finalStyle}
                                sizes="352px"
                                quality={95}
                                priority={index < 6}
                              />
                            )
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.button>

                {/* Suggested Badge */}
                {suggestedAgent === agent.name && !agent.isLocked && (
                  <div className="absolute top-1 right-1 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 border border-yellow-500/40">
                    <span className="text-[10px] text-yellow-200 font-semibold">⭐ Suggested</span>
                  </div>
                )}
                
                {/* Locked Badge */}
                {agent.isLocked && (
                  <div className="absolute top-1 right-1 bg-slate-800/90 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-700">
                    <span className="text-[10px] text-slate-300">🔒 Locked</span>
                  </div>
                )}
                
                {/* Mastered Badge */}
                {agent.isMastered && !agent.isLocked && suggestedAgent !== agent.name && (
                  <div className="absolute top-1 right-1 bg-yellow-500/20 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-yellow-500/30">
                    <span className="text-[10px] text-yellow-300">🏆</span>
                  </div>
                )}

                {/* Agent Info - Redesigned */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                  className="text-center space-y-2.5 px-2"
                >
                  {/* Name and difficulty */}
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{agent.name}</h3>
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full flex-shrink-0",
                      agent.difficulty === 'Easy' ? 'bg-green-400' :
                      agent.difficulty === 'Moderate' ? 'bg-yellow-400' :
                      agent.difficulty === 'Hard' ? 'bg-orange-400' :
                      agent.difficulty === 'Very Hard' ? 'bg-blue-400' :
                      'bg-red-400'
                    )} />
                  </div>
                  
                  {/* Combined summary */}
                  <p className="text-sm text-white/80 max-w-[240px] mx-auto leading-relaxed font-medium">
                    {agent.description}
                  </p>
                  
                  {/* Stats if available - Larger and more readable */}
                  {agent.sessionCount && agent.sessionCount > 0 ? (
                    <div className="text-base font-bold pt-2">
                      <span className="text-white/90">{agent.sessionCount}x attempted</span>
                      {agent.bestScore && agent.bestScore > 0 ? (
                        <span className="text-emerald-400 ml-2 tabular-nums">• Best: {agent.bestScore}%</span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-base font-semibold text-amber-400/90 pt-2">
                      ✨ Not yet attempted
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6"
        >
          <p className="text-xs text-slate-500">
            Hover over a bubble to see it animate • Click to start your session
          </p>
        </motion.div>
      </div>

      {/* Glow effects */}
      <div className="absolute inset-0 [mask-image:radial-gradient(90%_60%_at_50%_50%,#000_30%,transparent)] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#7C3AED/10%,transparent_70%)] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#EC4899/8%,transparent)] blur-[80px]" />
      </div>
    </div>
  )
}
