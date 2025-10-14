'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Target, Download, Calendar, Activity } from 'lucide-react'

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#EC4899']

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
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState('30')

  useEffect(() => {
    loadAnalytics()
  }, [timePeriod])

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/team/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Activity className="w-16 h-16 text-slate-600 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Analytics Data Yet</h3>
        <p className="text-slate-400">Complete training sessions to see performance insights</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Analytics Dashboard</h2>
          <p className="text-slate-400">Comprehensive team performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="px-4 py-2 bg-[#1e1e30] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 6 Months</option>
            <option value="all">All Time</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-purple-600/30">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Total Sessions', 
            value: analytics.totalSessions, 
            change: `${analytics.changes.sessions > 0 ? '+' : ''}${analytics.changes.sessions}%`, 
            icon: Target, 
            color: 'purple' 
          },
          { 
            label: 'Team Average', 
            value: `${analytics.teamAverage}%`, 
            change: `${analytics.changes.score > 0 ? '+' : ''}${analytics.changes.score}%`, 
            icon: TrendingUp, 
            color: 'blue' 
          },
          { 
            label: 'Active Reps', 
            value: analytics.activeReps, 
            change: `${analytics.changes.reps > 0 ? '+' : ''}${analytics.changes.reps}`, 
            icon: Users, 
            color: 'green' 
          },
          { 
            label: 'Training ROI', 
            value: `${analytics.trainingROI}%`, 
            change: `+${analytics.changes.roi}%`, 
            icon: Calendar, 
            color: 'amber' 
          },
        ].map((metric, idx) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="bg-[#1e1e30] border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 text-${metric.color}-400`} />
                <span className={`text-xs font-semibold ${
                  metric.change.startsWith('+') ? 'text-green-400' : metric.change.startsWith('-') ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {metric.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{metric.value}</p>
              <p className="text-sm text-slate-400">{metric.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Performance Trend</h3>
          {analytics.performanceData && analytics.performanceData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#64748b" style={{ fontSize: '12px' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e1e30',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="teamAvg" stroke="#8B5CF6" strokeWidth={2} name="Team Avg" />
                  <Line type="monotone" dataKey="topPerformer" stroke="#10B981" strokeWidth={2} name="Top Performer" />
                  <Line type="monotone" dataKey="industry" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" name="Industry Avg" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              <p>Not enough data to show trend</p>
            </div>
          )}
        </motion.div>

        {/* Skill Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Skill Distribution</h3>
          {analytics.skillDistribution && analytics.skillDistribution.some(s => s.value > 0) ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.skillDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.skillDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              <p>Not enough data to show distribution</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">AI-Generated Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 border border-white/10 rounded-xl p-4">
            <p className="text-sm font-medium text-purple-300 mb-2">🎯 Trend Identified</p>
            <p className="text-sm text-white">
              {analytics.changes.score > 0 
                ? `Team scores improving by ${analytics.changes.score}% this period`
                : analytics.changes.score < 0
                ? `Team scores declining by ${Math.abs(analytics.changes.score)}% - focus needed`
                : 'Team performance is stable'}
            </p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-xl p-4">
            <p className="text-sm font-medium text-amber-300 mb-2">⚠️ Activity Level</p>
            <p className="text-sm text-white">
              {analytics.activeReps} active reps completed {analytics.totalSessions} sessions
            </p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-xl p-4">
            <p className="text-sm font-medium text-green-300 mb-2">💡 Recommendation</p>
            <p className="text-sm text-white">
              {analytics.teamAverage < 70 
                ? 'Focus on fundamentals - team average below target'
                : analytics.teamAverage < 80
                ? 'Good progress - focus on objection handling'
                : 'Excellent performance - maintain momentum'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
