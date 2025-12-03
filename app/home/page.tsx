'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Play, Flame, Target, TrendingUp, ArrowRight } from 'lucide-react'
import HomepageContent from '@/app/dashboard/components/HomepageContent'

// Quick Stats Card Component - Dashboard Style
function QuickStatsCard({ streak, sessionsToday, avgScore }: { streak: number; sessionsToday: number; avgScore: number }) {
  const stats = [
    { icon: Flame, value: streak, label: 'Day Streak', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
    { icon: Target, value: sessionsToday, label: 'Sessions Today', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
    { icon: TrendingUp, value: `${avgScore}%`, label: 'Avg Score', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className={`bg-white/[0.02] border-2 border-white/5 rounded-lg p-4 md:p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025] ${stat.bgColor} ${stat.borderColor}`}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className={`${stat.color} p-1.5 rounded-lg bg-white/[0.05]`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-space text-white/60 text-base md:text-lg font-semibold uppercase tracking-wider">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`font-space text-white text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight ${stat.color}`}>{stat.value}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ streak: 0, sessionsToday: 0, avgScore: 0 })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setUserName('')
        setLoading(false)
        return
      }
      
      // Fetch user name
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single()
      
      if (userData?.full_name) {
        const firstName = userData.full_name.split(' ')[0] || userData.email?.split('@')[0] || ''
        if (firstName) {
          setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase())
        }
      } else if (userData?.email) {
        const emailName = userData.email.split('@')[0] || ''
        if (emailName) {
          setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase())
        }
      } else {
        const authName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || ''
        if (authName) {
          const firstName = authName.split(' ')[0]
          setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase())
        }
      }

      // Fetch stats for inline display
      try {
        const statsResponse = await fetch('/api/homepage/rotating-stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats({
            streak: statsData.streak || 0,
            sessionsToday: statsData.repsToday || 0,
            avgScore: statsData.averageScore || 0,
          })
        }
      } catch (e) {
        console.error('Error fetching stats:', e)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching user data:', error)
      setLoading(false)
    }
  }

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) {
      return { text: 'Good morning' }
    } else if (hour < 17) {
      return { text: 'Good afternoon' }
    } else {
      return { text: 'Good evening' }
    }
  }

  const getDisplayName = () => {
    if (!userName || userName.trim() === '') {
      return 'Guest'
    }
    return userName
  }

  const getGreeting = () => {
    if (!userName || userName.trim() === '') {
      return '☀️ Rise and Grind'
    }
    return getTimeOfDayGreeting().text
  }

  const getMotivationalSubtext = () => {
    if (stats.streak >= 7) {
      return `You're on a ${stats.streak}-day streak! Keep the momentum going.`
    } else if (stats.sessionsToday >= 3) {
      return "You've been putting in the work today. Nice!"
    } else if (stats.avgScore >= 80) {
      return "Your scores are looking great. Ready to level up?"
    } else if (stats.sessionsToday === 0) {
      return "Ready to sharpen your skills today?"
    }
    return "Every practice session makes you better."
  }

  const handleStartPractice = () => {
    router.push('/trainer')
  }

  const greeting = getGreeting()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white relative">
        <div className="relative z-10 pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Loading skeleton */}
            <div className="space-y-6 md:space-y-8 mt-12">
              <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-8 md:p-10 animate-pulse">
                <div className="h-8 bg-white/10 rounded w-1/3 mb-4" />
                <div className="h-4 bg-white/10 rounded w-1/4 mb-8" />
                <div className="h-16 bg-white/10 rounded w-1/2 mb-6" />
                <div className="h-10 bg-white/10 rounded w-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 animate-pulse"
                  >
                    <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
                    <div className="h-12 bg-white/10 rounded w-3/4 mb-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative">
      <div className="relative z-10 pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section - Matching Dashboard Style */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="font-space text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white font-bold tracking-tight mb-3 md:mb-4">
              {greeting},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                {getDisplayName()}
              </span>
            </h1>
            <p className="font-space text-white/70 text-base sm:text-lg md:text-xl lg:text-2xl font-medium max-w-2xl">
              {getMotivationalSubtext()}
            </p>
          </motion.div>

          {/* Quick Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <QuickStatsCard 
              streak={stats.streak} 
              sessionsToday={stats.sessionsToday} 
              avgScore={stats.avgScore} 
            />
          </motion.div>

          {/* Homepage Content - All sections below */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <HomepageContent />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
