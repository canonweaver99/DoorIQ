'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, Target, Mail, Calendar, Trophy, Download, Activity, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Mock data
const teamData = {
  totalReps: 24,
  activeNow: 18,
  teamAverage: 78,
  totalEarned: 24750,
  monthlyChange: 3,
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

// Revenue chart data by time period
const dailyRevenueData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return {
    period: i % 7 === 0 ? dateStr : dayName,
    revenue: Math.floor(3000 + Math.random() * 4000),
    repsWhoSold: Math.floor(5 + Math.random() * 12),
    totalSales: Math.floor(8 + Math.random() * 20)
  }
})

const weeklyRevenueData = Array.from({ length: 12 }, (_, i) => {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - (11 - i) * 7)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  return {
    period: `Week ${i + 1}`,
    fullPeriod: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    revenue: Math.floor(18000 + Math.random() * 15000),
    repsWhoSold: Math.floor(12 + Math.random() * 8),
    totalSales: Math.floor(45 + Math.random() * 60)
  }
})

const monthlyRevenueData = [
  { period: 'Jan', revenue: 62500, repsWhoSold: 18, totalSales: 245 },
  { period: 'Feb', revenue: 58200, repsWhoSold: 16, totalSales: 228 },
  { period: 'Mar', revenue: 71800, repsWhoSold: 20, totalSales: 282 },
  { period: 'Apr', revenue: 85300, repsWhoSold: 22, totalSales: 315 },
  { period: 'May', revenue: 68900, repsWhoSold: 19, totalSales: 265 },
  { period: 'Jun', revenue: 78400, repsWhoSold: 21, totalSales: 298 },
  { period: 'Jul', revenue: 82100, repsWhoSold: 23, totalSales: 308 },
  { period: 'Aug', revenue: 69500, repsWhoSold: 18, totalSales: 272 },
  { period: 'Sep', revenue: 88700, repsWhoSold: 24, totalSales: 335 },
  { period: 'Oct', revenue: 76200, repsWhoSold: 20, totalSales: 289 },
  { period: 'Nov', revenue: 84600, repsWhoSold: 22, totalSales: 318 },
  { period: 'Dec', revenue: 92800, repsWhoSold: 24, totalSales: 348 },
]

export default function TeamOverview() {
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month'>('month')
  
  // Get data based on selected time period
  const getChartData = () => {
    switch (timePeriod) {
      case 'day':
        return dailyRevenueData
      case 'week':
        return weeklyRevenueData
      case 'month':
        return monthlyRevenueData
      default:
        return monthlyRevenueData
    }
  }

  const chartData = getChartData()
  
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
          <p className="metric-change text-green-400">+{teamData.monthlyChange} from last month</p>
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
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Team Performance</h3>
              <p className="text-sm text-slate-400 mt-1">Total team revenue over time</p>
            </div>
            
            {/* Time Period Toggle */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => setTimePeriod('day')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  timePeriod === 'day'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTimePeriod('week')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  timePeriod === 'week'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimePeriod('month')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  timePeriod === 'month'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="period" 
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                angle={timePeriod === 'day' ? -45 : 0}
                textAnchor={timePeriod === 'day' ? 'end' : 'middle'}
                height={timePeriod === 'day' ? 60 : 30}
              />
              <YAxis 
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-[#1e1e30]/95 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                        <p className="text-white font-semibold mb-2">
                          {data.fullPeriod || data.period}
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm text-purple-300">
                            Revenue: <span className="font-bold text-white">${data.revenue.toLocaleString()}</span>
                          </p>
                          <p className="text-sm text-cyan-300">
                            Reps Who Sold: <span className="font-bold text-white">{data.repsWhoSold}</span>
                          </p>
                          <p className="text-sm text-green-300">
                            Total Sales: <span className="font-bold text-white">{data.totalSales}</span>
                          </p>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar 
                dataKey="revenue" 
                fill="url(#revenueGradient)"
                radius={[8, 8, 0, 0]}
                maxBarSize={60}
                label={{
                  position: 'top',
                  fill: '#9CA3AF',
                  fontSize: 10,
                  formatter: (value: number) => `$${(value / 1000).toFixed(1)}k`
                }}
              />
            </BarChart>
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
