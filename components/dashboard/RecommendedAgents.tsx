'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Star } from 'lucide-react'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { getAgentImageStyle } from '@/lib/agents/imageStyles'
import { cn } from '@/lib/utils'

interface RecommendedAgent {
  name: AllowedAgentName
  reason: string
  skillFocus: string
  difficulty: string
  priority: 'high' | 'medium' | 'low'
}

interface RecommendedAgentsProps {
  agents?: RecommendedAgent[]
  skillGaps?: Array<{ skill: string; score: number }>
}

export default function RecommendedAgents({ agents, skillGaps }: RecommendedAgentsProps) {
  const router = useRouter()
  const recommendedAgents = agents || generateRecommendations(skillGaps)

  if (!recommendedAgents || recommendedAgents.length === 0) {
    return null
  }

  const handleStartPractice = (agentName: AllowedAgentName) => {
    const personaMeta = PERSONA_METADATA[agentName]
    const agentId = personaMeta?.card?.elevenAgentId
    if (agentId) {
      router.push(`/trainer?agent=${encodeURIComponent(agentId)}`)
    } else {
      router.push('/trainer')
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400'
      case 'Moderate': return 'text-yellow-400'
      case 'Hard': return 'text-orange-400'
      case 'Expert': return 'text-red-400'
      default: return 'text-white/60'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/[0.02] border-2 border-white/5 rounded-xl p-6 md:p-8"
    >
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <h2 className="text-white font-space font-bold text-2xl md:text-3xl lg:text-4xl xl:text-5xl tracking-tight mb-2">
            Recommended for You
          </h2>
          <div className="absolute -bottom-1 md:-bottom-2 left-0 right-0 h-[2px] md:h-[3px] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
        </div>
        <p className="text-white/60 text-sm md:text-base lg:text-lg mt-4">
          Practice with agents that match your skill gaps
        </p>
      </div>

      {/* Grid of 3 agent cards matching practice page style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recommendedAgents.slice(0, 3).map((agent, index) => {
          const personaMeta = PERSONA_METADATA[agent.name]
          const agentImage = personaMeta?.bubble?.image || '/agents/default.png'
          const variantKey = (personaMeta?.bubble?.color || 'primary') as keyof typeof COLOR_VARIANTS
          const variantStyles = COLOR_VARIANTS[variantKey]
          const imageStyle = getAgentImageStyle(agent.name)
          const description = personaMeta?.bubble?.description || personaMeta?.bubble?.subtitle || ''

          return (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative cursor-pointer"
              onClick={() => handleStartPractice(agent.name)}
            >
              <div
                className={cn(
                  "h-full flex flex-col items-center p-6 relative rounded-lg border",
                  "border-white/5 bg-white/[0.02]",
                  "hover:border-white/20 hover:bg-white/[0.03] transition-all duration-300"
                )}
              >
                {/* Animated Bubble - matching practice page */}
                <div className="relative mb-3">
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
                        animate={{
                          rotate: 360,
                          scale: [1, 1.05, 1],
                          opacity: [0.7, 0.9, 0.7],
                        }}
                        transition={{
                          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                          scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0 },
                          opacity: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0 },
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
                    <motion.div 
                      className="absolute inset-[2px] flex items-center justify-center pointer-events-none"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0,
                      }}
                    >
                      <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                        {(() => {
                          const [horizontal, vertical] = (imageStyle.objectPosition?.toString() || '50% 52%').split(' ')
                          let translateY = '0'
                          const verticalNum = parseFloat(vertical)
                          if (verticalNum !== 50) {
                            const translatePercent = ((verticalNum - 50) / 150) * 100
                            translateY = `${translatePercent}%`
                          }
                          const scaleValue = imageStyle.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1'
                          const combinedTransform = translateY !== '0' 
                            ? `scale(${scaleValue}) translateY(${translateY})`
                            : imageStyle.transform || `scale(${scaleValue})`
                          
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
                              alt={agent.name}
                              fill
                              style={finalStyle}
                              sizes="160px"
                              quality={95}
                              unoptimized={agentImage.includes(' ') || agentImage.includes('&')}
                            />
                          )
                        })()}
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Agent Info - Matching practice page layout exactly */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                  className="text-center space-y-3 px-2 mt-auto w-full"
                >
                  {/* Name and difficulty */}
                  <div className="flex items-center justify-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-space">
                      {agent.name}
                    </h3>
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      agent.difficulty === 'Easy' ? 'bg-green-400' :
                      agent.difficulty === 'Moderate' ? 'bg-yellow-400' :
                      agent.difficulty === 'Hard' ? 'bg-orange-400' :
                      'bg-red-400'
                    )} />
                  </div>
                  
                  {/* Combined summary/description */}
                  {description && (
                    <p className="text-sm sm:text-base text-slate-300 max-w-[240px] mx-auto leading-relaxed font-space font-bold">
                      {description}
                    </p>
                  )}
                  
                  {/* Stats - Always show "Not yet attempted" for recommended agents */}
                  <div className="text-sm sm:text-base font-bold text-slate-400 pt-2 font-space">
                    ✨ Not yet attempted
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => router.push('/trainer')}
          className="text-purple-400 hover:text-purple-300 text-base md:text-lg font-medium transition-colors"
        >
          Browse All Agents →
        </button>
      </div>
    </motion.div>
  )
}

function generateRecommendations(skillGaps?: Array<{ skill: string; score: number }>): RecommendedAgent[] {
  if (!skillGaps || skillGaps.length === 0) {
    return [
      {
        name: 'No Problem Nancy',
        reason: 'Perfect for building confidence',
        skillFocus: 'Confidence Building',
        difficulty: 'Easy',
        priority: 'high'
      },
      {
        name: 'Average Austin',
        reason: 'Great for learning the basics',
        skillFocus: 'Foundation Skills',
        difficulty: 'Moderate',
        priority: 'medium'
      },
      {
        name: 'Busy Beth',
        reason: 'Practice handling time constraints',
        skillFocus: 'Time Management',
        difficulty: 'Moderate',
        priority: 'medium'
      }
    ]
  }

  const recommendations: RecommendedAgent[] = []
  const skillToAgentMap: Record<string, AllowedAgentName[]> = {
    'objectionhandling': ['Not Interested Nick', 'Too Expensive Tim', 'Skeptical Sam'],
    'closing': ['Think About It Tina', 'Spouse Check Susan', 'Tag Team Tanya & Tom'],
    'opening': ['Not Interested Nick', 'Busy Beth', 'Renter Randy'],
    'tonality': ['Veteran Victor', 'Skeptical Sam', 'Average Austin'],
    'pace': ['Busy Beth', 'Not Interested Nick', 'Just Treated Jerry']
  }

  skillGaps.slice(0, 3).forEach((gap, index) => {
    const skillKey = gap.skill.toLowerCase().replace(/\s+/g, '')
    const agents = skillToAgentMap[skillKey] || ['Average Austin', 'No Problem Nancy', 'Busy Beth']
    const agentName = agents[index % agents.length] as AllowedAgentName
    const personaMeta = PERSONA_METADATA[agentName]

    recommendations.push({
      name: agentName,
      reason: `Improve your ${gap.skill.toLowerCase()} skills`,
      skillFocus: gap.skill,
      difficulty: personaMeta?.bubble?.difficulty || 'Moderate',
      priority: gap.score < 50 ? 'high' : gap.score < 70 ? 'medium' : 'low'
    })
  })

  // Ensure we always return exactly 3 agents
  const defaultAgents: AllowedAgentName[] = ['No Problem Nancy', 'Average Austin', 'Busy Beth']
  while (recommendations.length < 3) {
    const defaultAgent = defaultAgents[recommendations.length]
    const personaMeta = PERSONA_METADATA[defaultAgent]
    recommendations.push({
      name: defaultAgent,
      reason: 'Great for building your skills',
      skillFocus: 'General Practice',
      difficulty: personaMeta?.bubble?.difficulty || 'Moderate',
      priority: 'medium'
    })
  }

  return recommendations.slice(0, 3) // Always return exactly 3
}
