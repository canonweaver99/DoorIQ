'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Target, Trophy, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface StatData {
  streak: number
  repsToday: number
  teamRank: number
  averageScore: number
}

export default function HomeStatCard() {
  const [stats, setStats] = useState<StatData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/homepage/rotating-stats')
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      setStats({
        streak: 0,
        repsToday: 0,
        teamRank: 1,
        averageScore: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="group relative bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 md:p-8 w-full lg:w-80 animate-pulse overflow-hidden">
        <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-white/10 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const statItems = [
    {
      icon: Flame,
      label: 'Streak',
      value: `${stats.streak} day${stats.streak !== 1 ? 's' : ''}`,
      color: 'text-orange-400',
    },
    {
      icon: Target,
      label: 'Sessions Today',
      value: `${stats.repsToday}`,
      color: 'text-blue-400',
    },
    {
      icon: Trophy,
      label: 'Team Rank',
      value: `#${stats.teamRank}`,
      color: 'text-yellow-400',
    },
    {
      icon: TrendingUp,
      label: 'Avg Overall %',
      value: `${stats.averageScore}%`,
      color: 'text-green-400',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="group relative bg-white/[0.02] border-2 border-white/5 rounded-lg p-3 sm:p-4 md:p-8 w-full lg:w-80 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025] overflow-hidden"
    >
      {/* Subtle purple glow at bottom for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <h3 className="text-white/90 font-space font-bold text-sm sm:text-base md:text-lg uppercase tracking-wider mb-2 sm:mb-4">
          Your Stats
        </h3>
        <div className="space-y-2 sm:space-y-3">
          {statItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`${item.color} p-1 sm:p-1.5 rounded-md bg-white/[0.05]`}>
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <span className="text-white/70 text-xs sm:text-sm font-space font-bold">{item.label}</span>
                </div>
                <span className="text-white font-space font-bold text-sm sm:text-base">
                  {item.value}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

