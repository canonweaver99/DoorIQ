'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import {
  ArrowRight,
  Play,
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  Calendar,
  ChevronRight,
  Target,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'

type LiveSession = Database['public']['Tables']['live_sessions']['Row']

// Animated Background Component (matching landing page)
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-transparent rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-pink-500/20 via-purple-500/20 to-transparent rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, 60, 0],
          y: [0, -70, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/15 via-blue-500/15 to-transparent rounded-full blur-[100px]"
      />
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black" />
      
      {/* Animated grid pattern */}
      <motion.div
        animate={{
          opacity: [0.03, 0.06, 0.03],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  )
}

// Helper to format duration
const formatDuration = (seconds: number | null) => {
  if (!seconds || isNaN(seconds)) return '0m'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// Helper to get score color
const getScoreColor = (score: number | null) => {
  if (!score || isNaN(score)) return 'text-white/60'
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

export default function HomePage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [stats, setStats] = useState({
    sessionsThisWeek: 0,
    totalSessions: 0,
    avgScore: 0,
    bestScore: 0,
  })
  const [recentSessions, setRecentSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

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
        router.push('/auth/login')
        return
      }
      
      // Get user name
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single()
      
      if (userData?.full_name) {
        const firstName = userData.full_name.split(' ')[0] || userData.email?.split('@')[0] || 'User'
        setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase())
      } else if (userData?.email) {
        const emailName = userData.email.split('@')[0] || 'User'
        setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase())
      } else {
        setUserName('User')
      }
      
      // Get sessions from this week
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      const { data: sessionsThisWeekData } = await supabase
        .from('live_sessions')
        .select('id, overall_score, created_at, ended_at, agent_name, duration_seconds')
        .eq('user_id', user.id)
        .gte('created_at', oneWeekAgo.toISOString())
        .order('created_at', { ascending: false })
      
      // Get total sessions count
      const { data: allSessionsData } = await supabase
        .from('live_sessions')
        .select('id, overall_score, created_at, ended_at, agent_name, duration_seconds')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (allSessionsData) {
        setRecentSessions(allSessionsData)
        
        // Calculate stats
        const sessionsWithScores = allSessionsData.filter(s => s.overall_score !== null && s.overall_score !== undefined)
        const avgScore = sessionsWithScores.length > 0
          ? Math.round(sessionsWithScores.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessionsWithScores.length)
          : 0
        const bestScore = sessionsWithScores.length > 0
          ? Math.max(...sessionsWithScores.map(s => s.overall_score || 0))
          : 0
        
        setStats({
          sessionsThisWeek: sessionsThisWeekData?.length || 0,
          totalSessions: allSessionsData.length,
          avgScore,
          bestScore,
        })
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching user data:', error)
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  if (loading) {
    return (
      <main className="bg-black min-h-screen text-white relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-white/80 text-lg font-sans">Loading...</div>
      </main>
    )
  }

  return (
    <main className="bg-black min-h-screen text-white relative">
      <AnimatedBackground />
      
      <div className="relative z-10 pt-24 pb-16 px-6 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="font-space text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white font-light tracking-tight mb-4">
                  Welcome back,{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    {userName}
                  </span>
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-white/70 text-sm md:text-base font-sans">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(currentTime)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(currentTime)}</span>
                  </span>
                </div>
              </div>
              
              {/* Quick Action Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <Link
                  href="/trainer/select-homeowner"
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-md text-base tracking-tight hover:bg-white/95 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Practice Session
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12"
          >
            {/* Sessions This Week */}
            <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 hover:border-white/30 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="font-space text-3xl md:text-4xl text-white font-light tracking-tight">
                  {stats.sessionsThisWeek}
                </div>
              </div>
              <p className="font-sans text-white/80 text-sm md:text-base font-light">
                Sessions This Week
              </p>
            </div>

            {/* Total Sessions */}
            <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 hover:border-white/30 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div className="font-space text-3xl md:text-4xl text-white font-light tracking-tight">
                  {stats.totalSessions}
                </div>
              </div>
              <p className="font-sans text-white/80 text-sm md:text-base font-light">
                Total Sessions
              </p>
            </div>

            {/* Average Score */}
            <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 hover:border-white/30 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className={`font-space text-3xl md:text-4xl font-light tracking-tight ${getScoreColor(stats.avgScore)}`}>
                  {stats.avgScore || '--'}
                </div>
              </div>
              <p className="font-sans text-white/80 text-sm md:text-base font-light">
                Average Score
              </p>
            </div>

            {/* Best Score */}
            <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 hover:border-white/30 hover:bg-white/[0.03] transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div className={`font-space text-3xl md:text-4xl font-light tracking-tight ${getScoreColor(stats.bestScore)}`}>
                  {stats.bestScore || '--'}
                </div>
              </div>
              <p className="font-sans text-white/80 text-sm md:text-base font-light">
                Best Score
              </p>
            </div>
          </motion.div>

          {/* Recent Sessions & Quick Links */}
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Recent Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="lg:col-span-2"
            >
              <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-space text-2xl md:text-3xl text-white font-light tracking-tight">
                    Recent Sessions
                  </h2>
                  <Link
                    href="/dashboard?tab=overview"
                    className="text-white/80 hover:text-white text-sm font-sans flex items-center gap-2 transition-colors"
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                
                {recentSessions.length > 0 ? (
                  <div className="space-y-4">
                    {recentSessions.slice(0, 5).map((session) => (
                      <Link
                        key={session.id}
                        href={`/sessions/${session.id}`}
                        className="block bg-white/[0.02] border border-white/5 rounded-lg p-4 hover:border-white/20 hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-space text-lg text-white font-medium">
                                {session.agent_name || 'Practice Session'}
                              </h3>
                              {session.overall_score !== null && (
                                <span className={`text-sm font-sans ${getScoreColor(session.overall_score)}`}>
                                  {session.overall_score}%
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-white/60 text-sm font-sans">
                              {session.created_at && (
                                <span>{format(new Date(session.created_at), 'MMM d, yyyy')}</span>
                              )}
                              {session.duration_seconds && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(session.duration_seconds)}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/40" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Play className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60 font-sans mb-6">
                      No sessions yet. Start your first practice session!
                    </p>
                    <Link
                      href="/trainer/select-homeowner"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-md text-sm tracking-tight hover:bg-white/95 transition-all"
                    >
                      Start Practice Session
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 md:p-8">
                <h2 className="font-space text-2xl md:text-3xl text-white font-light tracking-tight mb-6">
                  Quick Links
                </h2>
                <div className="space-y-3">
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-lg hover:border-white/20 hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-white/80" />
                      <span className="font-sans text-white/90">Dashboard</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  
                  <Link
                    href="/trainer/select-homeowner"
                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-lg hover:border-white/20 hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-white/80" />
                      <span className="font-sans text-white/90">Practice</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  
                  <Link
                    href="/sessions"
                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-lg hover:border-white/20 hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-white/80" />
                      <span className="font-sans text-white/90">All Sessions</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  
                  <Link
                    href="/leaderboard"
                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-lg hover:border-white/20 hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-white/80" />
                      <span className="font-sans text-white/90">Leaderboard</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}

