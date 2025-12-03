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
type DifficultyKey = 'Easy' | 'Moderate' | 'Hard' | 'Expert'
const DIFFICULTY_BADGES: Record<DifficultyKey, string> = {
  Easy: 'bg-green-500/20 text-green-300 border border-green-500/30',
  Moderate: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  Hard: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  Expert: 'bg-red-500/20 text-red-300 border border-red-500/30',
}
const sanitizeDescription = (persona?: string | null): string => {
  if (!persona) return 'Dynamic AI homeowner with unique objections and goals'
  return persona.split(/\r?\n|\.|•|-/).map((part) => part.trim()).filter(Boolean)[0] ?? persona
}

const parseDifficulty = (agentName: string, persona?: string | null): DifficultyKey => {
  // Not Interested Nick is always Expert
  if (agentName === 'Not Interested Nick') return 'Expert'
  
  const personaMeta = PERSONA_METADATA[agentName as AllowedAgentName]
  const fallback = personaMeta?.bubble.difficulty
  
  const match = persona?.match(/(easy|moderate|very hard|hard|expert)/i)?.[1]?.toLowerCase()
  if (match === 'easy') return 'Easy'
  if (match === 'moderate') return 'Moderate'
  if (match === 'very hard' || match === 'veryhard') return 'Expert'
  if (match === 'hard') return 'Hard'
  if (match === 'expert') return 'Expert'
  return (fallback as DifficultyKey) ?? 'Moderate'
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
    animate={{
      opacity: [0.02, 0.04, 0.02],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    className="absolute inset-0 pointer-events-none"
  >
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }}
    />
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
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        
        // Fetch agents
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true })
        
        if (error) {
          console.error('Error fetching agents:', error)
          setLoading(false)
          return
        }
        
        // Stripe/billing removed - no subscription checks needed
        
        // Fetch user's sessions for stats
        let sessions: any[] = []
        if (user) {
          const { data: sessionData, error: sessionError } = await supabase
            .from('live_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { descending: true })
          if (sessionError) {
            console.error('Error fetching sessions:', sessionError)
          } else if (sessionData) {
            sessions = sessionData
          }
        }
        
        if (data) {
          // Normalize agent names for backward compatibility (Austin -> Average Austin)
          const normalizeAgentName = (name: string): AllowedAgentName | null => {
            if (name === 'Austin') return 'Average Austin'
            return ALLOWED_AGENT_SET.has(name as AllowedAgentName) ? (name as AllowedAgentName) : null
          }
          
          const filtered = data.filter((agent: AgentRow) => {
            if (!Boolean(agent.eleven_agent_id)) return false
            const normalizedName = normalizeAgentName(agent.name)
            return normalizedName !== null
          }).map((agent: AgentRow) => {
            // Normalize the name in the agent object for consistent handling
            const normalizedName = normalizeAgentName(agent.name)
            return normalizedName ? { ...agent, name: normalizedName } : agent
          })
          
          const sorted = filtered.sort((a: AgentRow, b: AgentRow) => ALLOWED_AGENT_ORDER.indexOf(a.name as AllowedAgentName) - ALLOWED_AGENT_ORDER.indexOf(b.name as AllowedAgentName))

          const hydrated = sorted.map((agent: AgentRow, index: number) => {
            // Filter sessions by agent name, handling both "Austin" and "Average Austin" for backward compatibility
            const agentSessions = sessions.filter((s: any) => {
              const sessionAgentName = s.agent_name
              const currentAgentName = agent.name
              // Match if names are equal, or if one is "Austin" and the other is "Average Austin"
              return sessionAgentName === currentAgentName || 
                     (sessionAgentName === 'Austin' && currentAgentName === 'Average Austin') ||
                     (sessionAgentName === 'Average Austin' && currentAgentName === 'Austin')
            })
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
            
            // Temporarily disable Tanya & Tom
            const isComingSoon = agent.name === 'Tag Team Tanya & Tom'
            
            return {
              ...mapAgentToDisplay(agent as AgentRow, index),
              sessionCount: agentSessions.length,
              bestScore,
              avgDuration,
              isLocked: isLocked || isComingSoon, // Treat coming soon as locked
              isMastered
            }
          })
          setAgents(hydrated)
          setSortedAgents(hydrated)
          
          // Determine suggested agent based on user analytics
          const unplayedAgents = hydrated.filter((a: HomeownerAgentDisplay) => !a.sessionCount || a.sessionCount === 0)
          const lowScoreAgents = hydrated.filter((a: HomeownerAgentDisplay) => a.bestScore && a.bestScore < 70).sort((a: HomeownerAgentDisplay, b: HomeownerAgentDisplay) => (a.bestScore || 0) - (b.bestScore || 0))
          const availableAgents = hydrated.filter((a: HomeownerAgentDisplay) => !a.isLocked && a.name !== 'Tag Team Tanya & Tom')
          
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
      } catch (err) {
        console.error('Error in fetchAgents:', err)
        setLoading(false)
      }
    }
    fetchAgents()
  }, [])
  
  // Apply filtering
  useEffect(() => {
    let filtered = [...agents]
    
    switch (filter) {
      case 'difficulty':
        const difficultyOrder = ['Easy', 'Moderate', 'Hard', 'Expert']
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
    // Filter out Tanya & Tom from random selection
    const availableAgents = agents.filter(a => a.name !== 'Tag Team Tanya & Tom' && !a.isLocked)
    if (availableAgents.length === 0) return
    const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)]
    handleSelectAgent(randomAgent.agentId, randomAgent.name)
  }

  const handleSelectAgent = async (agentId: string, agentName: string) => {
    // Temporarily disable Tanya & Tom
    if (agentName === 'Tag Team Tanya & Tom') {
      return // Prevent selection
    }
    
    // Check if user is logged in first
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Redirect to sign in page, preserving the intended agent selection
      router.push(`/auth/login?next=/trainer?agent=${agentId}&name=${encodeURIComponent(agentName)}`)
      return
    }

    // Check if user has active trial or subscription
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status, trial_ends_at')
      .eq('id', user.id)
      .single()

    const status = userData?.subscription_status || null
    const trialEndsAt = userData?.trial_ends_at || null
    const now = Date.now()
    const trialEndMs = trialEndsAt ? new Date(trialEndsAt).getTime() : null
    const isTrialing = status === 'trialing' && trialEndMs !== null && trialEndMs > now
    const hasActiveSubscription = status === 'active' || isTrialing

    if (!hasActiveSubscription) {
      // Redirect to pricing page to start free trial
      router.push(`/pricing?redirect=/trainer?agent=${agentId}&name=${encodeURIComponent(agentName)}`)
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
        <div className="relative z-10 text-slate-300 font-space text-lg sm:text-xl font-bold">Loading homeowners…</div>
      </div>
    )
  }

  if (!loading && agents.length === 0) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center">
        <AnimatedGrid />
        <div className="relative z-10 text-center text-white/80 space-y-3">
          <p className="text-lg md:text-xl font-bold text-slate-300 drop-shadow-md font-space">No homeowner agents found</p>
          <p className="text-base sm:text-lg text-slate-400 max-w-sm font-space">
            Add active homeowner personas in Supabase with an ElevenLabs agent ID to see them here.
          </p>
        </div>
      </div>
    )
  }

  // Map difficulty to border color, minimal style matching landing page
  const getCardStyle = (difficulty: DifficultyKey): { border: string; bg: string } => {
    return { border: 'border-white/5', bg: 'bg-white/[0.02]' }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">
      <AnimatedGrid />
      
      {/* Animated gradient orbs matching landing page */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, -25, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/15 via-purple-500/10 to-transparent rounded-full blur-[100px] pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 pt-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 flex flex-col items-center gap-2 md:gap-3"
        >
          <h1 className="font-space text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white text-center font-bold leading-[1.3] uppercase">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Challenge</span>
          </h1>
          <p className="text-lg md:text-xl font-bold text-slate-300 drop-shadow-md font-space max-w-3xl">
            Select a homeowner to begin your training session
          </p>
        </motion.div>

        {/* Difficulty Key/Legend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="group relative mb-6 flex flex-wrap items-center justify-center gap-3 px-4 py-2 bg-white/[0.02] border-2 border-white/5 rounded-lg transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025] overflow-hidden max-w-xl mx-auto"
        >
          {/* Subtle purple glow at bottom for depth */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-4">
            <span className="text-xs sm:text-sm font-medium text-white/70 uppercase tracking-wider font-space">Difficulty:</span>
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-white/80 font-space font-bold">Easy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-white/80 font-space font-bold">Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-white/80 font-space font-bold">Hard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-white/80 font-space font-bold">Expert</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6 flex flex-wrap items-center justify-center gap-3"
        >
          <button
            onClick={() => setFilter('all')}
            className={cn(
              "px-5 py-2.5 rounded-md text-sm sm:text-base font-medium transition-all font-space",
              filter === 'all'
                ? "bg-white/10 text-white border border-white/20"
                : "bg-white/[0.02] text-white/80 border border-white/5 hover:bg-white/[0.05] hover:border-white/10 hover:text-white"
            )}
          >
            All
          </button>
          <button
            onClick={() => setFilter('difficulty')}
            className={cn(
              "px-5 py-2.5 rounded-md text-sm sm:text-base font-medium transition-all font-space hidden sm:inline-flex",
              filter === 'difficulty'
                ? "bg-white/10 text-white border border-white/20"
                : "bg-white/[0.02] text-white/80 border border-white/5 hover:bg-white/[0.05] hover:border-white/10 hover:text-white"
            )}
          >
            By Difficulty
          </button>
          <button
            onClick={() => setFilter('unplayed')}
            className={cn(
              "px-5 py-2.5 rounded-md text-sm sm:text-base font-medium transition-all font-space hidden sm:inline-flex",
              filter === 'unplayed'
                ? "bg-white/10 text-white border border-white/20"
                : "bg-white/[0.02] text-white/80 border border-white/5 hover:bg-white/[0.05] hover:border-white/10 hover:text-white"
            )}
          >
            Unplayed First
          </button>
          <button
            onClick={() => setFilter('struggles')}
            className={cn(
              "px-5 py-2.5 rounded-md text-sm sm:text-base font-medium transition-all font-space hidden sm:inline-flex",
              filter === 'struggles'
                ? "bg-white/10 text-white border border-white/20"
                : "bg-white/[0.02] text-white/80 border border-white/5 hover:bg-white/[0.05] hover:border-white/10 hover:text-white"
            )}
          >
            Your Struggles
          </button>
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <motion.button
            type="button"
            onClick={handleRandomAgent}
            disabled={loading || agents.length === 0}
            whileHover={loading || agents.length === 0 ? {} : { scale: 1.02 }}
            whileTap={loading || agents.length === 0 ? {} : { scale: 0.98 }}
            className={cn(
              "px-6 py-2.5 bg-white text-black font-bold rounded-md text-sm sm:text-base tracking-tight transition-all font-space",
              loading || agents.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/95'
            )}
          >
            <span className="flex items-center gap-2">
              🎲 Surprise Me
            </span>
          </motion.button>
        </motion.div>

        {/* Agent Bubbles Grid - Horizontal scroll on mobile, grid on desktop */}
        <div className="md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-6 mb-12 max-w-7xl mx-auto">
          {/* Mobile: Horizontal scrolling container */}
          <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            <div className="flex gap-5 w-max">
              {sortedAgents.map((agent, index) => {
                const variantKey = agent.color as keyof typeof COLOR_VARIANTS
                const variantStyles = COLOR_VARIANTS[variantKey]
                const isHovered = hoveredAgent === agent.id
                const isSelected = selectedAgent === agent.agentId
                const cardStyle = getCardStyle(agent.difficulty)

                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={cn(
 "flex-shrink-0 w-[300px] snap-center",
                      agent.isLocked || agent.name === 'Tag Team Tanya & Tom' ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                    )}
                    role="button"
                    tabIndex={agent.isLocked ? -1 : 0}
                    onClick={() => !agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' && handleSelectAgent(agent.agentId, agent.name)}
                    onKeyDown={(e) => {
                      if (agent.isLocked || agent.name === 'Tag Team Tanya & Tom') return
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSelectAgent(agent.agentId, agent.name)
                      }
                    }}
                    onMouseEnter={() => setHoveredAgent(agent.id)}
                    onMouseLeave={() => setHoveredAgent(null)}
                  >
                    <div
                      className={cn(
                        "h-full flex flex-col items-center p-6 relative rounded-lg border",
                        cardStyle.border,
                        cardStyle.bg,
                        "hover:border-white/20 hover:bg-white/[0.03] transition-all duration-300",
                        agent.isLocked && "opacity-50"
                      )}
                    >
                    {/* Mobile Agent Card Content - reuse the same structure */}
                    <motion.button
                whileHover={!agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' ? { scale: 1.05 } : {}}
                whileTap={!agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' ? { scale: 0.95 } : {}}
                      disabled={agent.isLocked || agent.name === 'Tag Team Tanya & Tom'}
                      tabIndex={-1}
                      className={cn("relative mb-3 focus:outline-none group", (agent.isLocked || agent.name === 'Tag Team Tanya & Tom') && "cursor-not-allowed")}
                    >
                      <div className="relative h-40 w-40 mx-auto">
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

                        {/* Profile Image */}
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
                                let translateY = '0'
                                const verticalNum = parseFloat(vertical)
                                if (verticalNum !== 50) {
                                  const translatePercent = ((verticalNum - 50) / 150) * 100
                                  translateY = `${translatePercent}%`
                                }
                                const scaleValue = imageStyle.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1'
                                
                                return (
                                  <Image
                                    src={agent.image}
                                    alt={agent.name}
                                    fill
                                    className="object-cover"
                                    style={{
                                      objectPosition: `${horizontal} ${vertical}`,
                                      transform: `scale(${scaleValue}) translateY(${translateY})`,
                                    }}
                                    sizes="160px"
                                  />
                                )
                              })()}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.button>

                    {/* Suggested Badge - Mobile */}
                    {suggestedAgent === agent.name && !agent.isLocked && (
                      <div className="absolute top-2 right-2 z-20 bg-white/[0.05] backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
                        <span className="text-xs text-white/90 font-medium font-space">⭐ Suggested</span>
                      </div>
                    )}
                    
                    {/* Coming Soon Badge - Mobile */}
                    {agent.name === 'Tag Team Tanya & Tom' && (
                      <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
                        <div className="bg-white/[0.05] backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                          <span className="text-sm text-white/80 font-medium font-space">🚧 Coming Soon</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Locked Badge - Mobile */}
                    {agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' && (
                      <div className="absolute top-2 right-2 z-20 bg-white/[0.05] backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
                        <span className="text-xs text-white/70 font-space">🔒 Locked</span>
                      </div>
                    )}
                    
                    {/* Mastered Badge - Mobile */}
                    {agent.isMastered && !agent.isLocked && suggestedAgent !== agent.name && (
                      <div className="absolute top-2 right-2 z-20 bg-white/[0.05] backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-white/10">
                        <span className="text-xs text-white/80 font-space">🏆</span>
                      </div>
                    )}

                    {/* Agent Info */}
                    <div className="text-center w-full mt-auto">
                      <h3 className="text-lg font-medium text-white mb-2 font-space tracking-tight">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-slate-300 mb-3 font-space font-bold">
                        {agent.subtitle}
                      </p>
                      {/* Difficulty Dot */}
                      <div className="flex items-center justify-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          agent.difficulty === 'Easy' && "bg-green-400",
                          agent.difficulty === 'Moderate' && "bg-yellow-400",
                          agent.difficulty === 'Hard' && "bg-orange-400",
                          agent.difficulty === 'Expert' && "bg-red-400",
                          !agent.difficulty && "bg-white/40"
                        )} />
                        <span className="text-base text-white/70 font-space font-bold">
                          {agent.difficulty || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden md:contents">
          {sortedAgents.map((agent, index) => {
            const variantKey = agent.color as keyof typeof COLOR_VARIANTS
            const variantStyles = COLOR_VARIANTS[variantKey]
            const isHovered = hoveredAgent === agent.id
            const isSelected = selectedAgent === agent.agentId
            const cardStyle = getCardStyle(agent.difficulty)

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={cn(
                  "select-none focus:outline-none",
                  agent.isLocked || agent.name === 'Tag Team Tanya & Tom' ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                )}
                role="button"
                tabIndex={agent.isLocked ? -1 : 0}
                onClick={() => !agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' && handleSelectAgent(agent.agentId, agent.name)}
                onKeyDown={(e) => {
                  if (agent.isLocked || agent.name === 'Tag Team Tanya & Tom') return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelectAgent(agent.agentId, agent.name)
                  }
                }}
                onMouseEnter={() => setHoveredAgent(agent.id)}
                onMouseLeave={() => setHoveredAgent(null)}
              >
                <div
                  className={cn(
                    "h-full flex flex-col items-center p-6 relative rounded-lg border",
                    cardStyle.border,
                    cardStyle.bg,
                    "hover:border-white/20 hover:bg-white/[0.03] transition-all duration-300",
                    agent.isLocked && "opacity-50"
                  )}
                >
                {/* Animated Bubble */}
                <motion.button
                  whileHover={!agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' ? { scale: 1.05 } : {}}
                  whileTap={!agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' ? { scale: 0.95 } : {}}
                  disabled={agent.isLocked}
                  tabIndex={-1}
                  className={cn("relative mb-3 focus:outline-none group", agent.isLocked && "cursor-not-allowed")}
                >
                  <div className="relative h-40 w-40 mx-auto">
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
                            // URL encode image path if it contains spaces to ensure proper loading
                            const imageSrc = agent.image.includes(' ') || agent.image.includes('&')
                              ? agent.image.split('/').map((part, i) => i === 0 ? part : encodeURIComponent(part)).join('/')
                              : agent.image
                            
                            return (
                              <Image
                                src={imageSrc}
                                alt={agent.name}
                                fill
                                style={finalStyle}
                                sizes="320px"
                                quality={95}
                                priority={index < 6}
                                unoptimized={agent.image.includes(' ') || agent.image.includes('&')}
                                onError={(e) => {
                                  console.error('❌ Agent bubble image failed to load:', agent.image, 'Encoded:', imageSrc)
                                  e.stopPropagation()
                                }}
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
                  <div className="absolute top-2 right-2 z-20 bg-white/[0.05] backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
                    <span className="text-xs text-white/90 font-medium font-space">⭐ Suggested</span>
                  </div>
                )}
                
                {/* Coming Soon Badge */}
                {agent.name === 'Tag Team Tanya & Tom' && (
                  <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/10">
                    <div className="bg-white/[0.05] backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                      <span className="text-sm text-white/80 font-medium font-space">🚧 Coming Soon</span>
                    </div>
                  </div>
                )}
                
                {/* Locked Badge */}
                {agent.isLocked && agent.name !== 'Tag Team Tanya & Tom' && (
                  <div className="absolute top-2 right-2 z-20 bg-white/[0.05] backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
                    <span className="text-xs text-white/70 font-space">🔒 Locked</span>
                  </div>
                )}
                
                {/* Mastered Badge */}
                {agent.isMastered && !agent.isLocked && suggestedAgent !== agent.name && (
                  <div className="absolute top-2 right-2 z-20 bg-white/[0.05] backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-white/10">
                    <span className="text-xs text-white/80 font-space">🏆</span>
                  </div>
                )}

                {/* Agent Info - Redesigned */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 + 0.2 }}
                  className="text-center space-y-3 px-2 mt-auto w-full"
                >
                  {/* Name and difficulty */}
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-space">{agent.name}</h3>
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      agent.difficulty === 'Easy' ? 'bg-green-400' :
                      agent.difficulty === 'Moderate' ? 'bg-yellow-400' :
                      agent.difficulty === 'Hard' ? 'bg-orange-400' :
                      'bg-red-400'
                    )} />
                  </div>
                  
                  {/* Combined summary */}
                  <p className="text-sm sm:text-base text-slate-300 max-w-[240px] mx-auto leading-relaxed font-space font-bold">
                    {agent.description}
                  </p>
                  
                  {/* Stats if available */}
                  {agent.sessionCount && agent.sessionCount > 0 ? (
                    <div className="text-sm sm:text-base font-medium pt-2 font-space">
                      <span className="text-white/90">{agent.sessionCount}x attempted</span>
                      {agent.bestScore && agent.bestScore > 0 ? (
                        <span className="text-white/70 ml-2 tabular-nums">• Best: {agent.bestScore}%</span>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-sm sm:text-base font-bold text-slate-400 pt-2 font-space">
                      ✨ Not yet attempted
                    </div>
                  )}
                </motion.div>
                </div>
              </motion.div>
            )
          })}
          </div>
        </div>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <p className="text-sm sm:text-base text-slate-400 font-space font-bold">
            Hover over a card to see it glow • Click to start your session
          </p>
        </motion.div>
      </div>
    </div>
  )
}
