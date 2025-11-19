'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, ComposedChart,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { 
  TrendingUp, Users, Target, Download, Calendar, Activity, Award, 
  AlertCircle, TrendingDown, Zap, DollarSign, Clock,
  ChevronRight, Sparkles, ArrowUpRight, ArrowDownRight, Brain,
  Target as TargetIcon, UserCheck, Timer, CheckCircle2, XCircle, Star, Mail, UserPlus, Trophy, X, Copy, MessageSquare
} from 'lucide-react'
import Link from 'next/link'

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#EC4899', '#F59E0B', '#EF4444']

interface Analytics {
  totalSessions: number
  teamAverage: number
  activeReps: number
  trainingROI: number
  performanceData: Array<{
    month: string
    teamAvg: number
    topPerformer: number
    industry: number
  }>
  skillDistribution: Array<{
    name: string
    value: number
  }>
  changes: {
    sessions: number
    score: number
    reps: number
    roi: number
  }
  repPerformance?: Array<{
    id: string
    name: string
    sessions: number
    avgScore: number
    trend: number
    skills: {
      rapport: number
      discovery: number
      objections: number
      closing: number
    }
    revenue: number
    lastActive: string
  }>
  hourlyPerformance?: Array<{
    hour: number
    sessions: number
    avgScore: number
    closeRate: number
  }>
  dailyPerformance?: Array<{
    date: string
    sessions: number
    avgScore: number
    revenue: number
  }>
  skillProgression?: Array<{
    skill: string
    current: number
    previous: number
    trend: 'up' | 'down' | 'stable'
  }>
  coachingOpportunities?: Array<{
    repName: string
    skill: string
    currentScore: number
    targetScore: number
    impact: 'high' | 'medium' | 'low'
  }>
}

interface TeamStats {
  totalReps: number
  activeNow: number
  teamAverage: number
  totalEarned: number
  topPerformers: Array<{
    id: string
    name: string
    email: string
    score: number
    sessionCount: number
    earnings: number
  }>
}

interface RevenueDataPoint {
  period: string
  fullPeriod: string
  revenue: number
  repsWhoSold: number
  totalSales: number
  avgScore?: number
}

interface AnalyticsDashboardProps {
  timePeriod?: string
}

export default function AnalyticsDashboard({ timePeriod = '30' }: AnalyticsDashboardProps = {}) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [revenueTimePeriod, setRevenueTimePeriod] = useState<'day' | 'week' | 'month'>('week')
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadAnalytics()
    loadTeamStats()
  }, [timePeriod])

  useEffect(() => {
    loadRevenueData()
  }, [revenueTimePeriod])

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/team/analytics?period=${timePeriod}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics || null)
      } else {
        setAnalytics(null)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }

  const loadTeamStats = async () => {
    try {
      const response = await fetch('/api/team/stats')
      if (response.ok) {
        const data = await response.json()
        setTeamStats(data)
      }
    } catch (error) {
      console.error('Error loading team stats:', error)
    }
  }

  const generateInviteLink = async () => {
    setInviteLoading(true)
    try {
      // Generate a generic invite link (without email) - we'll create a shareable link
      const response = await fetch('/api/invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'share@dooriq.com', role: 'rep' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invite')
      }

      setInviteUrl(data.inviteUrl)
      setShowInviteModal(true)
    } catch (error: any) {
      console.error('Error generating invite:', error)
      alert('Failed to generate invite link. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareViaMessages = () => {
    if (inviteUrl) {
      const message = `Join my team on DoorIQ! ${inviteUrl}`
      window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank')
    }
  }

  const handleShareViaGmail = () => {
    if (inviteUrl) {
      const subject = 'Join my team on DoorIQ'
      const body = `Hi,\n\nI'd like to invite you to join my team on DoorIQ. Click the link below to get started:\n\n${inviteUrl}\n\nLooking forward to working with you!`
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
    }
  }

  const loadRevenueData = async () => {
    try {
      const response = await fetch(`/api/team/revenue?period=${revenueTimePeriod}`)
      if (response.ok) {
        const data = await response.json()
        // Use actual data from API - no mock scores
        let dataWithScores = (data.revenueData || []).map((item: RevenueDataPoint) => {
          return {
            ...item,
            avgScore: item.avgScore || 0 // Use actual avgScore from API, default to 0 if not provided
          }
        })
        
        // Sort data chronologically by parsing dates
        dataWithScores.sort((a: RevenueDataPoint, b: RevenueDataPoint) => {
          // Try to parse fullPeriod first (more reliable date format)
          let dateA: Date
          let dateB: Date
          
          if (a.fullPeriod) {
            dateA = new Date(a.fullPeriod)
          } else {
            // Parse period string (e.g., "Week of Nov 10" or "Nov 10")
            // Extract date from "Week of Nov 10" format
            const weekMatch = a.period.match(/Week of (\w+)\s+(\d+)/)
            if (weekMatch) {
              const month = weekMatch[1]
              const day = weekMatch[2]
              const currentYear = new Date().getFullYear()
              // Handle year rollover - if month is in the future relative to now, use previous year
              const testDate = new Date(`${month} ${day}, ${currentYear}`)
              const now = new Date()
              if (testDate > now && month !== 'Dec') {
                dateA = new Date(`${month} ${day}, ${currentYear - 1}`)
              } else {
                dateA = testDate
              }
            } else {
              const periodMatch = a.period.match(/(\w+)\s+(\d+)/)
              if (periodMatch) {
                dateA = new Date(`${periodMatch[1]} ${periodMatch[2]}, ${new Date().getFullYear()}`)
              } else {
                dateA = new Date(a.period)
              }
            }
          }
          
          if (b.fullPeriod) {
            dateB = new Date(b.fullPeriod)
          } else {
            const weekMatch = b.period.match(/Week of (\w+)\s+(\d+)/)
            if (weekMatch) {
              const month = weekMatch[1]
              const day = weekMatch[2]
              const currentYear = new Date().getFullYear()
              const testDate = new Date(`${month} ${day}, ${currentYear}`)
              const now = new Date()
              if (testDate > now && month !== 'Dec') {
                dateB = new Date(`${month} ${day}, ${currentYear - 1}`)
              } else {
                dateB = testDate
              }
            } else {
              const periodMatch = b.period.match(/(\w+)\s+(\d+)/)
              if (periodMatch) {
                dateB = new Date(`${periodMatch[1]} ${periodMatch[2]}, ${new Date().getFullYear()}`)
              } else {
                dateB = new Date(b.period)
              }
            }
          }
          
          return dateA.getTime() - dateB.getTime()
        })
        
        setRevenueData(dataWithScores)
      }
    } catch (error) {
      console.error('Error loading revenue data:', error)
    }
  }

  const getMockAnalytics = (): Analytics => ({
    totalSessions: 247,
    teamAverage: 73,
    activeReps: 8,
    trainingROI: 245,
    performanceData: [
      { month: 'Jul', teamAvg: 65, topPerformer: 82, industry: 68 },
      { month: 'Aug', teamAvg: 68, topPerformer: 85, industry: 69 },
      { month: 'Sep', teamAvg: 71, topPerformer: 88, industry: 70 },
      { month: 'Oct', teamAvg: 73, topPerformer: 91, industry: 71 },
      { month: 'Nov', teamAvg: 75, topPerformer: 92, industry: 72 },
    ],
    skillDistribution: [
      { name: 'Rapport Building', value: 78 },
      { name: 'Discovery', value: 72 },
      { name: 'Objection Handling', value: 68 },
      { name: 'Closing', value: 75 },
      { name: 'Follow-up', value: 70 },
    ],
    changes: {
      sessions: 18,
      score: 5,
      reps: 2,
      roi: 24
    },
    repPerformance: [
      { id: '1', name: 'Sarah Johnson', sessions: 42, avgScore: 87, trend: 8, skills: { rapport: 90, discovery: 85, objections: 88, closing: 85 }, revenue: 12450, lastActive: '2 hours ago' },
      { id: '2', name: 'Mike Chen', sessions: 38, avgScore: 82, trend: 5, skills: { rapport: 85, discovery: 80, objections: 82, closing: 80 }, revenue: 11200, lastActive: '1 hour ago' },
      { id: '3', name: 'Emily Rodriguez', sessions: 35, avgScore: 79, trend: 12, skills: { rapport: 82, discovery: 78, objections: 75, closing: 78 }, revenue: 9800, lastActive: '3 hours ago' },
      { id: '4', name: 'David Park', sessions: 31, avgScore: 76, trend: -2, skills: { rapport: 78, discovery: 75, objections: 73, closing: 78 }, revenue: 8900, lastActive: '5 hours ago' },
      { id: '5', name: 'Lisa Anderson', sessions: 28, avgScore: 72, trend: 6, skills: { rapport: 75, discovery: 70, objections: 70, closing: 73 }, revenue: 7200, lastActive: '1 day ago' },
      { id: '6', name: 'James Wilson', sessions: 25, avgScore: 69, trend: -4, skills: { rapport: 72, discovery: 68, objections: 65, closing: 70 }, revenue: 6100, lastActive: '2 days ago' },
      { id: '7', name: 'Rachel Kim', sessions: 22, avgScore: 66, trend: 3, skills: { rapport: 70, discovery: 65, objections: 63, closing: 68 }, revenue: 5400, lastActive: '3 days ago' },
      { id: '8', name: 'Chris Martinez', sessions: 18, avgScore: 64, trend: -6, skills: { rapport: 68, discovery: 62, objections: 60, closing: 66 }, revenue: 4200, lastActive: '1 week ago' },
    ],
    hourlyPerformance: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sessions: Math.floor(Math.random() * 20) + 5,
      avgScore: Math.floor(Math.random() * 15) + 68,
      closeRate: Math.random() * 0.3 + 0.15
    })),
    dailyPerformance: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: Math.floor(Math.random() * 15) + 5,
      avgScore: Math.floor(Math.random() * 20) + 65,
      revenue: Math.floor(Math.random() * 2000) + 500
    })),
    skillProgression: [
      { skill: 'Rapport Building', current: 78, previous: 74, trend: 'up' },
      { skill: 'Discovery', current: 72, previous: 70, trend: 'up' },
      { skill: 'Objection Handling', current: 68, previous: 71, trend: 'down' },
      { skill: 'Closing', current: 75, previous: 73, trend: 'up' },
      { skill: 'Follow-up', current: 70, previous: 68, trend: 'up' },
    ],
    coachingOpportunities: [
      { repName: 'Chris Martinez', skill: 'Objection Handling', currentScore: 60, targetScore: 75, impact: 'high' },
      { repName: 'James Wilson', skill: 'Discovery', currentScore: 68, targetScore: 80, impact: 'high' },
      { repName: 'Rachel Kim', skill: 'Closing', currentScore: 68, targetScore: 78, impact: 'medium' },
      { repName: 'David Park', skill: 'Rapport Building', currentScore: 78, targetScore: 85, impact: 'medium' },
    ]
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500"></div>
          <p className="text-white/60">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Activity className="w-20 h-20 text-slate-600 mb-4" />
        <h3 className="text-2xl font-semibold text-white mb-2 font-space">No Analytics Data Yet</h3>
        <p className="text-slate-400 font-sans">Complete training sessions to see performance insights</p>
      </div>
    )
  }

  const topPerformers = analytics.repPerformance?.slice(0, 3) || []
  const needsAttention = analytics.repPerformance?.filter(r => r.trend < 0).slice(0, 3) || []

  const displayTeamStats = teamStats || {
    totalReps: analytics?.activeReps || 0,
    activeNow: analytics?.activeReps || 0,
    teamAverage: analytics?.teamAverage || 0,
    totalEarned: analytics?.repPerformance?.reduce((sum, r) => sum + r.revenue, 0) || 0,
    topPerformers: analytics?.repPerformance?.slice(0, 5).map(r => ({
      id: r.id,
      name: r.name,
      email: '',
      score: r.avgScore,
      sessionCount: r.sessions,
      earnings: r.revenue
    })) || []
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Earned', 
            value: `$${displayTeamStats.totalEarned.toLocaleString()}`, 
            change: '', 
            changeValue: 0,
            icon: DollarSign,
            bgColor: '#1a3a2a',
            borderColor: '#2a6a4a',
            textColor: 'text-emerald-200',
            iconColor: 'text-emerald-300',
            subtitle: 'Virtual earnings from training'
          },
          { 
            label: 'Total Sessions', 
            value: analytics.totalSessions.toLocaleString(), 
            change: `${analytics.changes.sessions > 0 ? '+' : ''}${analytics.changes.sessions}%`, 
            changeValue: analytics.changes.sessions,
            icon: Target,
            bgColor: '#1a1a1a',
            borderColor: '#2a2a2a',
            textColor: 'text-gray-300',
            iconColor: 'text-gray-400',
            subtitle: 'Training sessions completed'
          },
          { 
            label: 'Team Members', 
            value: displayTeamStats.totalReps.toString(), 
            change: '', 
            changeValue: 0,
            icon: Users,
            bgColor: '#1a1a1a',
            borderColor: '#2a2a2a',
            textColor: 'text-gray-300',
            iconColor: 'text-gray-400',
            subtitle: 'Team members'
          },
          { 
            label: 'Team Average', 
            value: `${analytics.teamAverage}%`, 
            change: `${analytics.changes.score > 0 ? '+' : ''}${analytics.changes.score}%`, 
            changeValue: analytics.changes.score,
            icon: TrendingUp,
            bgColor: '#1a1a1a',
            borderColor: '#2a2a2a',
            textColor: 'text-gray-300',
            iconColor: 'text-gray-400',
            subtitle: 'Overall performance rating'
          },
        ].map((metric, idx) => {
          const Icon = metric.icon
          const isPositive = metric.changeValue > 0
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="relative overflow-hidden rounded-2xl p-6 backdrop-blur-sm group transition-all duration-300"
              style={{
                backgroundColor: metric.bgColor,
                border: `2px solid ${metric.borderColor}`,
                boxShadow: metric.bgColor === '#1a3a2a' 
                  ? 'inset 0 0 20px rgba(16, 185, 129, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)'
                  : 'inset 0 0 20px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.4)'
              }}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl border" style={{ 
                    backgroundColor: metric.bgColor === '#1a3a2a' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    borderColor: metric.borderColor 
                  }}>
                    <Icon className={`w-5 h-5 ${metric.iconColor}`} />
                  </div>
                  {metric.change && (
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                      isPositive ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'
                    }`}>
                      {isPositive ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-300" />
                      )}
                      <span className={`text-sm font-semibold font-space ${isPositive ? 'text-emerald-300' : 'text-red-300'}`}>
                        {metric.change}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-4xl font-bold text-white mb-1 font-space">{metric.value}</p>
                <p className="text-lg font-semibold text-white font-space">{metric.subtitle}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Team Performance Chart & Revenue vs. Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Team Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-5 pt-5 pb-0 backdrop-blur-sm"
          style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 font-space">Team Performance</h3>
              <p className="text-sm text-white/70 font-sans">Overall session performance over time</p>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
              {(['day', 'week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setRevenueTimePeriod(period)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 font-space ${
                    revenueTimePeriod === period
                      ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {revenueData.length > 0 ? (
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 20, right: 20, left: 20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} opacity={0.5} />
                  <XAxis 
                    dataKey="period" 
                    stroke="#ffffff"
                    tick={{ fill: '#ffffff', fontSize: 13, fontWeight: 500 }}
                    axisLine={{ stroke: '#3a3a3a', strokeWidth: 2 }}
                    angle={revenueTimePeriod === 'week' ? -45 : 0}
                    textAnchor={revenueTimePeriod === 'week' ? 'end' : 'middle'}
                    height={60}
                    interval={0}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#ffffff"
                    tick={{ fill: '#ffffff', fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: '#3a3a3a', strokeWidth: 2 }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    width={60}
                    tickMargin={8}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      border: '2px solid #a855f7',
                      borderRadius: '12px',
                      color: '#ffffff',
                      padding: '12px',
                    }}
                    cursor={{ stroke: '#ffffff', strokeWidth: 2, strokeDasharray: '5 5', opacity: 0.3 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div>
                            <p className="text-white font-bold text-base mb-2 font-space">
                              {data.fullPeriod || data.period}
                            </p>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white/80">Average Score:</span>
                                <span className="text-sm font-bold text-white font-space">{data.avgScore || 0}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white/80">Total Sessions:</span>
                                <span className="text-sm font-bold text-white">{data.totalSales}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white/80">Active Reps:</span>
                                <span className="text-sm font-bold text-white">{data.repsWhoSold}</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgScore" 
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{ fill: '#a855f7', r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ fill: '#ffffff', r: 8, stroke: '#a855f7', strokeWidth: 2 }}
                    strokeLinecap="round"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[450px] flex items-center justify-center text-white">
              <div className="text-center">
                <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold font-sans">No performance data available yet</p>
                <p className="text-base mt-2 text-white/60">Start training sessions to see performance metrics</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Revenue vs. Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-5 pt-5 pb-0 backdrop-blur-sm"
          style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 font-space">Revenue vs. Performance</h3>
              <p className="text-sm text-white/70">Correlation analysis</p>
            </div>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          {analytics.repPerformance && (
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analytics.repPerformance.map(r => ({ name: r.name, revenue: r.revenue, score: r.avgScore }))} margin={{ top: 20, right: 20, left: 20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#ffffff" 
                    tick={{ fill: '#ffffff', fontSize: 13, fontWeight: 500 }} 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    dy={10}
                    interval={0}
                    axisLine={{ stroke: '#3a3a3a', strokeWidth: 2 }}
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke="#ffffff" 
                    tick={{ fill: '#10B981', fontSize: 12, fontWeight: 600 }} 
                    axisLine={{ stroke: '#3a3a3a', strokeWidth: 2 }}
                    width={60}
                    tickMargin={8}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    label={{ value: 'Revenue', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#10B981', fontSize: 12, fontWeight: 600 } }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#ffffff" 
                    tick={{ fill: '#A855F7', fontSize: 12, fontWeight: 600 }} 
                    axisLine={{ stroke: '#3a3a3a', strokeWidth: 2 }}
                    width={65}
                    tickMargin={8}
                    tickFormatter={(value) => `${value}%`}
                    label={{ value: 'Score', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#A855F7', fontSize: 12, fontWeight: 600 } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      border: '2px solid #10B981',
                      borderRadius: '12px',
                      color: '#ffffff',
                      padding: '12px',
                    }}
                    cursor={{ stroke: '#ffffff', strokeWidth: 2, strokeDasharray: '5 5', opacity: 0.3 }}
                  />
                  <Legend 
                    verticalAlign="top"
                    wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px' }} 
                    iconType="line"
                    iconSize={20}
                    formatter={(value) => <span style={{ color: '#ffffff', fontSize: '16px', fontWeight: 600 }}>{value}</span>}
                  />
                  <Bar 
                    yAxisId="left" 
                    dataKey="revenue" 
                    fill="#10B981" 
                    name="Revenue ($)" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={45}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#A855F7" 
                    strokeWidth={3} 
                    strokeOpacity={1} 
                    name="Avg Score (%)" 
                    dot={{ fill: '#A855F7', r: 5, stroke: '#ffffff', strokeWidth: 2 }} 
                    activeDot={{ fill: '#ffffff', r: 8, stroke: '#A855F7', strokeWidth: 2 }}
                    strokeLinecap="round"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>


      {/* Top Performers & Needs Attention */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1a3a2a] border-2 border-[#2a6a4a] rounded-2xl p-6 backdrop-blur-sm"
          style={{ boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30">
              <Award className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-space">Top Performers</h3>
              <p className="text-sm text-white">Leading the team this period</p>
            </div>
          </div>
          <div className="space-y-4">
            {topPerformers.map((rep, idx) => (
              <div key={rep.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-emerald-500/20">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/30 to-green-500/30 flex items-center justify-center border border-emerald-400/30">
                      <span className="text-emerald-300 font-bold text-lg font-space">{idx + 1}</span>
                    </div>
                    {idx === 0 && (
                      <div className="absolute -top-1 -right-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold font-space">{rep.name}</p>
                    <p className="text-sm text-white">{rep.sessions} sessions</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white font-space">{rep.avgScore}%</span>
                    {rep.trend >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <p className={`text-sm ${rep.trend >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {rep.trend >= 0 ? '+' : ''}{rep.trend}% trend
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#3a1a1a] border-2 border-[#6a2a2a] rounded-2xl p-6 backdrop-blur-sm"
          style={{ boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-400/30">
              <AlertCircle className="w-5 h-5 text-red-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-space">Needs Attention</h3>
              <p className="text-sm text-white">Performance declining</p>
            </div>
          </div>
          <div className="space-y-4">
            {needsAttention.map((rep) => (
              <div key={rep.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-red-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/30 flex items-center justify-center border border-red-400/30">
                    <span className="text-red-300 font-bold font-space">{rep.name.split(' ').map(n => n[0]).join('')}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold font-space">{rep.name}</p>
                    <p className="text-sm text-white">{rep.sessions} sessions</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-white font-space">{rep.avgScore}%</span>
                    {rep.trend >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <p className={`text-sm ${rep.trend >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    {rep.trend >= 0 ? '+' : ''}{rep.trend}% trend
                  </p>
                </div>
              </div>
            ))}
            {needsAttention.length === 0 && (
              <div className="text-center py-8 text-white">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-400/50" />
                <p className="text-base">All team members performing well!</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Coaching Opportunities */}
      {analytics.coachingOpportunities && analytics.coachingOpportunities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#2a1a3a] border-2 border-[#4a2a6a] rounded-2xl p-6 backdrop-blur-sm"
          style={{ boxShadow: 'inset 0 0 20px rgba(138, 43, 226, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30">
              <TargetIcon className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1 font-space">Coaching Opportunities</h3>
              <p className="text-base text-white">AI-identified improvement areas</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.coachingOpportunities.map((opp, idx) => (
              <div key={idx} className="p-4 bg-black/20 rounded-xl border border-purple-500/20">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold">{opp.repName}</p>
                    <p className="text-base text-white mt-1">{opp.skill}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-sm font-semibold font-space ${
                    opp.impact === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    opp.impact === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {opp.impact.toUpperCase()} IMPACT
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white">Current</span>
                      <span className="text-sm text-white">Target</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                        style={{ width: `${(opp.currentScore / opp.targetScore) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-white font-space">{opp.currentScore}%</span>
                    <span className="text-sm text-white"> → {opp.targetScore}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 backdrop-blur-sm"
        style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-400/30">
            <Brain className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1 font-space">AI-Powered Insights</h3>
            <p className="text-base text-white">Intelligent analysis and recommendations</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-black/30 border border-purple-500/20 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-300" />
              <p className="text-base font-semibold text-white font-space">Trend Analysis</p>
            </div>
            <p className="text-base text-white leading-relaxed">
              {analytics.changes.score > 0 
                ? `Team performance is improving by ${analytics.changes.score}% this period. Maintain focus on skill development to sustain momentum.`
                : analytics.changes.score < 0
                  ? `Team scores declining by ${Math.abs(analytics.changes.score)}%. Immediate coaching intervention recommended for underperforming reps.`
                  : 'Team performance is stable. Consider advanced training modules to push beyond current plateau.'}
            </p>
          </div>
          <div className="bg-black/30 border border-amber-500/20 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-amber-300" />
              <p className="text-base font-semibold text-white">Activity Insights</p>
            </div>
            <p className="text-base text-white leading-relaxed">
              {analytics.activeReps} active team members completed {analytics.totalSessions} training sessions. 
              {analytics.totalSessions / analytics.activeReps > 30 
                ? ' Excellent engagement levels across the team.' 
                : ' Consider increasing session frequency for optimal skill retention.'}
            </p>
          </div>
          <div className="bg-black/30 border border-emerald-500/20 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-emerald-300" />
              <p className="text-base font-semibold text-white">Strategic Recommendations</p>
            </div>
            <p className="text-base text-white leading-relaxed">
              {analytics.teamAverage < 70 
                ? 'Focus on foundational skills training. Consider one-on-one coaching sessions for reps scoring below 65%.'
                : analytics.teamAverage < 80
                  ? 'Team is performing well. Focus on objection handling and advanced closing techniques to reach next performance tier.'
                  : 'Outstanding performance! Maintain momentum with advanced scenario training and peer learning sessions.'}
            </p>
          </div>
        </div>
      </motion.div>


      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Link href="/manager?tab=messages" className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:border-purple-500/30 transition-all text-center group">
          <Mail className="w-6 h-6 text-white mb-3 mx-auto group-hover:text-purple-400 transition-colors" />
          <p className="text-base font-medium text-white">Send Team Message</p>
        </Link>

        <button 
          onClick={generateInviteLink}
          disabled={inviteLoading}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:border-purple-500/30 transition-all text-center group disabled:opacity-50"
        >
          {inviteLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-purple-400 rounded-full animate-spin mb-3 mx-auto" />
          ) : (
            <UserPlus className="w-6 h-6 text-white mb-3 mx-auto group-hover:text-purple-400 transition-colors" />
          )}
          <p className="text-base font-medium text-white">Invite a Rep</p>
        </button>

        <Link href="/manager?tab=analytics" className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:border-purple-500/30 transition-all text-center group">
          <Trophy className="w-6 h-6 text-white mb-3 mx-auto group-hover:text-purple-400 transition-colors" />
          <p className="text-base font-medium text-white">View Analytics</p>
        </Link>

        <button className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 hover:border-purple-500/30 transition-all text-center group">
          <Download className="w-6 h-6 text-white mb-3 mx-auto group-hover:text-purple-400 transition-colors" />
          <p className="text-base font-medium text-white">Export Report</p>
        </button>
      </motion.div>

      {/* Invite Rep Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8 max-w-md w-full"
            style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/30">
                  <UserPlus className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="text-xl font-bold text-white font-space">Invite a Rep</h3>
              </div>
              <button
                onClick={() => {
                  setShowInviteModal(false)
                  setInviteUrl(null)
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-white/80 mb-6">
              Share this invite link with a rep to join your team. They can use it to sign up and automatically join your team.
            </p>

            {inviteUrl && (
              <>
                <div className="flex items-center gap-2 mb-6 p-4 bg-black/30 border border-white/10 rounded-xl">
                  <input
                    type="text"
                    value={inviteUrl}
                    readOnly
                    className="flex-1 bg-transparent text-white text-sm focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleShareViaMessages}
                    className="flex items-center justify-center gap-2 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/30 transition-colors group"
                  >
                    <MessageSquare className="w-5 h-5 text-emerald-300 group-hover:text-emerald-200" />
                    <span className="text-sm font-medium text-white">Messages</span>
                  </button>

                  <button
                    onClick={handleShareViaGmail}
                    className="flex items-center justify-center gap-2 p-4 bg-red-500/20 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-colors group"
                  >
                    <Mail className="w-5 h-5 text-red-300 group-hover:text-red-200" />
                    <span className="text-sm font-medium text-white">Gmail</span>
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

