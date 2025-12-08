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
    <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className={`bg-white/[0.06] border-2 border-white/12 rounded-lg p-4 sm:p-6 md:p-8 transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08] shadow-lg shadow-black/20 ${stat.bgColor} ${stat.borderColor}`}
          >
            <div className="flex items-center justify-between gap-2 sm:gap-3 flex-nowrap">
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
                <div className={`${stat.color} p-1.5 sm:p-2 rounded-lg bg-white/[0.08] flex-shrink-0`}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                </div>
                <span className="font-space text-white/75 text-[10px] sm:text-sm md:text-base lg:text-lg font-semibold uppercase tracking-wider leading-tight whitespace-nowrap">{stat.label}</span>
              </div>
              <span className={`font-space text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-none ${stat.color} flex-shrink-0 whitespace-nowrap`}>{stat.value}</span>
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
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1, type: 'spring', stiffness: 200 }}
            className={`${stat.bgColor} rounded-3xl p-5 shadow-xl border border-white/12`}
          >
            <div className="flex items-center justify-between gap-2 flex-nowrap">
              <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
                <div className={stat.color}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-space text-white/75 text-xs font-medium uppercase tracking-wider whitespace-nowrap">{stat.label}</span>
              </div>
              <span className={`font-space ${stat.color} text-xl font-bold flex-shrink-0 whitespace-nowrap`}>{stat.value}</span>
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
    return 'Let\'s Get After It'
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
              <div className="h-20 bg-white/[0.06] rounded-3xl animate-pulse border border-white/12" />
            </div>
            <div className="px-2">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/[0.06] rounded-3xl p-5 animate-pulse border border-white/12">
                    <div className="h-5 bg-white/15 rounded w-full mb-2" />
                    <div className="h-6 bg-white/15 rounded w-3/4 mx-auto mb-1" />
                    <div className="h-3 bg-white/15 rounded w-1/2 mx-auto" />
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
              <div className="bg-white/[0.06] border-2 border-white/12 rounded-lg p-6 sm:p-8 md:p-10 animate-pulse shadow-lg shadow-black/20">
                <div className="h-6 sm:h-8 bg-white/15 rounded w-1/2 sm:w-1/3 mb-3 sm:mb-4" />
                <div className="h-3 sm:h-4 bg-white/15 rounded w-1/3 sm:w-1/4 mb-6 sm:mb-8" />
                <div className="h-12 sm:h-16 bg-white/15 rounded w-full sm:w-1/2 mb-4 sm:mb-6" />
                <div className="h-8 sm:h-10 bg-white/15 rounded w-full" />
              </div>
              <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white/[0.06] border-2 border-white/12 rounded-lg p-4 sm:p-6 md:p-8 animate-pulse shadow-lg shadow-black/20"
                  >
                    <div className="h-5 sm:h-6 bg-white/15 rounded w-1/2 mb-3 sm:mb-4" />
                    <div className="h-8 sm:h-12 bg-white/15 rounded w-3/4 mb-3 sm:mb-4" />
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
        <div className="max-w-full mx-auto space-y-6 sm:space-y-8">
          {/* Mobile Greeting Section - Header Style */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="pt-4 space-y-3"
          >
            {/* Header Row: Greeting as Main Title */}
            <div className="flex flex-col gap-2 mb-3">
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="font-space text-3xl sm:text-4xl font-bold text-white"
              >
                {greeting},{' '}
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 font-bold">
                    {getDisplayName()}
                  </span>
                  <motion.span
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.5, duration: 0.4 }}
                  />
                </span>
              </motion.h1>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="font-space text-sm text-white/80 leading-relaxed"
            >
              {getMotivationalSubtext()}
            </motion.p>
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
              className="w-full group/btn flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-3xl shadow-xl shadow-purple-500/30 transition-all hover:shadow-2xl hover:shadow-purple-500/40"
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="px-2 relative"
          >
            {/* Subtle divider */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
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

      {/* Desktop Layout - Redesigned */}
      <div className="hidden md:block relative z-0 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-8 sm:pb-12 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section - Header Style Layout */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 sm:mb-10 md:mb-12"
          >
            {/* Header Row: Greeting as Main Title */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-4 sm:mb-5 md:mb-6">
              {/* Greeting as Main Title */}
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="font-space text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.1]"
              >
                <span className="relative inline-block">
                  <span className="text-slate-200">{greeting},</span>{' '}
                  <span className="relative inline-block">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                      {getDisplayName()}
                    </span>
                    {/* Animated underline */}
                    <motion.span
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                    />
                  </span>
                  {/* Subtle gradient overlay */}
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-transparent to-pink-500/20 blur-3xl -z-10"></span>
                </span>
              </motion.h1>
            </div>

            {/* Motivational subtext */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="font-space text-white/85 text-sm sm:text-base md:text-lg lg:text-xl font-medium max-w-3xl leading-relaxed"
            >
              {getMotivationalSubtext()}
            </motion.p>
          </motion.div>

          {/* Quick Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mb-8 sm:mb-10 md:mb-12 relative"
          >
            {/* Subtle divider */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>
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
            transition={{ duration: 0.5, delay: 0.9 }}
            className="relative"
          >
            {/* Subtle divider before content */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6"></div>
            <HomepageContent />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
