'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Target, Star, Clock, Lightbulb, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import { getAgentImageStyle } from '@/lib/agents/imageStyles'

interface Recommendation {
  recommendedPersona: string
  reasoning: string
  skillFocus: string
  difficulty: string
}

export default function RecommendedPractice() {
  const router = useRouter()
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPersonaPicker, setShowPersonaPicker] = useState(false)

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
    const difficultyMap: Record<string, number> = {
      'Easy': 1,
      'Moderate': 2,
      'Hard': 3,
      'Expert': 4
    }
    const stars = difficultyMap[difficulty] || 2
    return Array.from({ length: 5 }, (_, i) => i < stars)
  }

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="relative bg-white/[0.02] border-2 border-white/5 hover:border-white/30 hover:bg-white/[0.03] rounded-lg p-6 md:p-8 transition-all shadow-lg shadow-purple-500/20 overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-purple-400" />
        <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wide">
          YOUR MISSION TODAY
        </h3>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Animated Persona Portrait */}
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-32 h-32 md:w-40 md:h-40 mx-auto md:mx-0 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0"
        >
          <Image
            src={agentImage}
            alt={personaName}
            fill
            className="object-cover relative z-10"
            sizes="160px"
          />
        </motion.div>

        {/* Content */}
        <div className="flex-1">
          <div className="mb-4">
            <p className="text-white/90 text-lg md:text-xl font-medium mb-2 italic">
              "{personaMeta?.bubble?.description || 'Think you can handle my objections today?'}"
            </p>
            <p className="text-white/70 text-sm">
              — {personaName}
            </p>
          </div>

          {/* Difficulty and Time */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {difficultyStars.map((filled, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${filled ? 'text-purple-400 fill-purple-400' : 'text-white/20'}`}
                  />
                ))}
              </div>
              <span className="text-white/80 text-sm font-medium">
                {personaMeta?.bubble?.difficulty || 'Moderate'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Clock className="w-4 h-4" />
              <span>Est. Time: {estimatedTime}</span>
            </div>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-2 bg-white/[0.05] rounded-lg p-3 border border-white/10">
            <Lightbulb className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-white/80 text-sm">
              <span className="font-medium">Tip:</span> {tip}
            </p>
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
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePickDifferent}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white font-medium transition-all"
        >
          Pick Different Persona
          <ChevronDown className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

