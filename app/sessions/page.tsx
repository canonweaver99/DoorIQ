'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import Link from 'next/link'
import { Calendar, Clock, TrendingUp, AlertCircle, ChevronRight, DollarSign, Mail, Lock, User } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

type Session = Database['public']['Tables']['live_sessions']['Row']

export default function SessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('week')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  
  // Auth form state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)

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
    
    return insights
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
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

  // Show sign-in/signup form if not authenticated
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#07030f] via-[#0e0b1f] to-[#150c28] flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400 mb-2">ACCOUNT</p>
            <h1 className="text-3xl font-semibold text-white mb-3">DoorIQ Control Center</h1>
          </div>

          {/* Main Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-8 shadow-[0_8px_32px_rgba(109,40,217,0.15)]">
            <p className="text-sm font-semibold text-white mb-3">
              {authMode === 'signin' ? 'Sign In to View Sessions' : 'Create Your Account'}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {authMode === 'signin' 
                ? 'Access your training sessions, scores, and progress.' 
                : 'Join DoorIQ to track your progress and compete on the leaderboard.'}
            </p>

            {/* Google Sign In Button */}
            <div className="space-y-3 mb-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={authLoading}
                type="button"
                className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <>Loading...</>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {authMode === 'signin' ? 'Sign In with Google' : 'Sign Up with Google'}
                  </>
                )}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/[0.06] px-2 text-slate-400 tracking-[0.2em]">Or</span>
                </div>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={authMode === 'signin' ? handleLogin : handleSignUp} className="w-full space-y-3">
              {authMode === 'signup' && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/40 bg-white/5 text-white placeholder-slate-400 text-sm transition"
                    placeholder="Full name"
                    autoComplete="name"
                  />
                </div>
              )}
              
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/40 bg-white/5 text-white placeholder-slate-400 text-sm transition"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
              
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/40 bg-white/5 text-white placeholder-slate-400 text-sm transition"
                  placeholder={authMode === 'signup' ? 'Create a password' : '••••••••'}
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                />
              </div>

              {authMode === 'signup' && (
                <p className="text-xs text-slate-400">Minimum 6 characters</p>
              )}

              {authError && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? (authMode === 'signin' ? 'Signing in...' : 'Creating account...') : (authMode === 'signin' ? 'Sign In with Email' : 'Create Account')}
              </button>
            </form>

            {/* Toggle between sign in and sign up */}
            <div className="mt-6 text-center">
              <span className="text-xs text-slate-400">
                {authMode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => {
                    setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
                    setAuthError(null)
                  }}
                  className="font-medium text-purple-400 hover:text-purple-300 transition"
                >
                  {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
                </button>
              </span>
            </div>

            <div className="mt-4 text-center">
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-slate-300 transition"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
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
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-4 drop-shadow-lg">Your Training Sessions</h1>
          <p className="text-xl text-slate-400 drop-shadow-md">Review your past sessions and track your improvement</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Average Score</h3>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.avgScore}%</p>
            <p className="text-sm text-slate-400 mt-1">
              {stats.avgScore >= 80 ? 'Excellent performance' : 'Keep practicing!'}
            </p>
          </div>
          
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Total Earnings</h3>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-white">${stats.totalEarnings.toFixed(2)}</p>
            <p className="text-sm text-slate-400 mt-1">Virtual cash earned</p>
          </div>
          
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Sessions</h3>
              <Calendar className="w-5 h-5 text-pink-400" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.sessionsCount}</p>
            <p className="text-sm text-slate-400 mt-1">Completed this {filter}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-4 mb-6">
          {(['week', 'month', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setFilter(period)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                filter === period
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/50'
                  : 'bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20'
              }`}
            >
              {period === 'week' ? 'Past Week' : period === 'month' ? 'Past Month' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 text-center border border-slate-700 shadow-xl">
              <p className="text-white/70">No sessions found for this period</p>
              <Link
                href="/trainer/select-homeowner"
                className="inline-flex items-center mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg"
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
                  className="bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700 hover:border-slate-600 transition-colors shadow-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {session.agent_name || 'Training Session'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {format(new Date(session.created_at), 'MMM d, yyyy')}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {session.duration_seconds ? `${Math.round(session.duration_seconds / 60)} min` : 'N/A'}
                        </span>
                        {session.virtual_earnings !== null && session.virtual_earnings > 0 && (
                          <span className="flex items-center text-green-500">
                            <DollarSign className="w-4 h-4 mr-1" />
                            ${session.virtual_earnings.toFixed(2)} earned
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-slate-400">Overall Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(session.overall_score)}`}>
                          {session.overall_score || '--'}%
                        </p>
                        <p className={`text-xs ${getScoreColor(session.overall_score)}`}>
                          {getScoreLabel(session.overall_score)}
                        </p>
                      </div>
                      
                      <Link
                        href={`/analytics/${session.id}`}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 transition-all border border-purple-500/20"
                      >
                        View Details
                        <ChevronRight className="ml-2 w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                  
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Rapport</p>
                      <p className={`text-lg font-semibold ${getScoreColor(session.rapport_score)}`}>
                        {session.rapport_score || '--'}%
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Objection Handling</p>
                      <p className={`text-lg font-semibold ${getScoreColor(session.objection_handling_score)}`}>
                        {session.objection_handling_score || '--'}%
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Safety</p>
                      <p className={`text-lg font-semibold ${getScoreColor(session.safety_score ?? null)}`}>
                        {(session.safety_score ?? '--') as any}%
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">Closing</p>
                      <p className={`text-lg font-semibold ${getScoreColor((session.close_effectiveness_score ?? (session as any).close_score ?? null))}`}>
                        {(session.close_effectiveness_score ?? (session as any).close_score ?? '--') as any}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Key Insights */}
                  {insights.length > 0 && (
                    <div className="border-t border-slate-700 pt-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Key Insights</h4>
                      <div className="space-y-2">
                        {insights.map((insight, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start space-x-2 text-sm ${
                              insight.type === 'success' ? 'text-green-400' : 'text-yellow-400'
                            }`}
                          >
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{insight.text}</span>
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
    </div>
  )
}
