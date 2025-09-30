'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, Info, Shuffle, CheckCircle, AlertTriangle } from 'lucide-react'

// Homeowner agent data with all details
const HOMEOWNER_AGENTS = [
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
    startingScore: 50,
    targetScore: 70,
    traits: [
      'Asks direct questions',
      'Detects pressure tactics',
      'Terminates after 3 pricing deflections',
      'Has ants in kitchen'
    ],
    bestFor: 'Learning to handle direct questions and build trust',
    recommended: true,
    color: 'green'
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
    startingScore: 50,
    targetScore: 70,
    traits: [
      '10-minute HARD time limit',
      'Requires termite expertise (CRITICAL)',
      'Wants executive-level service',
      'Has termite damage and carpenter bees'
    ],
    bestFor: 'Practicing efficiency and executive-level communication',
    recommended: false,
    color: 'yellow'
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
    startingScore: 20,
    targetScore: 120,
    traits: [
      'Real-time credential verification required',
      'Needs references and documentation',
      'HIGHEST trust threshold',
      'Zero tolerance for lies or missing credentials'
    ],
    bestFor: 'Mastering trust-building and credential presentation',
    recommended: false,
    mostChallenging: true,
    color: 'red'
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
    startingScore: 50,
    targetScore: 80,
    traits: [
      '$25-40/month budget maximum',
      'Requires senior/veteran discount',
      'Currently using $8 Home Depot spray',
      'Rejects if over budget'
    ],
    bestFor: 'Learning discount strategies and value communication',
    recommended: false,
    color: 'yellow'
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
    startingScore: 40,
    targetScore: 120,
    traits: [
      'Asks technical EPA regulation questions',
      'Wants 5-7 days to analyze',
      'Catches made-up data instantly',
      'Has German cockroaches (difficult pest)'
    ],
    bestFor: 'Practicing technical knowledge and documentation skills',
    recommended: false,
    color: 'orange'
  }
]

// Color scheme mapping
const colorSchemes = {
  green: {
    border: 'border-green-500',
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    hover: 'hover:border-green-400',
    button: 'bg-green-600 hover:bg-green-700',
  },
  yellow: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    hover: 'hover:border-yellow-400',
    button: 'bg-yellow-600 hover:bg-yellow-700',
  },
  orange: {
    border: 'border-orange-500',
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    hover: 'hover:border-orange-400',
    button: 'bg-orange-600 hover:bg-orange-700',
  },
  red: {
    border: 'border-red-500',
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    hover: 'hover:border-red-400',
    button: 'bg-red-600 hover:bg-red-700',
  }
}

interface HomeownerSelectorProps {
  onSelect?: (agentId: string, agentName: string) => void
  standalone?: boolean
}

export default function HomeownerSelector({ onSelect, standalone = false }: HomeownerSelectorProps) {
  const router = useRouter()
  const [showTooltip, setShowTooltip] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  const handleSelectAgent = (agentId: string, agentName: string) => {
    setSelectedAgent(agentId)
    
    if (onSelect) {
      // Call parent callback if provided
      onSelect(agentId, agentName)
    } else if (standalone) {
      // Navigate to trainer page with agent ID as query param
      router.push(`/trainer?agent=${agentId}`)
    }
  }

  const handleRandomSelection = () => {
    const randomIndex = Math.floor(Math.random() * HOMEOWNER_AGENTS.length)
    const randomAgent = HOMEOWNER_AGENTS[randomIndex]
    handleSelectAgent(randomAgent.agentId, randomAgent.name)
  }

  const renderStars = (level: number) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < level ? 'fill-current' : 'opacity-30'}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">
            Choose Your Homeowner
          </h1>
          <p className="text-lg text-slate-400 mb-4">
            Select which personality you want to practice with
          </p>
          
          {/* Challenge Level Info */}
          <div className="inline-flex items-center gap-2 bg-slate-800 rounded-full px-4 py-2 border border-slate-700">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <Info size={16} />
              <span>Challenge Level Guide</span>
            </button>
          </div>
          
          {showTooltip && (
            <div className="mt-3 inline-block bg-slate-800 border border-slate-700 rounded-lg p-4 text-left">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex text-green-400">{renderStars(2)}</div>
                  <span className="text-slate-300">Moderate - Good for beginners</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">{renderStars(3)}</div>
                  <span className="text-slate-300">Hard - Requires skill</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex text-orange-400">{renderStars(4)}</div>
                  <span className="text-slate-300">Very Hard - Advanced tactics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex text-red-400">{renderStars(5)}</div>
                  <span className="text-slate-300">Expert - Master level</span>
                </div>
              </div>
            </div>
          )}

          {/* Random Button */}
          <button
            onClick={handleRandomSelection}
            className="mt-4 inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            <Shuffle size={18} />
            Random Selection
          </button>
        </div>

        {/* Homeowner Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {HOMEOWNER_AGENTS.map((agent) => {
            const colors = colorSchemes[agent.color as keyof typeof colorSchemes]
            const isSelected = selectedAgent === agent.agentId

            return (
              <div
                key={agent.id}
                className={`relative bg-slate-800 rounded-xl border-2 ${colors.border} ${colors.hover} ${colors.bg} transition-all duration-200 overflow-hidden ${
                  isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-900 ' + colors.border : ''
                }`}
              >
                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                  {agent.recommended && (
                    <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle size={12} />
                      Recommended
                    </span>
                  )}
                  {agent.mostChallenging && (
                    <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Most Challenging
                    </span>
                  )}
                </div>

                <div className="p-6">
                  {/* Header */}
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold text-white mb-1">{agent.name}</h2>
                    <p className="text-slate-400 text-sm">
                      {agent.age} • {agent.occupation}
                    </p>
                    <p className="text-slate-500 text-xs italic mt-1">{agent.location}</p>
                  </div>

                  {/* Challenge Level */}
                  <div className="mb-4 pb-4 border-b border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">Challenge Level:</span>
                      <span className={`text-sm font-semibold ${colors.text}`}>
                        {agent.challengeLabel}
                      </span>
                    </div>
                    <div className={colors.text}>
                      {renderStars(agent.challengeLevel)}
                    </div>
                  </div>

                  {/* Personality */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Personality:</h3>
                    <p className="text-sm text-slate-400">{agent.personality}</p>
                  </div>

                  {/* Score Info */}
                  <div className="mb-4 bg-slate-900/50 rounded-lg p-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Starting Score:</span>
                      <span className="text-white font-semibold">{agent.startingScore}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-slate-400">Needed to Close:</span>
                      <span className={`font-semibold ${colors.text}`}>{agent.targetScore}+</span>
                    </div>
                  </div>

                  {/* Key Traits */}
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Key Traits:</h3>
                    <ul className="space-y-1.5">
                      {agent.traits.map((trait, idx) => (
                        <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                          <span className={`mt-1 ${colors.text}`}>•</span>
                          <span>{trait}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Best For */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-300 mb-1">Best For:</h3>
                    <p className="text-xs text-slate-400 italic">{agent.bestFor}</p>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleSelectAgent(agent.agentId, agent.name)}
                    className={`w-full ${colors.button} text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                      isSelected ? 'ring-2 ring-white' : ''
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle size={18} />
                        Selected
                      </>
                    ) : (
                      'Start Conversation'
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Help Text */}
        <div className="mt-12 text-center text-sm text-slate-500">
          <p>💡 Tip: Start with Austin if you're new to sales training</p>
          <p className="mt-1">Each homeowner has unique challenges to help you improve different skills</p>
        </div>
      </div>
    </div>
  )
}
