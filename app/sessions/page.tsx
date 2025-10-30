'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, TrendingUp, AlertCircle, ChevronRight, DollarSign, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { SignInComponent, Testimonial } from '@/components/ui/sign-in'
import CircularProgress from '@/components/ui/CircularProgress'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import PasswordResetModal from '@/components/auth/PasswordResetModal'
import { getAgentImageStyle } from '@/lib/agents/imageStyles'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'

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

// Agent image mapping - same as trainer page
const getAgentImage = (agentName: string | null): string => {
  if (!agentName) return '/agents/default.png'
  
  const agentImageMap: Record<string, string> = {
    'Austin': '/Austin Boss.png',
    'No Problem Nancy': '/No Problem Nancy.png',
    'Already Got It Alan': '/Already got it Alan landscape.png',
    'Not Interested Nick': '/Not Interested Nick.png',
    'DIY Dave': '/DIY DAVE.png',
    'Too Expensive Tim': '/Too Expensive Tim.png',
    'Spouse Check Susan': '/Spouse Check Susan.png',
    'Busy Beth': '/Busy Beth.png',
    'Renter Randy': '/Renter Randy.png',
    'Skeptical Sam': '/Skeptical Sam.png',
    'Just Treated Jerry': '/Just Treated Jerry.png',
    'Think About It Tina': '/Think About It Tina.png'
  }
  
  return agentImageMap[agentName] || '/agents/default.png'
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

  const getKeyInsights = (session: Session) => {
    const insights = []
    
    // Check for low scores
    if (session.rapport_score && session.rapport_score < 70) {
      insights.push({ type: 'warning', text: 'Work on building rapport early in the conversation' })
    }
    if (session.objection_handling_score && session.objection_handling_score < 70) {
      insights.push({ type: 'warning', text: 'Practice handling common objections more confidently' })
    }
    const closing = session.close_effectiveness_score ?? (session as any).close_score ?? null
    if (closing && closing < 70) {
      insights.push({ type: 'warning', text: 'Focus on closing techniques and asking for the sale' })
    }
    
    // Check for high scores
    const safety = session.safety_score ?? null
    if (safety && safety >= 80) {
      insights.push({ type: 'success', text: 'Great job addressing safety concerns!' })
    }
    if (session.overall_score && session.overall_score >= 80) {
      insights.push({ type: 'success', text: 'Excellent overall performance!' })
    }
    
    // Return only the first insight
    return insights.slice(0, 1)
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
      <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] py-4 lg:py-6 xl:py-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4 pt-3">
          <h1 className="text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-2 drop-shadow-lg leading-[1.15] pb-0.5">Your Training Sessions</h1>
          <p className="text-sm lg:text-base text-slate-400 drop-shadow-md">Review your past sessions and track your improvement</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 lg:gap-4 xl:gap-5 mb-4">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-3 lg:p-3.5 xl:p-4 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs lg:text-sm font-medium text-slate-400">Average Score</h3>
              <TrendingUp className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-purple-400" />
            </div>
            <p className="text-lg lg:text-xl font-bold text-white">{stats.avgScore}%</p>
            <p className="text-[11px] lg:text-xs text-slate-400 mt-0.5 lg:mt-1">
              {stats.avgScore >= 80 ? 'Excellent performance' : 'Keep practicing!'}
            </p>
          </div>
          
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-3 lg:p-3.5 xl:p-4 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs lg:text-sm font-medium text-slate-400">Total Earnings</h3>
              <DollarSign className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" />
            </div>
            <p className="text-lg lg:text-xl font-bold text-white">${stats.totalEarnings.toFixed(2)}</p>
            <p className="text-[11px] lg:text-xs text-slate-400 mt-0.5 lg:mt-1">Virtual cash earned</p>
          </div>
          
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-3 lg:p-3.5 xl:p-4 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs lg:text-sm font-medium text-slate-400">Sessions</h3>
              <Calendar className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-pink-400" />
            </div>
            <p className="text-lg lg:text-xl font-bold text-white">{stats.sessionsCount}</p>
            <p className="text-[11px] lg:text-xs text-slate-400 mt-0.5 lg:mt-1">Completed this {filter}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2.5 lg:space-x-3.5 mb-4">
          {(['week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setFilter(period)}
              className={`px-3 lg:px-4 py-1.5 lg:py-1.5 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 ${
                filter === period
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20'
              }`}
            >
              {period === 'week' ? 'Past Week' : period === 'month' ? 'Past Month' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        <div className="space-y-2 lg:space-y-3">
          {sessions.length === 0 ? (
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 lg:p-8 text-center border border-slate-700 shadow-xl">
              <p className="text-white/70">No sessions found for this period</p>
              <Link
                href="/trainer/select-homeowner"
                className="inline-flex items-center mt-4 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-500 hover:to-purple-500 transition-all shadow-lg"
              >
                Start Training
                <ChevronRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          ) : (
            sessions.map((session) => {
              const insights = getKeyInsights(session)
              
              return (
                <div
                  key={session.id}
                  className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-3 lg:p-3.5 xl:p-4 border border-slate-700 hover:border-slate-600 transition-colors shadow-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 flex items-start gap-2 lg:gap-3">
                      {/* Delete button - moved to left */}
                      <button
                        onClick={() => openDeleteModal(session.id as string)}
                        className="inline-flex items-center justify-center w-6 h-6 lg:w-7 lg:h-7 mt-0.5 lg:mt-1 bg-red-500/10 text-red-300 rounded-lg hover:bg-red-500/20 transition-all border border-red-500/20"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                      
                      <div className="flex-1 flex items-start gap-3">
                        {/* Agent Avatar with Gradient Rings */}
                        <div 
                          className="relative flex-shrink-0"
                          style={{ width: `${circleSize}px`, height: `${circleSize}px` }}
                        >
                          {(() => {
                            const colorVariant = getAgentColorVariant(session.agent_name)
                            const variantStyles = COLOR_VARIANTS[colorVariant]
                            return (
                              <>
                                {/* Animated gradient rings */}
                                {[0, 1, 2].map((i) => (
                                  <div
                                    key={i}
                                    className={`absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent ${variantStyles.border[i]} ${variantStyles.gradient}`}
                                    style={{
                                      animation: `spin 8s linear infinite`,
                                      opacity: 0.6 - (i * 0.15)
                                    }}
                                  >
                                    <div
                                      className={`absolute inset-0 rounded-full mix-blend-screen bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace('from-', '')}/20%,transparent_70%)]`}
                                    />
                                  </div>
                                ))}
                                {/* Profile Image */}
                                <div className="absolute inset-[2px] rounded-full overflow-hidden">
                                  <Image
                                    src={getAgentImage(session.agent_name)}
                                    alt={session.agent_name || 'Agent'}
                                    fill
                                    className="object-cover"
                                    style={getAgentImageStyle(session.agent_name)}
                                    sizes={`${circleSize}px`}
                                  />
                                </div>
                              </>
                            )
                          })()}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-base lg:text-lg font-bold text-white mb-1 lg:mb-1.5">
                            {session.agent_name || 'Training Session'}
                          </h3>
                          <div className="flex items-center space-x-3 lg:space-x-4 text-xs lg:text-sm text-slate-400">
                            <span className="flex items-center">
                              <Calendar className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1" />
                              {format(new Date(session.created_at), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1" />
                              {session.duration_seconds ? `${Math.round(session.duration_seconds / 60)} min` : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 md:mt-0 flex items-center gap-3 lg:gap-3.5 xl:gap-4">
                      {/* Earnings - Always Show */}
                      <div className="text-right">
                        <p className="text-[10px] lg:text-[11px] text-slate-400 mb-0.5 lg:mb-1">Earned</p>
                        <p className={`text-lg lg:text-xl font-bold ${
                          session.virtual_earnings && session.virtual_earnings > 0 
                            ? 'text-emerald-400' 
                            : 'text-slate-500'
                        }`}>
                          ${session.virtual_earnings ? session.virtual_earnings.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      
                      {/* Overall Score - Responsive Circular Progress */}
                      <div className="text-right">
                        <CircularProgress 
                          percentage={session.overall_score || 0}
                          size={circleSize}
                          strokeWidth={6}
                        />
                      </div>
                      
                      <Link
                        href={`/analytics/${session.id}`}
                        className="inline-flex items-center px-2.5 lg:px-3 py-1.5 lg:py-1.5 text-xs lg:text-sm bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-300 rounded-lg hover:from-purple-600/30 hover:to-indigo-600/30 transition-all border border-purple-500/20"
                      >
                        View Details
                        <ChevronRight className="ml-1 lg:ml-1 w-3.5 h-3.5 lg:w-3.5 lg:h-3.5" />
                      </Link>
                    </div>
                  </div>
                  
                  {/* Key Insights - Larger and more readable */}
                  {insights.length > 0 && (
                    <div className="pt-2.5 lg:pt-3 mt-2.5 lg:mt-3 border-t border-slate-700/50">
                      <div className="space-y-0.5 lg:space-y-1">
                        {insights.map((insight, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start space-x-2 lg:space-x-2.5 text-sm lg:text-base font-semibold ${
                              insight.type === 'success' ? 'text-green-400' : 'text-yellow-400'
                            }`}
                          >
                            <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 flex-shrink-0" />
                            <span className="leading-snug">{insight.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
