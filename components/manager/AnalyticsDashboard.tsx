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
  AlertCircle, TrendingDown, Zap, DollarSign, Clock, BarChart3,
  ChevronRight, Sparkles, ArrowUpRight, ArrowDownRight, Brain,
  Target as TargetIcon, UserCheck, Timer, CheckCircle2, XCircle, Star
} from 'lucide-react'

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

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState('30')
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'reps' | 'skills' | 'revenue'>('overview')

  useEffect(() => {
    loadAnalytics()
  }, [timePeriod])

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/team/analytics?period=${timePeriod}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics || getMockAnalytics())
      } else {
        setAnalytics(getMockAnalytics())
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      setAnalytics(getMockAnalytics())
    } finally {
      setLoading(false)
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
        <h3 className="text-2xl font-semibold text-white mb-2">No Analytics Data Yet</h3>
        <p className="text-slate-400">Complete training sessions to see performance insights</p>
      </div>
    )
  }

  const topPerformers = analytics.repPerformance?.slice(0, 3) || []
  const needsAttention = analytics.repPerformance?.filter(r => r.trend < 0).slice(0, 3) || []

  return (
    <div className="space-y-8">
      {/* Premium Header with Gradient */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/40 via-indigo-900/40 to-pink-900/40 border border-purple-500/30 p-8 backdrop-blur-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-400/50 backdrop-blur-sm">
                <BarChart3 className="w-6 h-6 text-purple-300" />
              </div>
        <div>
                <h2 className="text-4xl font-bold text-white mb-1">Analytics Command Center</h2>
                <p className="text-purple-200/80 text-lg">Real-time team performance intelligence</p>
              </div>
            </div>
        </div>
          <div className="flex items-center gap-3">
          <select 
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
              className="px-5 py-3 bg-black/40 border border-purple-500/30 rounded-xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-sm"
          >
              <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 6 Months</option>
            <option value="all">All Time</option>
          </select>
            <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-purple-600/50 hover:shadow-xl hover:shadow-purple-600/60">
            <Download className="w-4 h-4" />
              Export Full Report
          </button>
        </div>
      </div>
      </motion.div>

      {/* Enhanced Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Sessions', 
            value: analytics.totalSessions.toLocaleString(), 
            change: `${analytics.changes.sessions > 0 ? '+' : ''}${analytics.changes.sessions}%`, 
            changeValue: analytics.changes.sessions,
            icon: Target, 
            color: 'purple',
            gradient: 'from-purple-500/20 to-purple-600/20',
            borderColor: 'border-purple-500/30',
            subtitle: 'Training sessions completed'
          },
          { 
            label: 'Team Average Score', 
            value: `${analytics.teamAverage}%`, 
            change: `${analytics.changes.score > 0 ? '+' : ''}${analytics.changes.score}%`, 
            changeValue: analytics.changes.score,
            icon: TrendingUp, 
            color: 'emerald',
            gradient: 'from-emerald-500/20 to-green-600/20',
            borderColor: 'border-emerald-500/30',
            subtitle: 'Overall performance rating'
          },
          { 
            label: 'Active Team Members', 
            value: analytics.activeReps, 
            change: `${analytics.changes.reps > 0 ? '+' : ''}${analytics.changes.reps}`, 
            changeValue: analytics.changes.reps,
            icon: Users, 
            color: 'cyan',
            gradient: 'from-cyan-500/20 to-blue-600/20',
            borderColor: 'border-cyan-500/30',
            subtitle: 'Currently active reps'
          },
          { 
            label: 'Training ROI', 
            value: `${analytics.trainingROI}%`, 
            change: `+${analytics.changes.roi}%`, 
            changeValue: analytics.changes.roi,
            icon: DollarSign, 
            color: 'amber',
            gradient: 'from-amber-500/20 to-orange-600/20',
            borderColor: 'border-amber-500/30',
            subtitle: 'Return on training investment'
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
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${metric.gradient} border ${metric.borderColor} p-6 backdrop-blur-sm group hover:border-${metric.color}-400/50 transition-all duration-300`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-${metric.color}-500/20 border border-${metric.color}-400/30`}>
                    <Icon className={`w-5 h-5 text-${metric.color}-300`} />
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg bg-${isPositive ? 'emerald' : 'red'}-500/20 border border-${isPositive ? 'emerald' : 'red'}-500/30`}>
                    {isPositive ? (
                      <ArrowUpRight className={`w-3.5 h-3.5 text-emerald-300`} />
                    ) : (
                      <ArrowDownRight className={`w-3.5 h-3.5 text-red-300`} />
                    )}
                    <span className={`text-xs font-semibold text-${isPositive ? 'emerald' : 'red'}-300`}>
                  {metric.change}
                </span>
                  </div>
                </div>
                <p className="text-4xl font-bold text-white mb-1">{metric.value}</p>
                <p className="text-sm font-medium text-white/80 mb-1">{metric.label}</p>
                <p className="text-xs text-white/50">{metric.subtitle}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Tab Navigation for Detailed Views */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'reps', label: 'Rep Performance', icon: Users },
          { id: 'skills', label: 'Skills Analysis', icon: Brain },
          { id: 'revenue', label: 'Revenue Impact', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = selectedMetric === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedMetric(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600/40 to-indigo-600/40 text-white border border-purple-500/50'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {selectedMetric === 'overview' && (
        <div className="space-y-6">
          {/* Performance Trends - Enhanced */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
              className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Performance Trend Analysis</h3>
                  <p className="text-sm text-white/60">Team vs. Industry benchmark</p>
                </div>
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
          {analytics.performanceData && analytics.performanceData.length > 0 ? (
                <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analytics.performanceData}>
                      <defs>
                        <linearGradient id="teamAvgGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="topPerfGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                          backgroundColor: '#1a1a2e',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                          color: '#fff'
                    }}
                  />
                  <Legend />
                      <Area type="monotone" dataKey="teamAvg" fill="url(#teamAvgGradient)" stroke="#8B5CF6" strokeWidth={2} name="Team Average" />
                      <Area type="monotone" dataKey="topPerformer" fill="url(#topPerfGradient)" stroke="#10B981" strokeWidth={2} name="Top Performer" />
                      <Line type="monotone" dataKey="industry" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" name="Industry Avg" dot={false} />
                    </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-400">
              <p>Not enough data to show trend</p>
            </div>
          )}
        </motion.div>

            {/* Daily Performance Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Daily Performance</h3>
                  <p className="text-sm text-white/60">Last 30 days activity</p>
                </div>
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              {analytics.dailyPerformance && analytics.dailyPerformance.length > 0 ? (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.dailyPerformance}>
                      <defs>
                        <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                      <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '11px' }} />
                      <YAxis yAxisId="left" stroke="#64748b" style={{ fontSize: '12px' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#64748b" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a2e',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend />
                      <Area yAxisId="left" type="monotone" dataKey="sessions" fill="url(#sessionsGradient)" stroke="#06B6D4" strokeWidth={2} name="Sessions" />
                      <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="#8B5CF6" strokeWidth={2} name="Avg Score" dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} strokeDasharray="3 3" name="Revenue ($)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-400">
                  <p>Not enough data</p>
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
              className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30">
                  <Award className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Top Performers</h3>
                  <p className="text-xs text-emerald-300/80">Leading the team this period</p>
                </div>
              </div>
              <div className="space-y-4">
                {topPerformers.map((rep, idx) => (
                  <div key={rep.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500/30 to-green-500/30 flex items-center justify-center border border-emerald-400/30">
                          <span className="text-emerald-300 font-bold text-lg">{idx + 1}</span>
                        </div>
                        {idx === 0 && (
                          <div className="absolute -top-1 -right-1">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{rep.name}</p>
                        <p className="text-xs text-white/60">{rep.sessions} sessions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-emerald-300">{rep.avgScore}%</span>
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-xs text-white/50">+{rep.trend}% trend</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30">
                  <AlertCircle className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Needs Attention</h3>
                  <p className="text-xs text-amber-300/80">Performance declining</p>
                </div>
              </div>
              <div className="space-y-4">
                {needsAttention.map((rep) => (
                  <div key={rep.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-amber-500/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center border border-amber-400/30">
                        <span className="text-amber-300 font-bold">{rep.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">{rep.name}</p>
                        <p className="text-xs text-white/60">{rep.sessions} sessions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-amber-300">{rep.avgScore}%</span>
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      </div>
                      <p className="text-xs text-red-400">{rep.trend}% trend</p>
                    </div>
                  </div>
                ))}
                {needsAttention.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-400/50" />
                    <p>All team members performing well!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Rep Performance Tab */}
      {selectedMetric === 'reps' && analytics.repPerformance && (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Complete Team Performance</h3>
                <p className="text-sm text-white/60">Individual rep metrics and trends</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white/80 transition-all">
                <Download className="w-4 h-4" />
                Export Team Report
              </button>
            </div>
            <div className="space-y-3">
              {analytics.repPerformance.map((rep, idx) => (
                <motion.div
                  key={rep.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-5 bg-black/20 border border-white/10 rounded-xl hover:border-purple-500/30 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${
                          rep.avgScore >= 80 ? 'from-emerald-500/30 to-green-500/30 border-emerald-400/30' :
                          rep.avgScore >= 70 ? 'from-blue-500/30 to-cyan-500/30 border-blue-400/30' :
                          'from-amber-500/30 to-orange-500/30 border-amber-400/30'
                        } border flex items-center justify-center`}>
                          <span className="text-white font-bold text-lg">{rep.name.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#1a1a2e] flex items-center justify-center ${
                          rep.trend >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                          {rep.trend >= 0 ? (
                            <ArrowUpRight className="w-3 h-3 text-white" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-semibold text-lg">{rep.name}</p>
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                            rep.avgScore >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                            rep.avgScore >= 70 ? 'bg-blue-500/20 text-blue-300' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {rep.avgScore >= 80 ? 'Excellent' : rep.avgScore >= 70 ? 'Good' : 'Needs Work'}
                          </span>
                        </div>
                        <p className="text-sm text-white/60">{rep.sessions} sessions • Last active {rep.lastActive}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-white mb-1">{rep.avgScore}%</p>
                        <p className="text-xs text-white/50">Avg Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-300 mb-1">${(rep.revenue / 1000).toFixed(1)}k</p>
                        <p className="text-xs text-white/50">Revenue</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-1">
                          {Object.entries(rep.skills).map(([skill, score]) => (
                            <div key={skill} className="flex items-center gap-2">
                              <span className="text-xs text-white/50 w-20 text-right capitalize">{skill}:</span>
                              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    score >= 80 ? 'bg-emerald-500' :
                                    score >= 70 ? 'bg-blue-500' :
                                    'bg-amber-500'
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="text-xs text-white/70 w-8">{score}%</span>
                            </div>
                          ))}
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Skills Analysis Tab */}
      {selectedMetric === 'skills' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
              className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Skill Distribution</h3>
                  <p className="text-sm text-white/60">Team-wide skill breakdown</p>
                </div>
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
          {analytics.skillDistribution && analytics.skillDistribution.some(s => s.value > 0) ? (
                <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.skillDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.skillDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a2e',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                        }}
                      />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
                <div className="h-[400px] flex items-center justify-center text-slate-400">
                  <p>Not enough data</p>
            </div>
          )}
        </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Skill Progression</h3>
                  <p className="text-sm text-white/60">Period-over-period changes</p>
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-4">
                {analytics.skillProgression?.map((skill, idx) => {
                  const improvement = skill.current - skill.previous
                  return (
                    <div key={idx} className="p-4 bg-black/20 rounded-xl border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-semibold">{skill.skill}</span>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                          skill.trend === 'up' ? 'bg-emerald-500/20 text-emerald-300' :
                          skill.trend === 'down' ? 'bg-red-500/20 text-red-300' :
                          'bg-slate-500/20 text-slate-300'
                        }`}>
                          {skill.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                          {skill.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                          <span className="text-xs font-semibold">{improvement > 0 ? '+' : ''}{improvement}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                skill.current >= 75 ? 'bg-emerald-500' :
                                skill.current >= 65 ? 'bg-blue-500' :
                                'bg-amber-500'
                              }`}
                              style={{ width: `${skill.current}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-white">{skill.current}%</span>
                          <span className="text-xs text-white/50 ml-1">({skill.previous}%)</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
        </motion.div>
      </div>

          {/* Coaching Opportunities */}
          {analytics.coachingOpportunities && analytics.coachingOpportunities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30">
                  <TargetIcon className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Coaching Opportunities</h3>
                  <p className="text-sm text-purple-300/80">AI-identified improvement areas</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.coachingOpportunities.map((opp, idx) => (
                  <div key={idx} className="p-4 bg-black/20 rounded-xl border border-purple-500/20">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{opp.repName}</p>
                        <p className="text-sm text-purple-300/80 mt-1">{opp.skill}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        opp.impact === 'high' ? 'bg-red-500/20 text-red-300' :
                        opp.impact === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {opp.impact.toUpperCase()} IMPACT
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/60">Current</span>
                          <span className="text-xs text-white/60">Target</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                            style={{ width: `${(opp.currentScore / opp.targetScore) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-white">{opp.currentScore}%</span>
                        <span className="text-xs text-white/50"> → {opp.targetScore}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Revenue Impact Tab */}
      {selectedMetric === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Revenue vs. Performance</h3>
                  <p className="text-sm text-white/60">Correlation analysis</p>
                </div>
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              {analytics.repPerformance && (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analytics.repPerformance.map(r => ({ name: r.name, revenue: r.revenue, score: r.avgScore }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                      <XAxis dataKey="name" stroke="#64748b" style={{ fontSize: '11px' }} angle={-45} textAnchor="end" height={80} />
                      <YAxis yAxisId="left" stroke="#64748b" style={{ fontSize: '12px' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#64748b" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1a1a2e',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill="#10B981" name="Revenue ($)" />
                      <Line yAxisId="right" type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={3} name="Avg Score (%)" dot={{ fill: '#8B5CF6', r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/20 border border-emerald-500/30 rounded-xl p-6">
                <DollarSign className="w-8 h-8 text-emerald-300 mb-3" />
                <p className="text-3xl font-bold text-white mb-1">
                  ${analytics.repPerformance?.reduce((sum, r) => sum + r.revenue, 0).toLocaleString() || 0}
                </p>
                <p className="text-sm text-emerald-300/80">Total Team Revenue</p>
              </div>
              <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border border-purple-500/30 rounded-xl p-6">
                <TrendingUp className="w-8 h-8 text-purple-300 mb-3" />
                <p className="text-3xl font-bold text-white mb-1">
                  ${Math.round((analytics.repPerformance?.reduce((sum, r) => sum + r.revenue, 0) || 0) / (analytics.repPerformance?.length || 1)).toLocaleString()}
                </p>
                <p className="text-sm text-purple-300/80">Avg per Rep</p>
              </div>
              <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/30 rounded-xl p-6">
                <Target className="w-8 h-8 text-amber-300 mb-3" />
                <p className="text-3xl font-bold text-white mb-1">{analytics.trainingROI}%</p>
                <p className="text-sm text-amber-300/80">Training ROI</p>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Enhanced AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-br from-purple-900/30 via-indigo-900/30 to-pink-900/30 border border-purple-500/40 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-400/30">
              <Brain className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">AI-Powered Insights</h3>
              <p className="text-sm text-purple-200/80">Intelligent analysis and recommendations</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black/30 border border-purple-500/20 rounded-xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-300" />
                <p className="text-sm font-semibold text-purple-300">Trend Analysis</p>
              </div>
              <p className="text-sm text-white leading-relaxed">
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
                <p className="text-sm font-semibold text-amber-300">Activity Insights</p>
              </div>
              <p className="text-sm text-white leading-relaxed">
                {analytics.activeReps} active team members completed {analytics.totalSessions} training sessions. 
                {analytics.totalSessions / analytics.activeReps > 30 
                  ? ' Excellent engagement levels across the team.' 
                  : ' Consider increasing session frequency for optimal skill retention.'}
            </p>
          </div>
            <div className="bg-black/30 border border-emerald-500/20 rounded-xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-emerald-300" />
                <p className="text-sm font-semibold text-emerald-300">Strategic Recommendations</p>
              </div>
              <p className="text-sm text-white leading-relaxed">
              {analytics.teamAverage < 70 
                  ? 'Focus on foundational skills training. Consider one-on-one coaching sessions for reps scoring below 65%.'
                : analytics.teamAverage < 80
                  ? 'Team is performing well. Focus on objection handling and advanced closing techniques to reach next performance tier.'
                  : 'Outstanding performance! Maintain momentum with advanced scenario training and peer learning sessions.'}
            </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

