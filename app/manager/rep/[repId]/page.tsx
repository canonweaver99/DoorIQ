'use client'

import { useState, useEffect, use } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, User, TrendingUp, Calendar, Target, Award, BarChart3, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useHaptic } from '@/hooks/useHaptic'
import { IOSCard } from '@/components/ui/ios-card'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface RepProfile {
  id: string
  full_name: string
  email: string
  role: string
  virtual_earnings: number
  created_at: string
  rep_id: string
  avatar_url?: string
}

interface SessionData {
  id: string
  overall_score: number
  virtual_earnings: number
  created_at: string
  agent_name: string
  duration_seconds: number
  sale_closed: boolean
}

interface RepStats {
  totalSessions: number
  averageScore: number
  closePercentage?: number
  totalEarnings: number
  bestScore: number
  recentTrend: number
  activeDays: number
  totalCallTime: number
}

interface SkillStats {
  overall: { current: number; previous: number }
  rapport: { current: number; previous: number }
  discovery: { current: number; previous: number }
  objection: { current: number; previous: number }
  closing: { current: number; previous: number }
}

export default function RepProfilePage({ params }: { params: Promise<{ repId: string }> }) {
  const resolvedParams = use(params)
  const isMobile = useIsMobile()
  const { trigger } = useHaptic()
  const [rep, setRep] = useState<RepProfile | null>(null)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [stats, setStats] = useState<RepStats | null>(null)
  const [skillStats, setSkillStats] = useState<SkillStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month')
  const supabase = createClient()

  const handleRefresh = async () => {
    setLoading(true)
    await loadRepData()
  }

  useEffect(() => {
    loadRepData()
  }, [resolvedParams.repId])

  const loadRepData = async () => {
    if (!supabase) return
    
    try {
      // Use API endpoint for secure, server-side verification
      const response = await fetch(`/api/manager/rep/${resolvedParams.repId}`)
      
      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', error)
        
        if (response.status === 403) {
          // Access denied - redirect to manager panel
          window.location.href = '/manager?error=access_denied'
          return
        } else if (response.status === 404) {
          // Rep not found
          console.error('Rep not found')
          return
        }
        throw new Error(error.error || 'Failed to load rep data')
      }

      const data = await response.json()
      
      setRep(data.rep)
      setSessions(data.sessions || [])
      setStats(data.stats)
      setSkillStats(data.skillStats || {
        overall: { current: 0, previous: 0 },
        rapport: { current: 0, previous: 0 },
        discovery: { current: 0, previous: 0 },
        objection: { current: 0, previous: 0 },
        closing: { current: 0, previous: 0 }
      })

    } catch (error) {
      console.error('Error loading rep data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (!score || isNaN(score)) return 'text-slate-400'
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0m'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!rep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Rep Not Found</h1>
          <Link 
            href="/manager"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            ← Back to Manager Panel
          </Link>
        </div>
      </div>
    )
  }

  // Prepare chart data for recent sessions - always show at least 10 data points with zeros
  const chartData = sessions && sessions.length > 0 
    ? sessions.slice(0, 10).reverse().map((session, index) => ({
        session: `#${sessions.length - index}`,
        score: session.overall_score || 0,
        earnings: session.virtual_earnings || 0,
        date: new Date(session.created_at).toLocaleDateString()
      }))
    : Array.from({ length: 10 }, (_, i) => ({
        session: `#${i + 1}`,
        score: 0,
        earnings: 0,
        date: ''
      }))

  return (
    <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
      <div 
        className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e]"
        style={{
          paddingTop: isMobile ? `calc(env(safe-area-inset-top) + 1rem)` : '3rem',
          paddingBottom: isMobile ? `calc(env(safe-area-inset-bottom) + 1rem)` : '3rem',
          paddingLeft: isMobile ? '1rem' : '1.5rem',
          paddingRight: isMobile ? '1rem' : '1.5rem',
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className={`flex items-center justify-between mb-6 ${isMobile ? 'mb-4' : 'mb-8'}`}>
            <div className="flex items-center gap-4">
              <Link
                href="/manager"
                onClick={() => trigger('light')}
                className={`flex items-center gap-2 text-slate-400 hover:text-white transition-colors min-h-[44px] ${isMobile ? 'text-sm' : ''}`}
              >
                <ArrowLeft className={isMobile ? "w-5 h-5" : "w-4 h-4"} />
                {isMobile ? 'Back' : 'Back to Manager Panel'}
              </Link>
            </div>
          </div>

          {/* Rep Profile Header - READ-ONLY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${isMobile ? 'bg-transparent' : 'bg-[#1e1e30] border border-white/10'} rounded-2xl ${isMobile ? 'p-4' : 'p-6'} mb-6`}
          >
            <div className={`flex items-center ${isMobile ? 'flex-col gap-4' : 'justify-between'}`}>
              <div className={`flex items-center ${isMobile ? 'flex-col text-center' : 'gap-6'} w-full`}>
                {rep.avatar_url ? (
                  <img 
                    src={rep.avatar_url} 
                    alt={rep.full_name}
                    className={`${isMobile ? 'w-16 h-16' : 'w-20 h-20'} rounded-2xl object-cover`}
                  />
                ) : (
                  <div className={`${isMobile ? 'w-16 h-16 text-xl' : 'w-20 h-20 text-2xl'} rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold`}>
                    {rep.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <div className={`flex-1 ${isMobile ? 'text-center' : ''}`}>
                  <h1 className={`font-bold text-white ${isMobile ? 'text-xl' : 'text-2xl'}`}>{rep.full_name || 'Unknown Rep'}</h1>
                  <p className={`text-slate-400 ${isMobile ? 'text-sm' : ''}`}>{rep.email || 'No email'}</p>
                  <div className={`flex items-center gap-4 mt-2 ${isMobile ? 'flex-wrap justify-center' : ''}`}>
                    <span className={`inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <User className={isMobile ? "w-3 h-3" : "w-4 h-4"} />
                      {rep.role || 'rep'}
                    </span>
                    {rep.created_at && (
                      <span className={`text-slate-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        Joined {new Date(rep.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* View-only badge */}
              {!isMobile && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <p className="text-sm font-medium text-blue-300">Manager View</p>
                  </div>
                  <p className="text-xs text-slate-400">View-only dashboard • No editing permissions</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Performance Metric Cards - Horizontal scroll on mobile */}
          {isMobile ? (
            <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide mb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex gap-4" style={{ width: 'max-content' }}>
                {[
                  { label: 'Overall Score', value: skillStats?.overall?.current ?? 0, previous: skillStats?.overall?.previous ?? 0, bgColor: '#2a1a3a', borderColor: '#4a2a6a', textColor: 'text-purple-200' },
                  { label: 'Rapport', value: skillStats?.rapport?.current ?? 0, previous: skillStats?.rapport?.previous ?? 0, bgColor: '#1a3a2a', borderColor: '#2a6a4a', textColor: 'text-emerald-200' },
                  { label: 'Discovery', value: skillStats?.discovery?.current ?? 0, previous: skillStats?.discovery?.previous ?? 0, bgColor: '#1a2a3a', borderColor: '#2a4a6a', textColor: 'text-blue-200' },
                  { label: 'Objection', value: skillStats?.objection?.current ?? 0, previous: skillStats?.objection?.previous ?? 0, bgColor: '#3a2a1a', borderColor: '#6a4a2a', textColor: 'text-amber-200' },
                  { label: 'Closing', value: skillStats?.closing?.current ?? 0, previous: skillStats?.closing?.previous ?? 0, bgColor: '#3a1a2a', borderColor: '#6a2a4a', textColor: 'text-pink-200' },
                ].map((skill, idx) => (
                  <IOSCard
                    key={idx}
                    variant="elevated"
                    className="min-w-[200px] p-4"
                    style={{
                      backgroundColor: skill.bgColor,
                      border: `2px solid ${skill.borderColor}`,
                    }}
                  >
                    <h3 className={`text-xs font-semibold ${skill.textColor} uppercase tracking-wide mb-2`}>{skill.label}</h3>
                    <div className="text-2xl font-bold text-white mb-1 tabular-nums">{skill.value}%</div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <p className="text-xs font-semibold text-green-400">
                        {skill.previous > 0 
                          ? `${(skill.value - skill.previous) > 0 ? '+' : ''}${skill.value - skill.previous}%`
                          : '0%'
                        }
                      </p>
                    </div>
                  </IOSCard>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-8">
            {/* Overall Score Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-lg p-5"
              style={{ 
                backgroundColor: '#2a1a3a',
                border: '2px solid #4a2a6a',
                boxShadow: 'inset 0 0 20px rgba(138, 43, 226, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-purple-200 uppercase tracking-wide">Overall Score</h3>
                <svg className="w-3 h-3 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white mb-2 tabular-nums">{skillStats?.overall?.current ?? 0}%</div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p className="text-xs font-semibold text-green-400">
                  {skillStats?.overall?.previous && skillStats.overall.previous > 0 
                    ? `${(skillStats.overall.current - skillStats.overall.previous) > 0 ? '+' : ''}${skillStats.overall.current - skillStats.overall.previous}% from last week`
                    : '0% from last week'
                  }
                </p>
              </div>
            </motion.div>

            {/* Rapport Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-lg p-5"
              style={{ 
                backgroundColor: '#1a3a2a',
                border: '2px solid #2a6a4a',
                boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-emerald-200 uppercase tracking-wide">Rapport</h3>
                <svg className="w-3 h-3 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white mb-2 tabular-nums">{skillStats?.rapport?.current ?? 0}%</div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p className="text-xs font-semibold text-green-400">
                  {skillStats?.rapport?.previous && skillStats.rapport.previous > 0 
                    ? `${(skillStats.rapport.current - skillStats.rapport.previous) > 0 ? '+' : ''}${skillStats.rapport.current - skillStats.rapport.previous}% from last week`
                    : '0% from last week'
                  }
                </p>
              </div>
            </motion.div>

            {/* Discovery Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-lg p-5"
              style={{ 
                backgroundColor: '#1a2a3a',
                border: '2px solid #2a4a6a',
                boxShadow: 'inset 0 0 20px rgba(59, 130, 246, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Discovery</h3>
                <svg className="w-3 h-3 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white mb-2 tabular-nums">{skillStats?.discovery?.current ?? 0}%</div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p className="text-xs font-semibold text-green-400">
                  {skillStats?.discovery?.previous && skillStats.discovery.previous > 0 
                    ? `${(skillStats.discovery.current - skillStats.discovery.previous) > 0 ? '+' : ''}${skillStats.discovery.current - skillStats.discovery.previous}% from last week`
                    : '0% from last week'
                  }
                </p>
              </div>
            </motion.div>

            {/* Objection Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-lg p-5"
              style={{ 
                backgroundColor: '#3a2a1a',
                border: '2px solid #6a4a2a',
                boxShadow: 'inset 0 0 20px rgba(245, 158, 11, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-amber-200 uppercase tracking-wide">Objection</h3>
                <svg className="w-3 h-3 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white mb-2 tabular-nums">{skillStats?.objection?.current ?? 0}%</div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p className="text-xs font-semibold text-green-400">
                  {skillStats?.objection?.previous && skillStats.objection.previous > 0 
                    ? `${(skillStats.objection.current - skillStats.objection.previous) > 0 ? '+' : ''}${skillStats.objection.current - skillStats.objection.previous}% from last week`
                    : '0% from last week'
                  }
                </p>
              </div>
            </motion.div>

            {/* Closing Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-lg p-5"
              style={{ 
                backgroundColor: '#3a1a2a',
                border: '2px solid #6a2a4a',
                boxShadow: 'inset 0 0 20px rgba(236, 72, 153, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-pink-200 uppercase tracking-wide">Closing</h3>
                <svg className="w-3 h-3 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <div className="text-3xl font-bold text-white mb-2 tabular-nums">{skillStats?.closing?.current ?? 0}%</div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p className="text-xs font-semibold text-green-400">
                  {skillStats?.closing?.previous && skillStats.closing.previous > 0 
                    ? `${(skillStats.closing.current - skillStats.closing.previous) > 0 ? '+' : ''}${skillStats.closing.current - skillStats.closing.previous}% from last week`
                    : '0% from last week'
                  }
                </p>
              </div>
            </motion.div>
          </div>
          )}

          {/* Stats Cards - Horizontal scroll on mobile */}
          {isMobile ? (
            <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide mb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex gap-4" style={{ width: 'max-content' }}>
                {[
                  { icon: DollarSign, label: 'Total Earnings', value: `$${(stats.totalEarnings || 0).toFixed(2)}`, color: 'text-green-400' },
                  { icon: Target, label: 'Average Score', value: `${stats.averageScore || 0}%`, color: getScoreColor(stats.averageScore || 0) },
                  { icon: Award, label: 'Best Score', value: `${stats.bestScore || 0}%`, color: getScoreColor(stats.bestScore || 0) },
                  { icon: Calendar, label: 'Total Sessions', value: `${stats.totalSessions || 0}`, color: 'text-blue-400' },
                  { icon: Target, label: 'Close %', value: `${stats.closePercentage || 0}%`, color: getScoreColor(stats.closePercentage || 0) },
                ].map((stat, idx) => {
                  const Icon = stat.icon
                  return (
                    <IOSCard key={idx} variant="elevated" className="min-w-[160px] p-4">
                      <Icon className={`w-6 h-6 ${stat.color} mb-2`} />
                      <p className={`text-xl font-bold text-white mb-1 ${stat.color.includes('text-') ? '' : stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-white/60 font-sans">{stat.label}</p>
                    </IOSCard>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
            >
              <DollarSign className="w-8 h-8 text-green-400 mb-3" />
              <p className="text-2xl font-bold text-white">${(stats.totalEarnings || 0).toFixed(2)}</p>
              <p className="text-sm text-slate-400">Total Earnings</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
            >
              <Target className="w-8 h-8 text-purple-400 mb-3" />
              <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore || 0)}`}>
                {stats.averageScore || 0}%
              </p>
              <p className="text-sm text-slate-400">Average Score</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
            >
              <Award className="w-8 h-8 text-yellow-400 mb-3" />
              <p className={`text-2xl font-bold ${getScoreColor(stats.bestScore || 0)}`}>
                {stats.bestScore || 0}%
              </p>
              <p className="text-sm text-slate-400">Best Score</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
            >
              <Calendar className="w-8 h-8 text-blue-400 mb-3" />
              <p className="text-2xl font-bold text-white">{stats.totalSessions || 0}</p>
              <p className="text-sm text-slate-400">Total Sessions</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
            >
              <Target className="w-8 h-8 text-emerald-400 mb-3" />
              <p className={`text-2xl font-bold ${getScoreColor(stats.closePercentage || 0)}`}>
                {stats.closePercentage || 0}%
              </p>
              <p className="text-sm text-slate-400">Close %</p>
            </motion.div>
          </div>
          )}

          {/* Performance Chart - Always show */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`${isMobile ? 'bg-transparent' : 'bg-[#1e1e30] border border-white/10'} rounded-2xl ${isMobile ? 'p-4' : 'p-6'} mb-6`}
          >
            <h2 className={`font-semibold text-white mb-6 ${isMobile ? 'text-lg' : 'text-xl'}`}>Recent Performance</h2>
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="session" 
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 11 }}
              />
              <YAxis 
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1e1e30',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#a855f7" 
                strokeWidth={2}
                dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

          {/* Recent Sessions - READ-ONLY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`${isMobile ? 'bg-transparent' : 'bg-[#1e1e30] border border-white/10'} rounded-2xl ${isMobile ? 'p-4' : 'p-6'}`}
          >
            <div className={`flex items-center justify-between mb-6 ${isMobile ? 'mb-4' : ''}`}>
              <h2 className={`font-semibold text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>Recent Sessions</h2>
              <div className={`text-slate-400 px-3 py-1 bg-slate-700/50 rounded-lg ${isMobile ? 'text-xs' : ''}`}>
                {isMobile ? `${sessions.length} sessions` : `View-only • ${sessions.length} total sessions`}
              </div>
            </div>
            
            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.slice(0, 10).map((session, index) => (
                  <Link
                    key={session.id}
                    href={`/analytics/${session.id}`}
                    onClick={() => trigger('light')}
                    className={`block ${isMobile ? 'p-3' : 'p-4'} bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group`}
                  >
                    {isMobile ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors truncate">
                            {session.agent_name || `Session ${index + 1}`}
                          </p>
                          <p className="text-xs text-white/60">
                            {new Date(session.created_at).toLocaleDateString()} • {formatDuration(session.duration_seconds || 0)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <p className={`text-lg font-bold ${getScoreColor(session.overall_score || 0)}`}>
                            {session.overall_score || 0}%
                          </p>
                          {session.virtual_earnings && session.virtual_earnings > 0 && (
                            <p className="text-xs font-bold text-green-400">
                              +${session.virtual_earnings.toFixed(2)}
                            </p>
                          )}
                          {session.sale_closed && (
                            <p className="text-xs text-green-400">✓ Closed</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                              {session.agent_name || `Session ${index + 1}`}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(session.created_at).toLocaleDateString()} • {formatDuration(session.duration_seconds || 0)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getScoreColor(session.overall_score || 0)}`}>
                              {session.overall_score || 0}%
                            </p>
                            {session.sale_closed && (
                              <p className="text-xs text-green-400">✓ Sale Closed</p>
                            )}
                          </div>
                          {session.virtual_earnings && session.virtual_earnings > 0 && (
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-400">
                                +${session.virtual_earnings.toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                <BarChart3 className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} text-slate-600 mx-auto mb-3`} />
                <p className="text-slate-400">No sessions yet</p>
                <p className={`text-slate-500 mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>This rep hasn't completed any training sessions</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </PullToRefresh>
  )
}