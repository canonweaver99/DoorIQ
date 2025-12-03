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
      <Card className="bg-white/[0.02] border-2 border-white/5 p-4 w-full lg:w-80 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-white/10 rounded" />
          ))}
        </div>
      </Card>
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
    >
      <Card className="bg-white/[0.02] border-2 border-white/5 p-4 lg:p-6 w-full lg:w-80">
        <h3 className="text-white/90 font-space font-medium text-sm uppercase tracking-wider mb-4">
          Your Stats
        </h3>
        <div className="space-y-3">
          {statItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`${item.color} p-1.5 rounded-md bg-white/[0.05]`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-white/70 text-sm font-sans">{item.label}</span>
                </div>
                <span className="text-white font-space font-medium text-base">
                  {item.value}
                </span>
              </motion.div>
            )
          })}
        </div>
      </Card>
    </motion.div>
  )
}

