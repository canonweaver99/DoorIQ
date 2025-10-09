'use client'

import { motion } from 'framer-motion'
import { Users, TrendingUp, Target, Mail, Calendar, Trophy, Download, Activity, DollarSign } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Mock data
const teamData = {
  totalReps: 24,
  activeNow: 18,
  teamAverage: 78,
  totalEarned: 24750,
  monthlyChange: 8.3,
  weeklyChange: 5.2,
  earningsChange: 15.3,
  activeChange: 3,
}

const topPerformers = [
  { 
    id: 1,
    name: 'Marcus Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    score: 92,
    trend: 'up',
    change: '+8%'
  },
  { 
    id: 2,
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    score: 89,
    trend: 'up',
    change: '+5%'
  },
  { 
    id: 3,
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    score: 86,
    trend: 'up',
    change: '+3%'
  },
  { 
    id: 4,
    name: 'Emma Wilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    score: 84,
    trend: 'down',
    change: '-2%'
  },
  { 
    id: 5,
    name: 'John Doe',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    score: 82,
    trend: 'up',
    change: '+1%'
  },
]

// Performance chart data
const performanceData = [
  { month: 'Jan', teamAvg: 72, topPerformer: 88, industryAvg: 68 },
  { month: 'Feb', teamAvg: 68, topPerformer: 85, industryAvg: 67 },
  { month: 'Mar', teamAvg: 75, topPerformer: 90, industryAvg: 69 },
  { month: 'Apr', teamAvg: 82, topPerformer: 94, industryAvg: 70 },
  { month: 'May', teamAvg: 73, topPerformer: 87, industryAvg: 68 },
  { month: 'Jun', teamAvg: 77, topPerformer: 91, industryAvg: 71 },
  { month: 'Jul', teamAvg: 79, topPerformer: 89, industryAvg: 69 },
  { month: 'Aug', teamAvg: 74, topPerformer: 86, industryAvg: 68 },
  { month: 'Sep', teamAvg: 80, topPerformer: 93, industryAvg: 72 },
  { month: 'Oct', teamAvg: 76, topPerformer: 88, industryAvg: 70 },
  { month: 'Nov', teamAvg: 81, topPerformer: 90, industryAvg: 71 },
  { month: 'Dec', teamAvg: 85, topPerformer: 95, industryAvg: 73 },
]

export default function TeamOverview() {
  return (
    <div className="space-y-8">
      {/* TOP METRICS ROW - 4 Minimal Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="metric-card"
        >
          <DollarSign className="w-4 h-4 text-slate-400 mb-4" />
          <p className="metric-value">${teamData.totalEarned.toLocaleString()}</p>
          <p className="metric-label">Total Earned</p>
          <p className="metric-change text-green-400">+{teamData.earningsChange}% from last month</p>
        </motion.div>

        {/* Team Average */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="metric-card"
        >
          <Target className="w-4 h-4 text-slate-400 mb-4" />
          <p className="metric-value">{teamData.teamAverage}%</p>
          <p className="metric-label">Team Average</p>
          <p className="metric-change text-green-400">+{teamData.weeklyChange}% from last week</p>
        </motion.div>

        {/* Total Reps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="metric-card"
        >
          <Users className="w-4 h-4 text-slate-400 mb-4" />
          <p className="metric-value">{teamData.totalReps}</p>
          <p className="metric-label">Total Reps</p>
          <p className="metric-change text-green-400">+{teamData.monthlyChange}% from last month</p>
        </motion.div>

        {/* Active Now */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="metric-card"
        >
          <Activity className="w-4 h-4 text-green-400 mb-4" />
          <p className="metric-value">{teamData.activeNow}</p>
          <p className="metric-label">Active Now</p>
          <p className="metric-change text-slate-400">+{teamData.activeChange} since last hour</p>
        </motion.div>
      </div>

      {/* MAIN CONTENT AREA - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN - Team Performance Chart (60% / 3 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-3 performance-chart"
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Team Performance</h3>
            <p className="text-sm text-slate-400 mt-1">Monthly average comparison</p>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis 
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(30, 30, 48, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line 
                type="monotone" 
                dataKey="teamAvg" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                name="Team Avg"
                dot={{ fill: '#8B5CF6', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="topPerformer" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Top Performer"
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="industryAvg" 
                stroke="#6B7280" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Industry Avg"
                dot={{ fill: '#6B7280', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* RIGHT COLUMN - Top Performers (40% / 2 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="lg:col-span-2 overview-card p-6"
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Top Performers This Week</h3>
            <p className="text-sm text-slate-400 mt-1">Highest scoring reps</p>
          </div>

          <ul className="top-performers space-y-0">
            {topPerformers.map((performer, index) => (
              <motion.li
                key={performer.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                className="performer-item"
              >
                <div className="flex items-center flex-1 gap-3">
                  <span className="text-sm font-medium text-slate-500 w-6">{index + 1}</span>
                  <img
                    src={performer.avatar}
                    alt={performer.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white/5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{performer.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">{performer.score}%</span>
                  <span className={`text-xs font-medium ${
                    performer.trend === 'up' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {performer.change}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>

          <button className="w-full mt-6 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            View All Reps →
          </button>
        </motion.div>
      </div>

      {/* BOTTOM ROW - Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="quick-actions"
      >
        <button className="action-card">
          <Mail className="w-5 h-5 text-slate-400 mb-3 mx-auto" />
          <p className="text-sm font-medium text-white">Send Team Message</p>
        </button>

        <button className="action-card">
          <Calendar className="w-5 h-5 text-slate-400 mb-3 mx-auto" />
          <p className="text-sm font-medium text-white">Schedule Training</p>
        </button>

        <button className="action-card">
          <Trophy className="w-5 h-5 text-slate-400 mb-3 mx-auto" />
          <p className="text-sm font-medium text-white">Create Challenge</p>
        </button>

        <button className="action-card">
          <Download className="w-5 h-5 text-slate-400 mb-3 mx-auto" />
          <p className="text-sm font-medium text-white">Export Report</p>
        </button>
      </motion.div>
    </div>
  )
}
