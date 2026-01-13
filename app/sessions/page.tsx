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
import { cn } from '@/lib/utils'
import { SessionTranscriptPreview } from '@/components/dashboard/SessionTranscriptPreview'

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
        .select('*, full_transcript')
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
    router.push('/landing/pricing')
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
        {/* Mobile Loading */}
        <div className="md:hidden relative z-10 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
          <p className="text-white/60 text-sm font-space">Loading sessions...</p>
        </div>
        {/* Desktop Loading */}
        <div className="hidden md:flex relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
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

      {/* Mobile Layout */}
      <div className="md:hidden relative z-10 w-full px-4 py-6 pb-24">
        {/* Mobile Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4 text-center"
        >
          <h1 className="font-space text-2xl tracking-tight text-white font-bold leading-tight mb-1">
            Training Sessions
          </h1>
          <p className="text-sm text-white/70 font-space">
            Review your past sessions
          </p>
        </motion.div>

        {/* Mobile Filter Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide pb-2"
        >
          {(['week', 'month', 'all'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={cn(
                "px-4 py-2 rounded-2xl text-sm font-medium transition-all font-space whitespace-nowrap",
                filter === filterOption
                  ? "bg-white/10 text-white shadow-lg"
                  : "bg-white/[0.05] text-white/70 border border-white/10"
              )}
            >
              {filterOption === 'week' && 'Past Week'}
              {filterOption === 'month' && 'Past Month'}
              {filterOption === 'all' && 'All Time'}
            </button>
          ))}
        </motion.div>

        {/* Mobile Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-slate-800/60 rounded-3xl p-4 shadow-xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-medium text-white/70 font-space uppercase tracking-wider">Score</h3>
              <TrendingUp className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            </div>
            <p className="text-2xl font-bold text-white font-space mb-1">{stats.avgScore}%</p>
            <p className="text-[10px] text-white/60 font-sans line-clamp-1">
              {stats.avgScore >= 80 ? 'Excellent' : 'Keep going'}
            </p>
          </div>
          
          <div className="bg-slate-800/60 rounded-3xl p-4 shadow-xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-medium text-white/70 font-space uppercase tracking-wider">Earnings</h3>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            </div>
            <p className="text-2xl font-bold text-white font-space mb-1">${stats.totalEarnings.toFixed(0)}</p>
            <p className="text-[10px] text-white/60 font-sans">Virtual cash</p>
          </div>
          
          <div className="bg-slate-800/60 rounded-3xl p-4 shadow-xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-medium text-white/70 font-space uppercase tracking-wider">Total</h3>
              <Calendar className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
            </div>
            <p className="text-2xl font-bold text-white font-space mb-1">{stats.sessionsCount}</p>
            <p className="text-[10px] text-white/60 font-sans">Sessions</p>
          </div>
        </motion.div>

        {/* Mobile Sessions List */}
        <div className="space-y-6">
          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-slate-800/60 rounded-3xl p-8 text-center border border-slate-700/50 shadow-xl backdrop-blur-sm"
            >
              <p className="text-sm text-white/80 font-sans mb-4">No sessions found for this period</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/trainer/select-homeowner')}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl shadow-xl font-space text-sm font-semibold"
              >
                Start Training
                <ChevronRight className="ml-2 w-4 h-4" />
              </motion.button>
            </motion.div>
          ) : (
            groupedSessions.map((dayGroup, dayIndex) => {
              return (
                <div key={dayGroup.date.toISOString()} className="space-y-3">
                  {/* Mobile Day Header */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + (dayIndex * 0.05) }}
                    className="flex items-center gap-2 mb-2"
                  >
                    <h2 className="text-lg font-bold text-white font-space">
                      {formatDayHeader(dayGroup.date)}
                    </h2>
                    <span className="text-xs text-white/40 font-sans">
                      ({dayGroup.sessions.length})
                    </span>
                  </motion.div>
                  
                  {/* Mobile Sessions for this day */}
                  <div className="space-y-3">
                    {dayGroup.sessions.map((session, sessionIndex) => {
                      const overallScore = session.overall_score || 0
                      const grade = calculateGrade(overallScore)
                      const criticalIssue = getFirstCriticalIssue(session)
                      const agentName = session.agent_name || 'Average Austin'
                      const agentMetadata = PERSONA_METADATA[agentName as AllowedAgentName]
                      const agentImage = agentMetadata?.bubble?.image || '/agents/default.png'
                      const variantKey = getAgentColorVariant(agentName)
                      const variantStyles = COLOR_VARIANTS[variantKey]
                      const imageStyle = getAgentImageStyle(agentName as AllowedAgentName)
                      const formattedTime = format(new Date(session.created_at), 'h:mm a')
                      const durationMinutes = session.duration_seconds ? Math.floor(session.duration_seconds / 60) : null
                      const durationSecs = session.duration_seconds ? session.duration_seconds % 60 : null
                      
                      return (
                        <motion.div
                          key={session.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 + (dayIndex * 0.05) + (sessionIndex * 0.03) }}
                          className="bg-slate-800/60 rounded-3xl p-4 shadow-xl border border-slate-700/50 backdrop-blur-sm"
                        >
                          {/* Mobile Session Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Clock className="w-3.5 h-3.5 text-white/60 flex-shrink-0" />
                                <p className="font-space text-white/80 text-xs font-bold">
                                  {formattedTime}
                                </p>
                              </div>
                              {durationMinutes !== null && durationSecs !== null && (
                                <p className="font-space text-white/60 text-[10px] font-semibold">
                                  {durationMinutes}m {durationSecs}s
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                openDeleteModal(session.id as string)
                              }}
                              className="inline-flex items-center justify-center w-7 h-7 flex-shrink-0 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/20"
                              title="Delete session"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Mobile Agent and Score */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="relative h-12 w-12 flex-shrink-0">
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
                                        `bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace('from-', '')}/20%,transparent_70%)]`
                                      )}
                                    />
                                  </motion.div>
                                ))}
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
                                  <div className="relative w-full h-full rounded-full overflow-hidden shadow-xl">
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
                                          sizes="48px"
                                        />
                                      )
                                    })()}
                                  </div>
                                </motion.div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-space text-white/60 text-[10px] uppercase tracking-wider mb-0.5 font-semibold">Practice with</p>
                                <p className="font-space text-white text-sm font-bold tracking-tight truncate">{agentName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex items-baseline gap-1">
                                <div className="font-space text-2xl text-white font-bold tracking-tight">
                                  {overallScore}
                                </div>
                                <p className="font-space text-white/60 text-xs font-bold">/100</p>
                              </div>
                              <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/[0.05] flex items-center justify-center flex-shrink-0">
                                <span className={cn("font-space text-lg font-bold tracking-tight", grade.color)}>
                                  {grade.letter}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Transcript Preview */}
                          {session.full_transcript && Array.isArray(session.full_transcript) && session.full_transcript.length > 0 && (
                            <div className="mb-3">
                              <SessionTranscriptPreview
                                transcript={session.full_transcript}
                                sessionId={session.id}
                                agentName={agentName}
                                maxMessages={3}
                              />
                            </div>
                          )}

                          {/* Mobile Action Buttons */}
                          <div className="flex flex-col gap-2 mb-3">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => router.push(`/analytics/${session.id}`)}
                              className="w-full bg-gray-300 text-black font-bold rounded-2xl text-sm tracking-tight hover:bg-gray-400 transition-all flex items-center justify-center gap-2 py-2.5 px-4 font-space min-h-[44px]"
                            >
                              <span>View Full Analysis</span>
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => {
                                const agentId = agentMetadata?.card?.elevenAgentId
                                if (agentId) {
                                  router.push(`/trainer?agent=${encodeURIComponent(agentId)}`)
                                } else {
                                  router.push('/trainer')
                                }
                              }}
                              className="w-full bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white font-bold rounded-2xl text-sm tracking-tight transition-all flex items-center justify-center gap-2 py-2.5 px-4 font-space min-h-[44px] shadow-md shadow-purple-500/15"
                            >
                              <span>Practice Again</span>
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </div>

                          {/* Mobile Critical Issue */}
                          {criticalIssue && (
                            <div className="pt-3 border-t border-white/10">
                              <div className="flex items-start gap-2">
                                {criticalIssue.severity === 'error' ? (
                                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                )}
                                <span className="font-space text-white/80 text-xs font-bold break-words">{criticalIssue.text}</span>
                              </div>
                            </div>
                          )}
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

      {/* Desktop Layout */}
      <div className="hidden md:block relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pt-20 sm:pt-24 md:pt-28 lg:pt-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 sm:mb-6 md:mb-8 text-center px-2"
        >
          <h1 className="font-space text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl tracking-tight text-white font-bold leading-[1.1] uppercase mb-2 sm:mb-3">
            Training Sessions
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-slate-300 drop-shadow-md font-space leading-tight">
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
          className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8"
        >
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-slate-700/50 shadow-xl hover:border-slate-600/60 hover:bg-slate-800/80 transition-colors">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-white/70 font-space uppercase tracking-wider">Average Score</h3>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
            </div>
            <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-space mb-1 sm:mb-2">{stats.avgScore}%</p>
            <p className="text-xs sm:text-sm text-white/60 font-sans">
              {stats.avgScore >= 80 ? 'Excellent performance' : 'Keep practicing!'}
            </p>
          </div>
          
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-slate-700/50 shadow-xl hover:border-slate-600/60 hover:bg-slate-800/80 transition-colors">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-white/70 font-space uppercase tracking-wider">Total Earnings</h3>
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
            </div>
            <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-space mb-1 sm:mb-2">${stats.totalEarnings.toFixed(2)}</p>
            <p className="text-xs sm:text-sm text-white/60 font-sans">Virtual cash earned</p>
          </div>
          
          <div className="bg-slate-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border-2 border-slate-700/50 shadow-xl hover:border-slate-600/60 hover:bg-slate-800/80 transition-colors">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="text-xs sm:text-sm font-medium text-white/70 font-space uppercase tracking-wider">Sessions</h3>
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 flex-shrink-0" />
            </div>
            <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-space mb-1 sm:mb-2">{stats.sessionsCount}</p>
            <p className="text-xs sm:text-sm text-white/60 font-sans">Completed sessions</p>
          </div>
        </motion.div>

        {/* Sessions List */}
        <div className="space-y-8">
          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-slate-800/60 backdrop-blur-xl rounded-xl sm:rounded-2xl p-8 sm:p-10 md:p-12 text-center border border-slate-700/50 shadow-xl"
            >
              <p className="text-base sm:text-lg md:text-xl text-white/80 font-sans mb-4 sm:mb-6">No sessions found for this period</p>
              <Link
                href="/trainer/select-homeowner"
                className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transition-all shadow-lg font-space text-sm sm:text-base md:text-lg font-semibold"
              >
                Start Training
                <ChevronRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
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
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-space">
                        {formatDayHeader(dayGroup.date)}
                      </h2>
                      <span className="text-xs sm:text-sm text-white/40 font-sans">
                        ({dayGroup.sessions.length} {dayGroup.sessions.length === 1 ? 'session' : 'sessions'})
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent hidden sm:block"></div>
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
                          className="group relative bg-slate-800/60 border-2 border-slate-700/50 rounded-lg p-3 sm:p-4 md:p-5 transition-all duration-300 hover:border-slate-600/60 hover:bg-slate-800/80 overflow-hidden"
                        >
                          {/* Subtle purple glow at bottom for depth */}
                          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div className="relative z-10">
                            {/* Header with date/time */}
                            <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/60 flex-shrink-0" />
                                  <p className="font-space text-white/80 text-xs sm:text-sm font-bold break-words">
                                    {formattedDate} at {formattedTime}
                                  </p>
                                </div>
                                {durationMinutes !== null && durationSecs !== null && (
                                  <p className="font-space text-white/60 text-xs font-semibold mt-0.5 sm:mt-1">
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
                                className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20 z-10 group-hover:border-red-500/40"
                                title="Delete session"
                              >
                                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>

                            {/* Main Content - Flex Layout */}
                            <div className="flex items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                              {/* Left: Agent Info */}
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <div className="relative h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 flex-shrink-0">
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
                                <div className="min-w-0 flex-1">
                                  <p className="font-space text-white/60 text-xs uppercase tracking-wider mb-0.5 font-semibold">Practice with</p>
                                  <p className="font-space text-white text-base sm:text-lg md:text-xl font-bold tracking-tight truncate">{agentName}</p>
                                </div>
                              </div>

                              {/* Right: Score and Grade Badge */}
                              <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink-0">
                                <div className="flex items-baseline gap-1 sm:gap-1.5">
                                  <div className="font-space text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-tight">
                                    {overallScore}
                                  </div>
                                  <p className="font-space text-white/60 text-sm sm:text-base md:text-lg font-bold">/100</p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center transition-colors group-hover:bg-white/[0.08] group-hover:border-white/20 flex-shrink-0">
                                  <span className={`font-space text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${grade.color}`}>
                                    {grade.letter}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push(`/analytics/${session.id}`)}
                                className="group/btn flex-1 bg-gray-300 text-black font-bold rounded-md text-xs sm:text-sm md:text-base tracking-tight hover:bg-gray-400 transition-all flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 font-space"
                              >
                                <span className="truncate">View Full Analysis</span>
                                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:translate-x-0.5 transition-transform flex-shrink-0" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => {
                                  const agentId = agentMetadata?.card?.elevenAgentId
                                  if (agentId) {
                                    router.push(`/trainer?agent=${encodeURIComponent(agentId)}`)
                                  } else {
                                    router.push('/trainer')
                                  }
                                }}
                                className="group/btn flex-1 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white font-bold rounded-md text-xs sm:text-sm md:text-base tracking-tight transition-all flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 sm:px-4 font-space shadow-md shadow-purple-500/15"
                              >
                                <span className="truncate">Practice Again</span>
                                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:translate-x-0.5 transition-transform flex-shrink-0" />
                              </motion.button>
                            </div>

                            {/* Transcript Preview */}
                            {session.full_transcript && Array.isArray(session.full_transcript) && session.full_transcript.length > 0 && (
                              <div className="mb-3 sm:mb-4">
                                <SessionTranscriptPreview
                                  transcript={session.full_transcript}
                                  sessionId={session.id}
                                  agentName={agentName}
                                  maxMessages={3}
                                  keyMoments={session.key_moments}
                                />
                              </div>
                            )}

                            {/* Critical Issue Section - Only show first one */}
                            {criticalIssue && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="pt-3 sm:pt-4 border-t border-white/10"
                              >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                                  <span className="font-space text-white/90 text-base sm:text-sm md:text-base font-bold tracking-tight whitespace-nowrap">Critical Issues:</span>
                                  <div className="flex items-start sm:items-center gap-2 font-space text-white/80 text-base sm:text-sm md:text-base font-bold">
                                    {criticalIssue.severity === 'error' ? (
                                      <XCircle className="w-5 h-5 sm:w-4 sm:h-4 text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                                    ) : (
                                      <AlertTriangle className="w-5 h-5 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                                    )}
                                    <span className="break-words">{criticalIssue.text}</span>
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

