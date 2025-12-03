'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, TrendingUp, AlertCircle, ChevronRight, DollarSign, Trash2, Timer, XCircle, AlertTriangle, ArrowRight } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { SignInComponent, Testimonial } from '@/components/ui/sign-in'
import { getAgentImageStyle } from '@/lib/agents/imageStyles'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'

import { format, isToday, isYesterday, startOfDay } from 'date-fns'
import type { GradeInfo, KeyIssue } from '@/app/dashboard/types'

// AnimatedGrid component matching landing page style
const AnimatedGrid = () => (
  <motion.div
    animate={{
      opacity: [0.02, 0.04, 0.02],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: "easeInOut",
    }}
    className="absolute inset-0 pointer-events-none"
  >
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }}
    />
  </motion.div>
)

// Dynamic imports for heavy components
const CircularProgress = dynamic(() => import('@/components/ui/CircularProgress'), { ssr: false })
const ConfirmationModal = dynamic(() => import('@/components/ui/ConfirmationModal'), { ssr: false })
const PasswordResetModal = dynamic(() => import('@/components/auth/PasswordResetModal'), { ssr: false })

type Session = Database['public']['Tables']['live_sessions']['Row']

// Helper to get agent color variant
const getAgentColorVariant = (agentName: string | null): keyof typeof COLOR_VARIANTS => {
  if (!agentName) return 'primary'
  const agentNameTyped = agentName as AllowedAgentName
  if (PERSONA_METADATA[agentNameTyped]?.bubble?.color) {
    return PERSONA_METADATA[agentNameTyped].bubble.color as keyof typeof COLOR_VARIANTS
  }
  return 'primary'
}

// Get cutout bubble image (no background) - for consistency with practice page
const getAgentImage = (agentName: string | null): string => {
  if (!agentName) return '/agents/default.png'
  const agentNameTyped = agentName as AllowedAgentName
  if (PERSONA_METADATA[agentNameTyped]?.bubble?.image) {
    return PERSONA_METADATA[agentNameTyped].bubble.image
  }
  return '/agents/default.png'
}

// Calculate grade from score
const calculateGrade = (score: number): GradeInfo => {
  if (score >= 90) {
    return {
      letter: 'A',
      color: 'text-green-600',
      bgColor: 'bg-green-600/20',
      borderColor: 'border-green-600'
    }
  } else if (score >= 80) {
    return {
      letter: 'B',
      color: 'text-green-400',
      bgColor: 'bg-green-400/20',
      borderColor: 'border-green-400'
    }
  } else if (score >= 70) {
    return {
      letter: 'C',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/20',
      borderColor: 'border-yellow-400'
    }
  } else if (score >= 60) {
    return {
      letter: 'D',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/20',
      borderColor: 'border-orange-400'
    }
  } else {
    return {
      letter: 'F',
      color: 'text-red-400',
      bgColor: 'bg-red-400/20',
      borderColor: 'border-red-400'
    }
  }
}

// Extract first critical issue from session
const getFirstCriticalIssue = (session: Session): KeyIssue | null => {
  // Check for low scores - these are critical issues
  if (session.rapport_score && session.rapport_score < 70) {
    return { text: 'Work on building rapport early in the conversation', severity: 'warning' }
  }
  if (session.objection_handling_score && session.objection_handling_score < 70) {
    return { text: 'Practice handling common objections more confidently', severity: 'warning' }
  }
  const closing = session.close_effectiveness_score ?? (session as any).close_score ?? null
  if (closing && closing < 70) {
    return { text: 'Focus on closing techniques and asking for the sale', severity: 'error' }
  }
  
  // Check for speaking pace issues (if available)
  const analytics = (session as any).analytics
  if (analytics?.conversation_metrics?.pace && analytics.conversation_metrics.pace > 160) {
    return { text: `Speaking too fast (${Math.round(analytics.conversation_metrics.pace)} WPM)`, severity: 'warning' }
  }
  
  return null
}


export default function SessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('week')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [circleSize, setCircleSize] = useState(96) // Larger circle for better visibility
  const [showResetModal, setShowResetModal] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      // Larger circles for better visibility
      setCircleSize(window.innerWidth >= 1024 ? 96 : 80)
    }
    
    // Set initial size
    handleResize()
    
    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [filter])

  const fetchSessions = async () => {
    console.log('📊 Fetching sessions...')
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.warn('⚠️ No authenticated user found')
        setIsAuthenticated(false)
        setLoading(false)
        return
      }

      setIsAuthenticated(true)

      let query = supabase
        .from('live_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (filter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('created_at', weekAgo.toISOString())
        console.log('📅 Filtering: Past week')
      } else if (filter === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        query = query.gte('created_at', monthAgo.toISOString())
        console.log('📅 Filtering: Past month')
      } else {
        console.log('📅 Filtering: All time')
      }

      const { data, error, status } = await query

      if (error && status !== 406) {
        throw error
      }

      const rows = (data ?? []) as Session[]
      console.log('✅ Loaded', rows.length, 'sessions')
      setSessions(rows)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error fetching sessions:', error)
      setIsAuthenticated(false)
      setLoading(false)
    }
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-slate-400'
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getScoreLabel = (score: number | null) => {
    if (!score) return 'Not graded'
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    return 'Needs improvement'
  }


  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Refresh the page to show sessions
      router.refresh()
      fetchSessions()
    } catch (error: any) {
      setAuthError(error.message)
      setAuthLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    setAuthError(null)
    
    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || 'https://door-iq.vercel.app'
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/sessions`
        }
      })

      if (error) throw error
    } catch (error: any) {
      setAuthError(error.message || 'Failed to initiate Google sign-in')
      setAuthLoading(false)
    }
  }

  const handleResetPassword = () => {
    setShowResetModal(true)
  }

  const handleCreateAccount = () => {
    router.push('/auth/signup')
  }

  const testimonials: Testimonial[] = [
    {
      avatarSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      name: 'Marcus Johnson',
      handle: '@marcustops',
      text: 'DoorIQ helped me increase my close rate by 40% in just 2 weeks. The AI training is incredible!',
    },
    {
      avatarSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      name: 'Sarah Chen',
      handle: '@sarahsells',
      text: 'Best sales training platform I\'ve used. The real-time feedback changed how I approach every door.',
    },
    {
      avatarSrc: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
      name: 'David Martinez',
      handle: '@davidclosing',
      text: 'The leaderboard keeps me motivated. I went from struggling to top performer in my team!',
    },
  ]

  const calculateStats = () => {
    if (sessions.length === 0) return { avgScore: 0, totalEarnings: 0, sessionsCount: 0 }
    
    const scores = sessions
      .filter(s => s.overall_score !== null)
      .map(s => s.overall_score as number)
    
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0
      
    const totalEarnings = sessions.reduce((sum, s) => sum + (s.virtual_earnings || 0), 0)
    
    return {
      avgScore,
      totalEarnings,
      sessionsCount: sessions.length
    }
  }

  const stats = calculateStats()

  // Group sessions by day
  const groupSessionsByDay = (sessions: Session[]) => {
    const grouped: { [key: string]: Session[] } = {}
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.created_at)
      const dayKey = startOfDay(sessionDate).toISOString()
      
      if (!grouped[dayKey]) {
        grouped[dayKey] = []
      }
      grouped[dayKey].push(session)
    })
    
    // Sort days in descending order (most recent first)
    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([dayKey, daySessions]) => ({
        date: new Date(dayKey),
        sessions: daySessions
      }))
  }

  const groupedSessions = groupSessionsByDay(sessions)

  const formatDayHeader = (date: Date) => {
    if (isToday(date)) {
      return 'Today'
    }
    if (isYesterday(date)) {
      return 'Yesterday'
    }
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  const openDeleteModal = (id: string) => {
    setSessionToDelete(id)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return
    
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/session?id=${sessionToDelete}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete))
      setDeleteModalOpen(false)
      setSessionToDelete(null)
    } catch (e) {
      console.error('Delete error:', e)
      alert('Error deleting session. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Show beautiful sign-in page if not authenticated
  if (isAuthenticated === false) {
    return (
      <>
        <SignInComponent
          title={
            <span className="font-light text-white tracking-tight">
              Sign in to view your <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Sessions</span>
            </span>
          }
          description="Access your training sessions, scores, progress, and compete on the leaderboard"
          heroImageSrc="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=2160&q=80"
          testimonials={testimonials}
          onSignIn={handleSignIn}
          onGoogleSignIn={handleGoogleSignIn}
          onResetPassword={handleResetPassword}
          onCreateAccount={handleCreateAccount}
          loading={authLoading}
          error={authError}
        />
        <PasswordResetModal 
          isOpen={showResetModal} 
          onClose={() => setShowResetModal(false)} 
        />
      </>
    )
  }


  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center">
        <AnimatedGrid />
        <div className="relative z-10 animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <AnimatedGrid />
      
      {/* Animated gradient orbs matching landing page */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, 20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, -25, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/15 via-purple-500/10 to-transparent rounded-full blur-[100px] pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-3 text-center"
        >
          <h1 className="font-space text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white font-bold leading-[1.1] uppercase mb-1">
            Training Sessions
          </h1>
          <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-300 drop-shadow-md font-space">
            Review your past sessions and{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
              track your improvement
            </span>
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8"
        >
          <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-xl hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white/70 font-space uppercase tracking-wider">Average Score</h3>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-4xl md:text-5xl font-bold text-white font-space mb-2">{stats.avgScore}%</p>
            <p className="text-sm text-white/60 font-sans">
              {stats.avgScore >= 80 ? 'Excellent performance' : 'Keep practicing!'}
            </p>
          </div>
          
          <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-xl hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white/70 font-space uppercase tracking-wider">Total Earnings</h3>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-4xl md:text-5xl font-bold text-white font-space mb-2">${stats.totalEarnings.toFixed(2)}</p>
            <p className="text-sm text-white/60 font-sans">Virtual cash earned</p>
          </div>
          
          <div className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-6 border border-white/5 shadow-xl hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-white/70 font-space uppercase tracking-wider">Sessions</h3>
              <Calendar className="w-5 h-5 text-pink-400" />
            </div>
            <p className="text-4xl md:text-5xl font-bold text-white font-space mb-2">{stats.sessionsCount}</p>
            <p className="text-sm text-white/60 font-sans">Completed sessions</p>
          </div>
        </motion.div>

        {/* Sessions List */}
        <div className="space-y-8">
          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/[0.02] backdrop-blur-xl rounded-2xl p-12 text-center border border-white/5 shadow-xl"
            >
              <p className="text-xl text-white/80 font-sans mb-6">No sessions found for this period</p>
              <Link
                href="/trainer/select-homeowner"
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transition-all shadow-lg font-space text-lg font-semibold"
              >
                Start Training
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
            </motion.div>
          ) : (
            groupedSessions.map((dayGroup, dayIndex) => {
              return (
                <div key={dayGroup.date.toISOString()} className="space-y-4">
                  {/* Day Header */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + (dayIndex * 0.1) }}
                    className="flex items-center gap-3 mb-2"
                  >
                    <h2 className="text-2xl md:text-3xl font-bold text-white font-space">
                      {formatDayHeader(dayGroup.date)}
                    </h2>
                    <span className="text-sm text-white/40 font-sans">
                      ({dayGroup.sessions.length} {dayGroup.sessions.length === 1 ? 'session' : 'sessions'})
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent"></div>
                  </motion.div>
                  
                  {/* Sessions for this day */}
                  <div className="space-y-4">
                    {dayGroup.sessions.map((session, sessionIndex) => {
                      const totalIndex = dayIndex * 100 + sessionIndex // Ensure unique delay values
                      const overallScore = session.overall_score || 0
                      const grade = calculateGrade(overallScore)
                      const criticalIssue = getFirstCriticalIssue(session)
                      const agentName = session.agent_name || 'Average Austin'
                      const agentMetadata = PERSONA_METADATA[agentName as AllowedAgentName]
                      const agentImage = agentMetadata?.bubble?.image || '/agents/default.png'
                      const variantKey = getAgentColorVariant(agentName)
                      const variantStyles = COLOR_VARIANTS[variantKey]
                      const imageStyle = getAgentImageStyle(agentName as AllowedAgentName)
                      const formattedDate = format(new Date(session.created_at), 'EEEE, MMMM d, yyyy')
                      const formattedTime = format(new Date(session.created_at), 'h:mm a')
                      const durationMinutes = session.duration_seconds ? Math.floor(session.duration_seconds / 60) : null
                      const durationSecs = session.duration_seconds ? session.duration_seconds % 60 : null
                      
                      return (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.4 + (dayIndex * 0.1) + (sessionIndex * 0.05) }}
                          className="group relative bg-white/[0.02] border-2 border-white/5 rounded-lg p-4 md:p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025] overflow-hidden"
                        >
                          {/* Subtle purple glow at bottom for depth */}
                          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div className="relative z-10">
                            {/* Header with date/time */}
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-white/60" />
                                  <p className="font-space text-white/80 text-sm font-bold">
                                    {formattedDate} at {formattedTime}
                                  </p>
                                </div>
                                {durationMinutes !== null && durationSecs !== null && (
                                  <p className="font-space text-white/60 text-xs font-semibold mt-0.5">
                                    Duration: {durationMinutes}m {durationSecs}s
                                  </p>
                                )}
                              </div>
                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  openDeleteModal(session.id as string)
                                }}
                                className="inline-flex items-center justify-center w-8 h-8 flex-shrink-0 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20 z-10 group-hover:border-red-500/40"
                                title="Delete session"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {/* Left: Agent Info */}
                              <div className="flex items-center gap-3">
                                <div className="relative h-20 w-20 md:h-24 md:w-24 flex-shrink-0">
                                  {/* Concentric circles */}
                                  {[0, 1, 2].map((i) => (
                                    <motion.div
                                      key={i}
                                      className={`absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent ${variantStyles.border[i]} ${variantStyles.gradient}`}
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
                                        className={`absolute inset-0 rounded-full mix-blend-screen bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace('from-', '')}/20%,transparent_70%)]`}
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
                                            alt={agentName}
                                            fill
                                            className="object-cover"
                                            style={{
                                              objectPosition: `${horizontal} ${vertical}`,
                                              transform: `scale(${scaleValue}) translateY(${translateY})`,
                                            }}
                                            sizes="96px"
                                          />
                                        )
                                      })()}
                                    </div>
                                  </motion.div>
                                </div>
                                <div>
                                  <p className="font-space text-white/60 text-xs uppercase tracking-wider mb-0.5 font-semibold">Practice with</p>
                                  <p className="font-space text-white text-lg md:text-xl font-bold tracking-tight">{agentName}</p>
                                </div>
                              </div>

                              {/* Right: Score and Grade Badge */}
                              <div className="flex items-center justify-center md:justify-end gap-3">
                                <div className="flex items-baseline gap-1.5">
                                  <div className="font-space text-4xl md:text-5xl text-white font-bold tracking-tight">
                                    {overallScore}
                                  </div>
                                  <p className="font-space text-white/60 text-base md:text-lg font-bold">/100</p>
                                </div>
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center transition-colors group-hover:bg-white/[0.08] group-hover:border-white/20">
                                  <span className={`font-space text-2xl md:text-3xl font-bold tracking-tight ${grade.color}`}>
                                    {grade.letter}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push(`/analytics/${session.id}`)}
                                className="group/btn flex-1 bg-white text-black font-bold rounded-md text-sm md:text-base tracking-tight hover:bg-white/95 transition-all flex items-center justify-center gap-2 py-2.5 px-4 font-space"
                              >
                                View Full Analysis
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push('/trainer')}
                                className="group/btn flex-1 bg-white text-black font-bold rounded-md text-sm md:text-base tracking-tight hover:bg-white/95 transition-all flex items-center justify-center gap-2 py-2.5 px-4 font-space"
                              >
                                Practice Again
                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                              </motion.button>
                            </div>

                            {/* Critical Issue Section - Only show first one */}
                            {criticalIssue && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="pt-4 border-t border-white/10"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="font-space text-white/90 text-sm md:text-base font-bold tracking-tight">Critical Issues:</span>
                                  <div className="flex items-center gap-2 font-space text-white/80 text-sm md:text-base font-bold">
                                    {criticalIssue.severity === 'error' ? (
                                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                    ) : (
                                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                    )}
                                    <span>{criticalIssue.text}</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setSessionToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Session?"
        message="Are you sure you want to delete this session? This action cannot be undone and all analytics data will be permanently removed."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}

