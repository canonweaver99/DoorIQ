'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'

// Homeowner agent data with bubble colors
const HOMEOWNER_AGENTS = [
  {
    id: 'austin',
    name: 'Austin',
    agentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz',
    subtitle: 'Skeptical but Fair',
    difficulty: 'Moderate',
    color: 'primary', // emerald/cyan
    description: 'Direct communicator who asks tough questions'
  },
  {
    id: 'derek',
    name: 'Decisive Derek',
    agentId: 'agent_5401k6bysxp8frv80yn1p6ecbvb7',
    subtitle: 'Time-Conscious Executive',
    difficulty: 'Hard',
    color: 'tertiary', // orange/yellow
    description: 'Requires executive-level service and efficiency'
  },
  {
    id: 'sarah',
    name: 'Skeptical Sarah',
    agentId: 'agent_5501k6bys8swf03sqaa13pf1xda5',
    subtitle: 'Trust-Focused',
    difficulty: 'Expert',
    color: 'quinary', // red/rose
    description: 'Needs extensive verification and documentation'
  },
  {
    id: 'bill',
    name: 'Budget-Conscious Bill',
    agentId: 'agent_7001k6bynr1sfsvaqkd1a3r9j7j3',
    subtitle: 'Price-Focused Veteran',
    difficulty: 'Hard',
    color: 'secondary', // violet/fuchsia
    description: 'Fixed income, needs value justification'
  },
  {
    id: 'ashley',
    name: 'Analytical Ashley',
    agentId: 'agent_6301k6byn0x4ff3ryjvg3fee6gpg',
    subtitle: 'Data-Driven Researcher',
    difficulty: 'Very Hard',
    color: 'senary', // blue/sky
    description: 'Evidence-based, catches made-up data instantly'
  }
]

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

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">
      <AnimatedGrid />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-4">
            Choose Your Challenge
          </h1>
          <p className="text-lg text-slate-400">
            Select a homeowner to begin your training session
          </p>
        </motion.div>

        {/* Agent Bubbles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          {HOMEOWNER_AGENTS.map((agent, index) => {
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

                    {/* Center content */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-2 drop-shadow-lg filter brightness-110">
                          {agent.id === 'austin' && '🏡'}
                          {agent.id === 'derek' && '💼'}
                          {agent.id === 'sarah' && '🔍'}
                          {agent.id === 'bill' && '💵'}
                          {agent.id === 'ashley' && '📊'}
                        </div>
                      </div>
                    </div>
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
                    agent.difficulty === 'Moderate' && 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
                    agent.difficulty === 'Hard' && 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
                    agent.difficulty === 'Very Hard' && 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
                    agent.difficulty === 'Expert' && 'bg-red-500/20 text-red-300 border border-red-500/30'
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
