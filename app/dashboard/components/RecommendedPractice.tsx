'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Target, Star, Clock, Lightbulb, BookOpen, Footprints, Zap, Eye, MessageSquare, X, ArrowRightCircle, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import { getAgentImageStyle } from '@/lib/agents/imageStyles'
import { useModules } from '@/hooks/learning/useModules'
import { ModuleCategory } from '@/lib/learning/types'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { cn } from '@/lib/utils'

interface Recommendation {
  recommendedPersona: string
  reasoning: string
  skillFocus: string
  difficulty: string
}

const categoryLabels: Record<ModuleCategory, string> = {
  approach: 'Approach',
  pitch: 'Pitch',
  overcome: 'Overcome',
  close: 'Close',
  objections: 'Objections',
  communication: 'Communication',
}

// Map categories to dashboard colors (matching learning center category cards)
const getCategoryColors = (category: string) => {
  const colorMap: Record<string, { bg: string; border: string; glow: string; textColor: string; badgeBg: string; badgeBorder: string; badgeText: string }> = {
    'approach': {
      bg: '#0a2a1a',
      border: '#1a4a2a',
      glow: 'rgba(16, 185, 129, 0.1)',
      textColor: 'text-emerald-200',
      badgeBg: 'bg-emerald-500/10',
      badgeBorder: 'border-emerald-500/30',
      badgeText: 'text-emerald-400'
    },
    'pitch': {
      bg: '#1a2a3a',
      border: '#2a4a6a',
      glow: 'rgba(59, 130, 246, 0.1)',
      textColor: 'text-blue-200',
      badgeBg: 'bg-blue-500/10',
      badgeBorder: 'border-blue-500/30',
      badgeText: 'text-blue-400'
    },
    'overcome': {
      bg: '#3a2a1a',
      border: '#6a4a2a',
      glow: 'rgba(245, 158, 11, 0.1)',
      textColor: 'text-amber-200',
      badgeBg: 'bg-amber-500/10',
      badgeBorder: 'border-amber-500/30',
      badgeText: 'text-amber-400'
    },
    'close': {
      bg: '#3a1a2a',
      border: '#6a2a4a',
      glow: 'rgba(236, 72, 153, 0.1)',
      textColor: 'text-pink-200',
      badgeBg: 'bg-pink-500/10',
      badgeBorder: 'border-pink-500/30',
      badgeText: 'text-pink-400'
    },
    'objections': {
      bg: '#3a2a1a',
      border: '#6a4a2a',
      glow: 'rgba(245, 158, 11, 0.1)',
      textColor: 'text-amber-200',
      badgeBg: 'bg-amber-500/10',
      badgeBorder: 'border-amber-500/30',
      badgeText: 'text-amber-400'
    },
    'communication': {
      bg: '#1a1a1a',
      border: '#3a3a3a',
      glow: 'rgba(148, 163, 184, 0.1)',
      textColor: 'text-slate-200',
      badgeBg: 'bg-slate-500/10',
      badgeBorder: 'border-slate-500/30',
      badgeText: 'text-slate-400'
    }
  }
  return colorMap[category] || colorMap['approach']
}

// Hook lines for each module
const hookLines: Record<string, string> = {
  'positioning': 'The 45-degree angle that changes everything',
  'pattern-interrupt': 'Why you should never mention your product first',
  'reading-signs': 'How to spot the perfect moment before you knock',
  'icebreaker': 'The opener that gets doors to open wider',
  'what-not-to-do': 'The mistakes that get doors slammed',
  'transition': 'How to move from approach to pitch seamlessly',
  'establishing-legitimacy': 'Make them trust you in 30 seconds',
  'value-before-price': 'Build desire before revealing cost',
  'features-vs-benefits': 'Sell outcomes, not features',
  'painting-the-picture': 'Help them visualize their ideal outcome',
  'keep-ammo': 'Save your best points for when they matter',
  'reading-and-adjusting': 'Adapt your pitch in real-time',
  'overcoming-objections-rac': 'The framework that turns no into yes',
  'why-reps-fear-closing': 'Understanding the psychology of closing',
  'soft-closes-vs-hard-closes': 'When to push and when to pull',
  'types-of-soft-closes': 'The gentle closes that work',
  'the-3-close-rule': 'Never give up before three attempts',
  'assumptive-language': 'Speak as if the sale is done',
  'the-hard-close-sequence': 'When it\'s time to ask directly',
  'mirroring': 'Get into their world',
  'eye-contact': 'Look, don\'t stare',
  'paraverbals': 'It\'s not what you say, it\'s how you say it',
  'body-language': 'What you\'re saying without words',
  'reading-their-body-language': 'Decode their signals',
  'energy-management': 'Yours and theirs'
}

// Icons for each module
const moduleIcons: Record<string, typeof Footprints> = {
  'positioning': Footprints,
  'pattern-interrupt': Zap,
  'reading-signs': Eye,
  'icebreaker': MessageSquare,
  'what-not-to-do': X,
  'transition': ArrowRightCircle,
  'establishing-legitimacy': CheckCircle2,
  'value-before-price': Zap,
  'features-vs-benefits': MessageSquare,
  'painting-the-picture': Eye,
  'keep-ammo': X,
  'reading-and-adjusting': Eye,
  'overcoming-objections-rac': Zap,
  'why-reps-fear-closing': X,
  'soft-closes-vs-hard-closes': MessageSquare,
  'types-of-soft-closes': MessageSquare,
  'the-3-close-rule': CheckCircle2,
  'assumptive-language': MessageSquare,
  'the-hard-close-sequence': Zap,
  'mirroring': Eye,
  'eye-contact': Eye,
  'paraverbals': MessageSquare,
  'body-language': Footprints,
  'reading-their-body-language': Eye,
  'energy-management': Zap
}

// Agent-specific quotes
const agentQuotes: Record<AllowedAgentName, string> = {
  'Average Austin': "Howdy Partner, what can I do for ya? Yeah I think I'm all covered on that front but thanks!",
  'No Problem Nancy': "Oh hello! That sounds interesting, tell me more!",
  'Switchover Steve': "Actually, we're already with another company, but I'm listening...",
  'Not Interested Nick': "Not interested, thanks. Have a good day.",
  'DIY Dave': "I handle all that myself, but what are you offering?",
  'Too Expensive Tim': "How much does this cost? That seems pretty expensive to me.",
  'Spouse Check Susan': "I'd need to check with my husband first, but what's this about?",
  'Busy Beth': "I only have a minute here, what do you need?",
  'Renter Randy': "I'm just renting, so I'm not sure if I can make that decision.",
  'Skeptical Sam': "I've heard a lot of sales pitches. What makes you different?",
  'Just Treated Jerry': "We just had pest control done last month, so we're all set.",
  'Think About It Tina': "Hmm, let me think about this. I need to do some research first.",
  'Veteran Victor': "I appreciate you stopping by. What service are you offering?",
  'Tag Team Tanya & Tom': "We're both here - what can you tell us about your service?",
}

export default function RecommendedPractice() {
  const router = useRouter()
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPersonaPicker, setShowPersonaPicker] = useState(false)
  const { modules, loading: modulesLoading } = useModules()

  useEffect(() => {
    fetchRecommendation()
  }, [])

  const fetchRecommendation = async () => {
    try {
      const response = await fetch('/api/homepage/recommendations')
      if (response.ok) {
        const data = await response.json()
        setRecommendation(data)
      }
    } catch (error) {
      console.error('Error fetching recommendation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartPractice = () => {
    if (recommendation?.recommendedPersona) {
      const personaMeta = PERSONA_METADATA[recommendation.recommendedPersona as AllowedAgentName]
      const agentId = personaMeta?.card?.elevenAgentId
      if (agentId) {
        router.push(`/trainer?agent=${encodeURIComponent(agentId)}`)
      } else {
        router.push('/trainer')
      }
    } else {
      router.push('/trainer')
    }
  }

  const handlePickDifferent = () => {
    router.push('/trainer')
  }

  const getDifficultyStars = (difficulty: string) => {
    // Always return 2.5 stars (2 filled, 1 half-filled, 2 empty)
    return Array.from({ length: 5 }, (_, i) => {
      if (i < 2) return 'filled'
      if (i === 2) return 'half'
      return 'empty'
    })
  }

  // Find the next unfinished module
  // Priority: 1) In progress, 2) Not started (by display order)
  const inProgressModules = modules.filter(
    (m) => (m.progress?.time_spent_seconds || 0) > 0 && !m.progress?.completed_at
  )
  
  const notStartedModules = modules.filter(
    (m) => !m.progress?.completed_at && (!m.progress?.time_spent_seconds || m.progress.time_spent_seconds === 0)
  )

  const nextModule = inProgressModules.length > 0
    ? inProgressModules[0] // Return first in-progress module
    : notStartedModules.length > 0
    ? notStartedModules.sort((a, b) => {
        // Sort by category order, then display_order
        const categoryOrder: Record<string, number> = {
          approach: 1,
          pitch: 2,
          overcome: 3,
          close: 4,
          objections: 5,
          communication: 6,
        }
        const categoryDiff = (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99)
        if (categoryDiff !== 0) return categoryDiff
        return a.display_order - b.display_order
      })[0]
    : undefined

  if (loading) {
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
      </div>
    )
  }

  if (!recommendation) {
    return null
  }

  const personaName = recommendation.recommendedPersona as AllowedAgentName
  const personaMeta = PERSONA_METADATA[personaName]
  const agentImage = personaMeta?.bubble?.image || '/agents/default.png'
  const estimatedTime = personaMeta?.card?.estimatedTime || '5-7 min'
  const difficultyStars = getDifficultyStars(personaMeta?.bubble?.difficulty || 'Moderate')
  const tip = personaMeta?.card?.bestFor || recommendation.reasoning
  
  // Get agent bubble color variant
  const variantKey = (personaMeta?.bubble?.color || 'primary') as keyof typeof COLOR_VARIANTS
  const variantStyles = COLOR_VARIANTS[variantKey]
  const imageStyle = getAgentImageStyle(personaName)

  // Homeowner quote - agent-specific
  const homeownerQuote = agentQuotes[personaName] || agentQuotes['Average Austin']

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="relative bg-white/[0.02] border-2 border-white/5 hover:border-white/30 hover:bg-white/[0.03] rounded-lg p-6 md:p-8 transition-all shadow-lg shadow-white/10 overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-purple-400" />
        <h3 className="text-base font-semibold text-purple-300 uppercase tracking-wide">
          YOUR MISSION TODAY
        </h3>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Animated Persona Portrait with Colored Circles */}
        <div className="relative h-32 w-32 md:h-40 md:w-40 mx-auto md:mx-0 flex-shrink-0">
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
                
                return (
                  <Image
                    src={agentImage}
                    alt={personaName}
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
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col max-w-[60%]">
          <div className="mb-4 flex-1 min-h-[60%] flex flex-col justify-end">
            <p className="text-white/90 text-base md:text-lg lg:text-xl font-medium mb-3 italic leading-relaxed">
              "{homeownerQuote}"
            </p>
            <p className="text-white/70 text-base md:text-lg font-medium">
              — {personaName}
            </p>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-2 bg-white/[0.05] rounded-lg p-3 md:p-4 border border-white/10 mb-4">
            <Lightbulb className="w-5 h-5 md:w-6 md:h-6 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-white/80 text-base md:text-lg">
              <span className="font-medium">Tip:</span> {tip}
            </p>
          </div>
        </div>

        {/* Difficulty and Time - Moved to right side */}
        <div className="flex flex-col items-end justify-start gap-4 md:ml-auto">
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-1.5">
              {difficultyStars.map((starType, i) => (
                <div key={i} className="relative w-6 h-6 md:w-7 md:h-7 flex-shrink-0">
                  {starType === 'filled' ? (
                    <Star className="w-6 h-6 md:w-7 md:h-7 text-purple-400 fill-purple-400" />
                  ) : starType === 'half' ? (
                    <>
                      <Star className="w-6 h-6 md:w-7 md:h-7 text-white/20 absolute inset-0" />
                      <div className="absolute inset-0 overflow-hidden w-1/2">
                        <Star className="w-6 h-6 md:w-7 md:h-7 text-purple-400 fill-purple-400" />
                      </div>
                    </>
                  ) : (
                    <Star className="w-6 h-6 md:w-7 md:h-7 text-white/20" />
                  )}
                </div>
              ))}
            </div>
            <span className="text-white/80 text-base md:text-lg font-medium">
              {personaMeta?.bubble?.difficulty || 'Moderate'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/70 text-base md:text-lg">
            <Clock className="w-5 h-5 md:w-6 md:h-6" />
            <span>{estimatedTime}</span>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartPractice}
          className="relative flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-black hover:bg-white/90 font-bold rounded-lg transition-all overflow-hidden group"
        >
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut",
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
          <span className="relative z-10">Let's Close Some Deals</span>
          <ArrowRight className="w-5 h-5 relative z-10" />
        </motion.button>
      </div>

      {/* Unfinished Lessons/Modules Section */}
      {!modulesLoading && nextModule && (() => {
        const categoryColors = getCategoryColors(nextModule.category)
        const isCompleted = nextModule.progress !== null && nextModule.progress !== undefined && nextModule.progress.completed_at !== null
        const timeSpent = nextModule.progress?.time_spent_seconds || 0
        const isInProgress = timeSpent > 0 && !isCompleted
        
        // Get card colors based on progress state (matching ModuleCard logic)
        const getCardColors = () => {
          if (isCompleted) {
            return {
              bg: categoryColors.bg,
              border: categoryColors.border,
              glow: categoryColors.glow,
              numberBg: categoryColors.border,
              iconBg: `${categoryColors.border}40`
            }
          }
          if (isInProgress) {
            return {
              bg: '#1a1a1a',
              border: `${categoryColors.border}80`,
              glow: `${categoryColors.glow}50`,
              numberBg: `${categoryColors.border}80`,
              iconBg: `${categoryColors.border}30`
            }
          }
          return {
            bg: '#1a1a1a',
            border: '#3a3a3a',
            glow: 'rgba(148, 163, 184, 0.05)',
            numberBg: '#3a3a3a',
            iconBg: '#3a3a3a40'
          }
        }
        
        const cardColors = getCardColors()
        const hookLine = hookLines[nextModule.slug] || ''
        const IconComponent = moduleIcons[nextModule.slug] || MessageSquare
        const buttonText = isCompleted ? 'Review' : isInProgress ? 'Continue' : 'Start'
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6 pt-6 border-t border-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <h4 className="text-base font-semibold text-purple-300 uppercase tracking-wide">
                Recommended Study
              </h4>
            </div>
            <Link href={`/learning/modules/${nextModule.slug}`}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full rounded-lg p-7 transition-all duration-300 cursor-pointer flex items-center gap-6 relative overflow-hidden group"
                style={{
                  backgroundColor: cardColors.bg,
                  border: `2px solid ${cardColors.border}`,
                  boxShadow: `inset 0 0 20px ${cardColors.glow}, 0 4px 16px rgba(0, 0, 0, 0.4)`
                }}
              >
                {/* Lesson Number */}
                <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center font-bold text-xl text-white"
                  style={{ backgroundColor: cardColors.numberBg }}>
                  {nextModule.display_order}
                </div>

                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: cardColors.iconBg }}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white mb-2 font-space line-clamp-1">
                    {nextModule.title}
                  </h3>
                  {hookLine && (
                    <p className="text-base text-white/85 font-sans line-clamp-1">
                      {hookLine}
                    </p>
                  )}
                </div>

                {/* Right side: Time, Button */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Time */}
                  <div className="flex items-center gap-1.5 text-base text-white/80 font-sans font-bold">
                    <Clock className="w-5 h-5" />
                    <span>{nextModule.estimated_minutes} min</span>
                  </div>

                  {/* Button */}
                  <button
                    className="px-5 py-2.5 rounded-lg font-semibold text-base transition-all duration-200 flex items-center gap-2 text-white group-hover:scale-105"
                    style={isCompleted ? {
                      backgroundColor: cardColors.numberBg,
                    } : isInProgress ? {
                      backgroundColor: cardColors.numberBg,
                    } : {
                      backgroundColor: '#3a3a3a',
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      window.location.href = `/learning/modules/${nextModule.slug}`
                    }}
                  >
                    {buttonText}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Completion Overlay */}
                {isCompleted && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-7 h-7 text-green-400" />
                  </div>
                )}
              </motion.div>
            </Link>
          </motion.div>
        )
      })()}
    </motion.div>
  )
}

