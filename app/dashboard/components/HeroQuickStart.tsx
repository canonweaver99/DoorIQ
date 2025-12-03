'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Clock, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import DailyStreakCounter from './DailyStreakCounter'
import RecommendedPractice from './RecommendedPractice'
import { PERSONA_METADATA, ALLOWED_AGENT_ORDER, type AllowedAgentName } from '@/components/trainer/personas'
import Image from 'next/image'

interface LastSession {
  agentName: string
  score: number
  startedAt: string
  durationSeconds: number | null
}

interface HeroQuickStartProps {
  lastSession: LastSession | null
}

export default function HeroQuickStart({ lastSession }: HeroQuickStartProps) {
  const router = useRouter()
  const [recommendedPersonas, setRecommendedPersonas] = useState<AllowedAgentName[]>([])
  const [personaStats, setPersonaStats] = useState<Record<string, { practiceCount: number }>>({})

  useEffect(() => {
    // Get top 4 recommended personas (starting with beginner-friendly)
    const beginnerPersonas: AllowedAgentName[] = [
      'Average Austin',
      'No Problem Nancy',
      'Busy Beth',
      'Too Expensive Tim'
    ]
    setRecommendedPersonas(beginnerPersonas.slice(0, 4))
    
    // Fetch persona stats
    fetchPersonaStats()
  }, [])

  const fetchPersonaStats = async () => {
    try {
      const response = await fetch('/api/homepage/persona-stats')
      if (response.ok) {
        const data = await response.json()
        setPersonaStats(data.global || {})
      }
    } catch (error) {
      console.error('Error fetching persona stats:', error)
    }
  }

  const getPersonalityType = (difficulty: string) => {
    if (difficulty === 'Easy') return { emoji: '🐑', type: 'Sheep' }
    if (difficulty === 'Moderate') return { emoji: '🐯', type: 'Tiger' }
    if (difficulty === 'Hard') return { emoji: '🐂', type: 'Bull' }
    return { emoji: '🦉', type: 'Owl' }
  }

  const handleStartPractice = () => {
    router.push('/trainer')
  }

  const handlePersonaSelect = (personaName: AllowedAgentName) => {
    const personaMeta = PERSONA_METADATA[personaName]
    const agentId = personaMeta?.card?.elevenAgentId
    if (agentId) {
      router.push(`/trainer?agent=${encodeURIComponent(agentId)}`)
    } else {
      router.push('/trainer')
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Daily Streak and Quick Start CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <DailyStreakCounter />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartPractice}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-lg text-base transition-all shadow-lg shadow-purple-500/20"
        >
          <Play className="w-5 h-5" />
          Start Practice Session
        </motion.button>
      </div>

      {/* Last Practice Recap */}
      {lastSession && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-4 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                <Image
                  src={PERSONA_METADATA[lastSession.agentName as AllowedAgentName]?.bubble?.image || '/agents/default.png'}
                  alt={lastSession.agentName}
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-white/80 text-sm">Your last session</p>
                <p className="text-white font-semibold">
                  {lastSession.agentName} - Score: {lastSession.score}/100
                </p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-white/60 text-xs">
                    {formatDistanceToNow(new Date(lastSession.startedAt), { addSuffix: true })}
                  </span>
                  <div className="flex items-center gap-1 text-white/60 text-xs">
                    <Clock className="w-3 h-3" />
                    {formatDuration(lastSession.durationSeconds)}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${lastSession.score >= 80 ? 'text-purple-400' : lastSession.score >= 60 ? 'text-white/80' : 'text-white/60'}`}>
                {lastSession.score}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommended Practice */}
      <RecommendedPractice />

      {/* Persona Quick Select */}
      <div>
        <h3 className="text-white/80 text-sm font-medium mb-3 uppercase tracking-wide">
          Quick Select Persona
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {recommendedPersonas.map((personaName) => {
            const personaMeta = PERSONA_METADATA[personaName]
            const image = personaMeta?.bubble?.image || '/agents/default.png'
            const subtitle = personaMeta?.bubble?.subtitle || ''
            const difficulty = personaMeta?.bubble?.difficulty || 'Moderate'
            const personalityType = getPersonalityType(difficulty)
            const stats = personaStats[personaName] || { practiceCount: 0 }
            const practiceCount = stats.practiceCount || 0
            
            return (
              <motion.button
                key={personaName}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePersonaSelect(personaName)}
                className="bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg p-3 transition-all group relative overflow-hidden"
              >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 border-2 border-white/10 group-hover:border-purple-500/40 transition-all">
                  <Image
                    src={image}
                    alt={personaName}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-white font-semibold text-sm text-center mb-1">
                  {personaName.split(' ').pop()}
                </p>
                <p className="text-white/70 text-xs text-center mb-1">
                  {subtitle}
                </p>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-white/60 text-xs">{personalityType.type}</span>
                </div>
                <div className="flex items-center justify-center gap-1 text-white/50 text-xs">
                  <span>{difficulty}</span>
                </div>
                {practiceCount > 0 && (
                  <div className="mt-1 text-center text-white/40 text-xs">
                    {practiceCount} attempts today
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

