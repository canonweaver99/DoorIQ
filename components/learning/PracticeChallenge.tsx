'use client'

import { useRouter } from 'next/navigation'
import { PlayCircle, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { getAgentImageStyle } from '@/lib/agents/imageStyles'

interface ChallengeScenario {
  scenario: string
  successCriteria: string[]
  agentId: string // eleven_agent_id
  agentName: string
}

// Map module slugs to challenge scenarios
const challengeScenarios: Record<string, ChallengeScenario> = {
  // Approach modules
  'positioning': {
    scenario: 'Not Interested Nick answers the door with arms crossed and low energy. Use proper positioning and mirroring to get him to engage.',
    successCriteria: [
      'Don\'t mention your product in the first 30 seconds',
      'Match his energy before trying to elevate it',
      'Get him to ask a question or step outside'
    ],
    agentId: 'agent_7601k6dtrf5fe0k9dh8kwmkde0ga', // Not Interested Nick
    agentName: 'Not Interested Nick'
  },
  'pattern-interrupt': {
    scenario: 'Busy Beth opens the door already saying "I\'m not interested" and starts closing it. Use a pattern interrupt to stop her and create curiosity.',
    successCriteria: [
      'Stop the door from closing',
      'Get her to pause and listen',
      'Create a moment of curiosity without mentioning your product'
    ],
    agentId: 'agent_4801k6dvap8tfnjtgd4f99hhsf10', // Busy Beth
    agentName: 'Busy Beth'
  },
  'reading-signs': {
    scenario: 'Average Austin answers the door but seems distracted and keeps looking back inside. Read his body language and adjust your approach.',
    successCriteria: [
      'Identify at least 2 non-verbal cues',
      'Adjust your energy to match his state',
      'Get him to focus on the conversation'
    ],
    agentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz', // Average Austin
    agentName: 'Average Austin'
  },
  'icebreaker': {
    scenario: 'Renter Randy answers the door cautiously. Use an icebreaker to build rapport and make him feel comfortable.',
    successCriteria: [
      'Get him to smile or relax visibly',
      'Build rapport within the first minute',
      'Get him to share something personal'
    ],
    agentId: 'agent_5701k6dtt9p4f8jbk8rs1akqwtmx', // Renter Randy
    agentName: 'Renter Randy'
  },
  'what-not-to-do': {
    scenario: 'Think About It Tina is polite but non-committal. Avoid common mistakes and keep her engaged.',
    successCriteria: [
      'Don\'t rush to your pitch',
      'Avoid sounding scripted',
      'Keep the conversation natural and flowing'
    ],
    agentId: 'agent_2501k6btmv4cf2wt8hxxmq4hvzxv', // Think About It Tina
    agentName: 'Think About It Tina'
  },
  'transition': {
    scenario: 'No Problem Nancy is friendly and engaged. Smoothly transition from rapport-building to your value proposition.',
    successCriteria: [
      'Create a natural bridge from small talk to business',
      'Get permission to continue',
      'Maintain engagement through the transition'
    ],
    agentId: 'agent_0101k6dvb96zejkv35ncf1zkj88m', // No Problem Nancy
    agentName: 'No Problem Nancy'
  },
  // Pitch modules
  'value-before-price': {
    scenario: 'Too Expensive Tim immediately asks "How much?" before you\'ve built value. Practice building value before discussing price.',
    successCriteria: [
      'Delay price discussion until value is established',
      'Build at least 3 value points before mentioning cost',
      'Get him to see the value before the price'
    ],
    agentId: 'agent_3901k6dtsjyqfvxbxd1pwzzdham0', // Too Expensive Tim
    agentName: 'Too Expensive Tim'
  },
  'features-vs-benefits': {
    scenario: 'Average Austin asks technical questions. Translate your features into benefits that matter to him.',
    successCriteria: [
      'Use "which means" to connect features to benefits',
      'Focus on outcomes, not specifications',
      'Get him to see the practical value'
    ],
    agentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz', // Average Austin
    agentName: 'Average Austin'
  },
  'painting-the-picture': {
    scenario: 'Skeptical Sam doesn\'t see the problem. Paint a vivid picture of what happens if he doesn\'t act.',
    successCriteria: [
      'Create a visual, visceral understanding of the problem',
      'Use specific, concrete examples',
      'Get him to see the future consequences'
    ],
    agentId: 'agent_7601k6dtrf5fe0k9dh8kwmkde0ga', // Not Interested Nick (skeptical)
    agentName: 'Skeptical Sam'
  },
  'keep-ammo': {
    scenario: 'Too Expensive Tim objects to price. Keep value-building ammo in your pocket and continue building value.',
    successCriteria: [
      'Don\'t use all your value points at once',
      'Have additional benefits ready for objections',
      'Continue building value after the first objection'
    ],
    agentId: 'agent_3901k6dtsjyqfvxbxd1pwzzdham0', // Too Expensive Tim
    agentName: 'Too Expensive Tim'
  },
  'reading-adjusting': {
    scenario: 'Busy Beth shows interest but seems rushed. Read her signals and adjust your pace accordingly.',
    successCriteria: [
      'Identify her engagement level',
      'Adjust your pace to match her energy',
      'Know when to speed up or slow down'
    ],
    agentId: 'agent_4801k6dvap8tfnjtgd4f99hhsf10', // Busy Beth
    agentName: 'Busy Beth'
  },
  // Communication modules
  'mirroring': {
    scenario: 'Not Interested Nick has closed body language and low energy. Mirror his posture and energy before elevating.',
    successCriteria: [
      'Match his body language initially',
      'Mirror his energy level',
      'Gradually elevate after establishing rapport'
    ],
    agentId: 'agent_7601k6dtrf5fe0k9dh8kwmkde0ga', // Not Interested Nick
    agentName: 'Not Interested Nick'
  },
  'eye-contact': {
    scenario: 'Average Austin avoids eye contact. Use proper eye contact to build trust and engagement.',
    successCriteria: [
      'Maintain appropriate eye contact (60-70%)',
      'Use eye contact to show you\'re listening',
      'Get him to make eye contact with you'
    ],
    agentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz', // Average Austin
    agentName: 'Average Austin'
  },
  'paraverbals': {
    scenario: 'Busy Beth seems distracted. Use your voice tone, pace, and volume to capture and maintain her attention.',
    successCriteria: [
      'Vary your tone to emphasize key points',
      'Match your pace to her energy',
      'Use pauses effectively'
    ],
    agentId: 'agent_4801k6dvap8tfnjtgd4f99hhsf10', // Busy Beth
    agentName: 'Busy Beth'
  },
  'body-language': {
    scenario: 'Renter Randy seems nervous. Use open, confident body language to make him feel comfortable.',
    successCriteria: [
      'Use open posture (no crossed arms)',
      'Maintain appropriate distance',
      'Use gestures to emphasize points'
    ],
    agentId: 'agent_5701k6dtt9p4f8jbk8rs1akqwtmx', // Renter Randy
    agentName: 'Renter Randy'
  },
  'reading-body-language': {
    scenario: 'Think About It Tina shows mixed signals. Read her body language to understand her true feelings.',
    successCriteria: [
      'Identify at least 3 body language cues',
      'Interpret what they mean',
      'Adjust your approach based on what you see'
    ],
    agentId: 'agent_2501k6btmv4cf2wt8hxxmq4hvzxv', // Think About It Tina
    agentName: 'Think About It Tina'
  },
  'energy-management': {
    scenario: 'No Problem Nancy starts with high energy but drops off. Manage your energy to keep her engaged throughout.',
    successCriteria: [
      'Match her initial energy',
      'Maintain energy when hers drops',
      'Elevate energy at key moments'
    ],
    agentId: 'agent_0101k6dvb96zejkv35ncf1zkj88m', // No Problem Nancy
    agentName: 'No Problem Nancy'
  },
  // Closing modules
  'soft-vs-hard': {
    scenario: 'Spouse Check Susan needs to check with her spouse. Use soft closes to build commitment before asking for the sale.',
    successCriteria: [
      'Use at least 2 soft closes',
      'Build commitment before asking for the sale',
      'Get small agreements before the big one'
    ],
    agentId: 'agent_4601k6dvddj8fp89cey35hdj9ef8', // Spouse Check Susan
    agentName: 'Spouse Check Susan'
  },
  'soft-close-types': {
    scenario: 'No Problem Nancy is engaged but hasn\'t committed. Use different types of soft closes to test her interest.',
    successCriteria: [
      'Use at least 3 different soft close types',
      'Get small commitments',
      'Build toward the final close'
    ],
    agentId: 'agent_0101k6dvb96zejkv35ncf1zkj88m', // No Problem Nancy
    agentName: 'No Problem Nancy'
  },
  'three-close-rule': {
    scenario: 'Think About It Tina says "I need to think about it." Apply the 3-close rule to overcome her hesitation.',
    successCriteria: [
      'Attempt at least 3 closes',
      'Use different close types',
      'Handle objections between closes'
    ],
    agentId: 'agent_2501k6btmv4cf2wt8hxxmq4hvzxv', // Think About It Tina
    agentName: 'Think About It Tina'
  },
  'assumptive-language': {
    scenario: 'Spouse Check Susan seems ready but needs to check with her spouse. Use assumptive language to move toward commitment.',
    successCriteria: [
      'Use assumptive language throughout',
      'Act as if the sale is happening',
      'Get her to agree to next steps'
    ],
    agentId: 'agent_4601k6dvddj8fp89cey35hdj9ef8', // Spouse Check Susan
    agentName: 'Spouse Check Susan'
  },
  'hard-close-sequence': {
    scenario: 'Too Expensive Tim has heard all your value but still hesitates. Use the hard close sequence to get a decision.',
    successCriteria: [
      'Summarize value before closing',
      'Ask for the sale directly',
      'Handle final objections confidently'
    ],
    agentId: 'agent_3901k6dtsjyqfvxbxd1pwzzdham0', // Too Expensive Tim
    agentName: 'Too Expensive Tim'
  },
  // Overcome module
  'overcome': {
    scenario: 'DIY Dave thinks he can handle it himself. Use the R.A.C. framework to overcome his objection.',
    successCriteria: [
      'Acknowledge his concern',
      'Reframe the problem',
      'Close with a question'
    ],
    agentId: 'agent_1701k6dvc3nfejmvydkk7r85tqef', // DIY Dave
    agentName: 'DIY Dave'
  }
}

interface PracticeChallengeProps {
  moduleSlug: string
  moduleTitle: string
  moduleCategory?: string
}

// Map agent IDs to PERSONA_METADATA names
const getAgentNameFromId = (agentId: string): AllowedAgentName | null => {
  const agentIdMap: Record<string, AllowedAgentName> = {
    'agent_7001k5jqfjmtejvs77jvhjf254tz': 'Average Austin',
    'agent_0101k6dvb96zejkv35ncf1zkj88m': 'No Problem Nancy',
    'agent_4801k6dvap8tfnjtgd4f99hhsf10': 'Busy Beth',
    'agent_5701k6dtt9p4f8jbk8rs1akqwtmx': 'Renter Randy',
    'agent_2501k6btmv4cf2wt8hxxmq4hvzxv': 'Think About It Tina',
    'agent_3901k6dtsjyqfvxbxd1pwzzdham0': 'Too Expensive Tim',
    'agent_4601k6dvddj8fp89cey35hdj9ef8': 'Spouse Check Susan',
    'agent_1701k6dvc3nfejmvydkk7r85tqef': 'DIY Dave',
    'agent_7601k6dtrf5fe0k9dh8kwmkde0ga': 'Not Interested Nick', // Skeptical Susan uses this
    'agent_9201k6dts0haecvssk737vwfjy34': 'Skeptical Sam',
  }
  return agentIdMap[agentId] || null
}

export function PracticeChallenge({ moduleSlug, moduleTitle, moduleCategory = 'approach' }: PracticeChallengeProps) {
  const router = useRouter()
  const challenge = challengeScenarios[moduleSlug]

  if (!challenge) {
    return null // Don't show challenge if no scenario is defined
  }

  const agentName = getAgentNameFromId(challenge.agentId) || (challenge.agentName as AllowedAgentName)
  const agentMetadata = PERSONA_METADATA[agentName]
  const agentImage = agentMetadata?.bubble?.image || '/agents/default.png'
  const agentDisplayName = agentName

  // Use the actual agent name from metadata, not the scenario name
  const finalAgentName = agentName
  const finalScenario = challenge.scenario.replace(challenge.agentName, finalAgentName)

  // Get agent color variant for bubble rings
  const variantKey = (agentMetadata?.bubble?.color || 'primary') as keyof typeof COLOR_VARIANTS
  const variantStyles = COLOR_VARIANTS[variantKey]

  // Get category-specific colors matching module cards
  const getCategoryColors = (category: string) => {
    const colorMap: Record<string, {
      bg: string
      border: string
      glow: string
      text: string
      textLight: string
      bgDark: string
      bgLight: string
    }> = {
      'approach': {
        bg: '#0a2a1a',
        border: '#1a4a2a',
        glow: 'rgba(16, 185, 129, 0.1)',
        text: '#10b981',
        textLight: '#34d399',
        bgDark: '#052015',
        bgLight: '#0d3a25'
      },
      'pitch': {
        bg: '#1a2a3a',
        border: '#2a4a6a',
        glow: 'rgba(59, 130, 246, 0.1)',
        text: '#3b82f6',
        textLight: '#60a5fa',
        bgDark: '#0f172a',
        bgLight: '#1e293b'
      },
      'overcome': {
        bg: '#3a2a1a',
        border: '#6a4a2a',
        glow: 'rgba(245, 158, 11, 0.1)',
        text: '#f59e0b',
        textLight: '#fbbf24',
        bgDark: '#29201a',
        bgLight: '#3a2a1a'
      },
      'close': {
        bg: '#3a1a2a',
        border: '#6a2a4a',
        glow: 'rgba(236, 72, 153, 0.1)',
        text: '#ec4899',
        textLight: '#f472b6',
        bgDark: '#2a1a1a',
        bgLight: '#3a1a2a'
      },
      'objections': {
        bg: '#3a2a1a',
        border: '#6a4a2a',
        glow: 'rgba(245, 158, 11, 0.1)',
        text: '#f59e0b',
        textLight: '#fbbf24',
        bgDark: '#29201a',
        bgLight: '#3a2a1a'
      },
      'communication': {
        bg: '#1a1a1a',
        border: '#3a3a3a',
        glow: 'rgba(148, 163, 184, 0.1)',
        text: '#94a3b8',
        textLight: '#cbd5e1',
        bgDark: '#0f0f0f',
        bgLight: '#1a1a1a'
      }
    }
    return colorMap[category] || colorMap['approach']
  }

  const categoryColors = getCategoryColors(moduleCategory)

  const handleStartChallenge = () => {
    // Navigate to trainer with the specific agent
    router.push(`/trainer?agent=${encodeURIComponent(challenge.agentId)}`)
  }

  return (
    <div 
      className="rounded-lg p-6 sm:p-8 mb-6"
      style={{
        backgroundColor: categoryColors.bg,
        border: `2px solid ${categoryColors.border}`,
        boxShadow: `inset 0 0 20px ${categoryColors.glow}, 0 4px 16px rgba(0, 0, 0, 0.4)`
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${categoryColors.border}40` }}
        >
          <PlayCircle className="w-6 h-6" style={{ color: categoryColors.textLight }} />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-extrabold text-white mb-2 font-space">Practice Challenge</h3>
          <p className="text-lg font-bold text-white font-sans">
            Test this skill with an AI homeowner
          </p>
        </div>
      </div>

      {/* Agent Bubble */}
      {agentMetadata && (
        <div 
          className="mb-6 p-4 rounded-lg"
          style={{
            backgroundColor: categoryColors.bgDark,
            border: `1px solid ${categoryColors.border}80`
          }}
        >
          <div className="flex items-center gap-4">
            <div className="relative h-28 w-28 flex-shrink-0">
              {/* Concentric circles matching AgentBubbleSelector */}
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
                    scale: [1, 1.05, 1],
                    opacity: [0.7, 0.9, 0.7],
                  }}
                  transition={{
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
              <motion.div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 0,
                }}
              >
                <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                  {(() => {
                    const imageStyle = getAgentImageStyle(finalAgentName)
                    const objectPosition = imageStyle.objectPosition || '50% 52%'
                    const baseScale = imageStyle.scale || 1.15
                    // Make image bigger to fill more of the bubble
                    // Nick needs more zoom, others need less
                    const scaleMultiplier = finalAgentName === 'Not Interested Nick' ? 1.5 : 1.1
                    const scale = baseScale * scaleMultiplier
                    
                    const [horizontal, vertical] = objectPosition.split(' ')
                    
                    let translateY = '0'
                    const verticalNum = parseFloat(vertical)
                    if (verticalNum !== 50) {
                      const translatePercent = ((verticalNum - 50) / 150) * 100
                      translateY = `${translatePercent}%`
                    }
                    
                    const combinedTransform = translateY !== '0' 
                      ? `scale(${scale}) translateY(${translateY})`
                      : `scale(${scale})`
                    
                    const finalStyle = {
                      objectFit: 'cover' as const,
                      objectPosition: `${horizontal} 50%`,
                      transform: combinedTransform,
                    }
                    
                    const imageSrc = agentImage.includes(' ') || agentImage.includes('&')
                      ? agentImage.split('/').map((part, i) => i === 0 ? part : encodeURIComponent(part)).join('/')
                      : agentImage
                    
                    return (
                      <Image
                        src={imageSrc}
                        alt={finalAgentName}
                        fill
                        style={finalStyle}
                        sizes="112px"
                        quality={95}
                        unoptimized={agentImage.includes(' ') || agentImage.includes('&')}
                      />
                    )
                  })()}
                </div>
              </motion.div>
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold text-white font-sans mb-1">
                Your Practice Partner
              </p>
              <p className="text-2xl font-extrabold text-white mb-2 font-space">
                {finalAgentName}
              </p>
              {agentMetadata.bubble?.subtitle && (
                <p className="text-lg font-bold text-white font-sans">
                  {agentMetadata.bubble.subtitle}
                </p>
              )}
            </div>
            
            {/* Start Challenge Button - to the right, takes up half the card */}
            <button
              onClick={handleStartChallenge}
              className={cn(
                'flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-extrabold text-white',
                'transition-colors duration-200',
                'font-space text-lg w-1/2'
              )}
              style={{
                backgroundColor: categoryColors.border,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = categoryColors.text
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = categoryColors.border
              }}
            >
              <PlayCircle className="w-6 h-6" />
              Start Challenge →
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <p className="text-lg font-bold text-white font-sans mb-4 leading-relaxed">
          <span className="font-extrabold text-white">Scenario:</span> {finalScenario}
        </p>

        <div 
          className="rounded-lg p-4"
          style={{
            backgroundColor: categoryColors.bgDark,
            border: `1px solid ${categoryColors.border}80`
          }}
        >
          <h4 className="text-lg font-extrabold text-white mb-3 font-space">
            Success Criteria:
          </h4>
          <ul className="space-y-2">
            {challenge.successCriteria.map((criterion, index) => (
              <li key={index} className="flex items-start gap-2 text-lg font-bold text-white font-sans">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: categoryColors.text }} />
                <span>{criterion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

