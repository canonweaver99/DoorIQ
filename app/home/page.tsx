'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Play, Flame, Target, TrendingUp, ArrowRight } from 'lucide-react'
import HomepageContent from '@/app/dashboard/components/HomepageContent'

// Quick Stats Card Component - Desktop Style (unchanged)
function QuickStatsCard({ streak, sessionsToday, avgScore }: { streak: number; sessionsToday: number; avgScore: number }) {
  const stats = [
    { icon: Flame, value: streak, label: 'Day Streak', color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20' },
    { icon: Target, value: sessionsToday, label: 'Sessions Today', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' },
    { icon: TrendingUp, value: `${avgScore}%`, label: 'Avg Score', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20' },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className={`bg-white/[0.02] border-2 border-white/5 rounded-lg p-2.5 sm:p-4 md:p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025] ${stat.bgColor} ${stat.borderColor}`}
          >
            <div className="flex items-center gap-1.5 sm:gap-2.5 mb-2 sm:mb-2.5">
              <div className={`${stat.color} p-1 sm:p-1.5 rounded-lg bg-white/[0.05] flex-shrink-0`}>
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
              <span className="font-space text-white/60 text-[10px] sm:text-sm md:text-base lg:text-lg font-semibold uppercase tracking-wider leading-tight">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`font-space text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-none ${stat.color}`}>{stat.value}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Mobile Quick Stats Card Component - iOS-native styling
function MobileQuickStatsCard({ streak, sessionsToday, avgScore }: { streak: number; sessionsToday: number; avgScore: number }) {
  const stats = [
    { icon: Flame, value: streak, label: 'Streak', color: 'text-orange-400', bgColor: 'bg-orange-500/10' },
    { icon: Target, value: sessionsToday, label: 'Today', color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
    { icon: TrendingUp, value: `${avgScore}%`, label: 'Score', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1, type: 'spring', stiffness: 200 }}
            className={`${stat.bgColor} rounded-3xl p-4 shadow-xl border border-white/5`}
          >
            <div className="flex flex-col items-center justify-center">
              <div className={`${stat.color} mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`font-space ${stat.color} text-2xl font-bold mb-1`}>{stat.value}</span>
              <span className="font-space text-white/60 text-xs font-medium uppercase tracking-wider">{stat.label}</span>
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
      const hour = currentTime.getHours()
      if (hour < 12) {
        return '☀️ Rise and Grind'
      } else if (hour < 17) {
        return '🔥 Let\'s Get After It'
      } else {
        return '🌙 Let\'s Finish Strong'
      }
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
        {/* Mobile Loading Skeleton */}
        <div className="md:hidden relative z-10 pt-6 pb-24 px-4">
          <div className="max-w-full mx-auto space-y-6">
            <div className="text-center pt-4 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-32 mx-auto mb-2" />
              <div className="h-8 bg-white/10 rounded w-40 mx-auto mb-2" />
              <div className="h-4 bg-white/10 rounded w-64 mx-auto" />
            </div>
            <div className="px-2">
              <div className="h-20 bg-white/5 rounded-3xl animate-pulse" />
            </div>
            <div className="px-2">
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/5 rounded-3xl p-4 animate-pulse">
                    <div className="h-5 bg-white/10 rounded w-full mb-2" />
                    <div className="h-6 bg-white/10 rounded w-3/4 mx-auto mb-1" />
                    <div className="h-3 bg-white/10 rounded w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Loading Skeleton */}
        <div className="hidden md:block relative z-10 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-8 sm:pb-12 md:pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-4 sm:space-y-6 md:space-y-8 mt-8 sm:mt-12">
              <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 sm:p-8 md:p-10 animate-pulse">
                <div className="h-6 sm:h-8 bg-white/10 rounded w-1/2 sm:w-1/3 mb-3 sm:mb-4" />
                <div className="h-3 sm:h-4 bg-white/10 rounded w-1/3 sm:w-1/4 mb-6 sm:mb-8" />
                <div className="h-12 sm:h-16 bg-white/10 rounded w-full sm:w-1/2 mb-4 sm:mb-6" />
                <div className="h-8 sm:h-10 bg-white/10 rounded w-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-4 sm:p-6 animate-pulse"
                  >
                    <div className="h-5 sm:h-6 bg-white/10 rounded w-1/2 mb-3 sm:mb-4" />
                    <div className="h-8 sm:h-12 bg-white/10 rounded w-3/4 mb-3 sm:mb-4" />
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
      {/* Mobile Layout - iOS-native styling */}
      <div className="md:hidden relative z-0 pt-6 pb-24 px-4">
        <div className="max-w-full mx-auto space-y-6">
          {/* Mobile Greeting Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center pt-4"
          >
            <p className="font-space text-xl font-medium text-white/80 mb-1">
              {greeting}
            </p>
            <h1 className="font-space text-3xl font-bold text-white mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                {getDisplayName()}
              </span>
            </h1>
            <p className="font-space text-sm text-white/60 px-4">
              {getMotivationalSubtext()}
            </p>
          </motion.div>

          {/* Mobile Start Practice Button - Prominent */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1, type: 'spring', stiffness: 200 }}
            className="px-2"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartPractice}
              className="w-full group/btn flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-3xl shadow-xl shadow-purple-500/25 transition-all"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm">
                <Play className="w-6 h-6 fill-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-space text-lg font-bold">Start Practice</div>
                <div className="font-space text-xs text-white/80">Begin a new session</div>
              </div>
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>

          {/* Mobile Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="px-2"
          >
            <MobileQuickStatsCard 
              streak={stats.streak} 
              sessionsToday={stats.sessionsToday} 
              avgScore={stats.avgScore} 
            />
          </motion.div>

          {/* Mobile Homepage Content - Condensed */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="space-y-4"
          >
            <HomepageContent />
          </motion.div>
        </div>
      </div>

      {/* Desktop Layout - Unchanged */}
      <div className="hidden md:block relative z-0 pt-24 sm:pt-24 md:pt-28 lg:pt-32 pb-8 sm:pb-12 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section - Matching Dashboard Style */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-3 text-center"
          >
            <h1 className="font-space text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white font-bold leading-[1.1] uppercase mb-1">
              Home
            </h1>
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-300 drop-shadow-md font-space">
              {greeting},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                {getDisplayName()}
              </span>
            </p>
            <p className="font-space text-white/70 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium max-w-2xl mx-auto mt-4 leading-relaxed">
              {getMotivationalSubtext()}
            </p>
          </motion.div>

          {/* Quick Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 sm:mb-8"
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
