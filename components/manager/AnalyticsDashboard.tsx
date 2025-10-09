'use client'

import { motion } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Target, Download, Calendar } from 'lucide-react'

const performanceData = [
  { month: 'Apr', teamAvg: 72, topPerformer: 88, industry: 75 },
  { month: 'May', teamAvg: 75, topPerformer: 90, industry: 76 },
  { month: 'Jun', teamAvg: 78, topPerformer: 92, industry: 77 },
  { month: 'Jul', teamAvg: 76, topPerformer: 89, industry: 76 },
  { month: 'Aug', teamAvg: 80, topPerformer: 94, industry: 78 },
  { month: 'Sep', teamAvg: 82, topPerformer: 95, industry: 79 },
]

const skillDistribution = [
  { name: 'Rapport', value: 85 },
  { name: 'Discovery', value: 78 },
  { name: 'Objection Handling', value: 82 },
  { name: 'Closing', value: 88 },
]

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#EC4899']

export default function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Analytics Dashboard</h2>
          <p className="text-slate-400">Comprehensive team performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-4 py-2 bg-[#1e1e30] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40">
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
            <option>Last 6 Months</option>
            <option>All Time</option>
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
          { label: 'Total Sessions', value: 247, change: '+12%', icon: Target, color: 'purple' },
          { label: 'Team Average', value: '82%', change: '+5%', icon: TrendingUp, color: 'blue' },
          { label: 'Active Reps', value: 24, change: '+2', icon: Users, color: 'green' },
          { label: 'Training ROI', value: '340%', change: '+18%', icon: Calendar, color: 'amber' },
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
                <span className="text-xs font-semibold text-green-400">{metric.change}</span>
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
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
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
        </motion.div>

        {/* Skill Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Skill Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={skillDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {skillDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
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
            <p className="text-sm text-white">Team scores increase 15% on Tuesday afternoons</p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-xl p-4">
            <p className="text-sm font-medium text-amber-300 mb-2">⚠️ Anomaly Detected</p>
            <p className="text-sm text-white">3 reps showing declining performance this week</p>
          </div>
          <div className="bg-white/10 border border-white/10 rounded-xl p-4">
            <p className="text-sm font-medium text-green-300 mb-2">💡 Recommendation</p>
            <p className="text-sm text-white">Focus team training on objection handling next week</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

