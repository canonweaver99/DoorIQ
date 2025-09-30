'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
]
type DifficultyKey = 'Moderate' | 'Hard' | 'Very Hard' | 'Expert'
const DIFFICULTY_BADGES: Record<DifficultyKey, string> = {
  Moderate: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
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

  return {
    id: agent.id,
    name: agent.name,
    agentId: agent.eleven_agent_id,
    subtitle,
    difficulty,
    color,
    description,
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

  useEffect(() => {
    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      if (!error && data) {
        const filtered = data.filter((agent) => Boolean(agent.eleven_agent_id) && ALLOWED_AGENT_SET.has(agent.name as AllowedAgentName))
        const sorted = filtered.sort((a, b) => ALLOWED_AGENT_ORDER.indexOf(a.name as AllowedAgentName) - ALLOWED_AGENT_ORDER.indexOf(b.name as AllowedAgentName))

        const hydrated = sorted
          .map((agent, index) => mapAgentToDisplay(agent as AgentRow, index))
        setAgents(hydrated)
      }
      setLoading(false)
    }
    fetchAgents()
  }, [])

  const handleRandomAgent = () => {
    if (agents.length === 0) return
    const randomAgent = agents[Math.floor(Math.random() * agents.length)]
    handleSelectAgent(randomAgent.agentId, randomAgent.name)
  }

  const handleSelectAgent = (agentId: string, agentName: string) => {
    setSelectedAgent(agentId)
    
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

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 flex flex-col items-center gap-6"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-4">
            Choose Your Challenge
          </h1>
          <p className="text-lg text-slate-400">
            Select a homeowner to begin your training session
          </p>
          <button
            type="button"
            onClick={handleRandomAgent}
            disabled={loading || agents.length === 0}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all",
              "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white",
              "hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400",
              "shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50",
              loading || agents.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            )}
          >
            🎲 Surprise Me
          </button>
        </motion.div>

        {/* Agent Bubbles Grid */}
        <div className="flex flex-wrap justify-center gap-8 mb-12">
          {agents.map((agent, index) => {
            const variantKey = agent.color as keyof typeof COLOR_VARIANTS
            const variantStyles = COLOR_VARIANTS[variantKey]
            const isHovered = hoveredAgent === agent.id
            const isSelected = selectedAgent === agent.agentId

            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                {/* Animated Bubble */}
                <motion.button
                  onClick={() => handleSelectAgent(agent.agentId, agent.name)}
                  onMouseEnter={() => setHoveredAgent(agent.id)}
                  onMouseLeave={() => setHoveredAgent(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative mb-6 focus:outline-none group"
                >
                  <div className="relative h-48 w-48 mx-auto">
                    {/* Concentric circles */}
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className={cn(
                          "absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent",
                          variantStyles.border[i],
                          variantStyles.gradient
                        )}
                        animate={{
                          rotate: 360,
                          scale: isHovered ? [1, 1.1 + i * 0.05, 1] : [1, 1.05 + i * 0.05, 1],
                          opacity: isSelected ? [1, 1, 1] : [0.7, 1, 0.7],
                        }}
                        transition={{
                          duration: isHovered ? 3 : 5,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "easeInOut",
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

                  </div>
                </motion.button>

                {/* Agent Info */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="text-center"
                >
                  <h3 className="text-2xl font-bold text-white mb-1">{agent.name}</h3>
                  <p className="text-sm text-slate-400 mb-2">{agent.subtitle}</p>
                  <div className={cn(
                    "inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3",
                    DIFFICULTY_BADGES[agent.difficulty] ?? DIFFICULTY_BADGES.Moderate
                  )}>
                    {agent.difficulty}
                  </div>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">{agent.description}</p>
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
          className="text-center mt-12"
        >
          <p className="text-sm text-slate-500">
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
