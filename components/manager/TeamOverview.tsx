'use client'

import { motion } from 'framer-motion'
import { Users, TrendingUp, Target, Award, AlertCircle, CheckCircle, Trophy, Clock, ArrowRight, Mail, Calendar, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'

// Mock data
const teamData = {
  name: 'Sales Team Alpha',
  managerName: 'Sarah Johnson',
  totalReps: 24,
  activeToday: 18,
  avgScore: 78,
  weekOverWeekChange: 5.2,
  topPerformer: {
    name: 'Marcus Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    score: 92,
    sessions: 8,
  },
  teamGoals: [
    { name: 'Complete 100 sessions', current: 87, total: 100 },
    { name: 'Maintain 80% avg score', current: 78, target: 80 },
    { name: 'Train all reps on new objections', current: 20, total: 24 },
  ],
  alerts: [
    { id: 1, type: 'warning', message: '3 reps below target score', priority: 'high' },
    { id: 2, type: 'info', message: '2 training modules expiring soon', priority: 'medium' },
  ],
  activities: [
    { id: 1, type: 'training', user: 'John Doe', action: 'completed training session', score: 85, time: '2 min ago' },
    { id: 2, type: 'achievement', user: 'Sarah Chen', action: 'reached 7-day streak', time: '15 min ago' },
    { id: 3, type: 'training', user: 'Marcus Johnson', action: 'completed training session', score: 92, time: '23 min ago' },
    { id: 4, type: 'issue', user: 'Alex Rivera', action: 'scored below 60%', score: 58, time: '1 hour ago' },
    { id: 5, type: 'training', user: 'Emma Wilson', action: 'completed training session', score: 88, time: '1 hour ago' },
  ],
}

export default function TeamOverview() {
  const [dateRange, setDateRange] = useState('week')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'training':
        return <Target className="w-4 h-4" />
      case 'achievement':
        return <Trophy className="w-4 h-4 text-yellow-400" />
      case 'issue':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return <CheckCircle className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'training':
        return 'border-blue-500/30 bg-blue-500/10'
      case 'achievement':
        return 'border-yellow-500/30 bg-yellow-500/10'
      case 'issue':
        return 'border-red-500/30 bg-red-500/10'
      default:
        return 'border-green-500/30 bg-green-500/10'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1">{teamData.name}</h2>
          <p className="text-slate-400">Managed by {teamData.managerName}</p>
        </div>

        <div className="flex items-center gap-2">
          {['today', 'week', 'month'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                dateRange === range
                  ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-purple-400" />
            <TrendingUp className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{teamData.totalReps}</p>
          <p className="text-sm text-slate-400">Total Reps</p>
          <p className="text-xs text-green-400 mt-1">{teamData.activeToday} active today</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-blue-400" />
            <div className="flex items-center gap-1 text-xs font-semibold text-green-400">
              <TrendingUp className="w-3 h-3" />
              +{teamData.weekOverWeekChange}%
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{teamData.avgScore}%</p>
          <p className="text-sm text-slate-400">Team Avg Score</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">87%</p>
          <p className="text-sm text-slate-400">Training Completion</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-medium text-amber-300">
              {teamData.alerts.length}
            </span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{teamData.alerts.length}</p>
          <p className="text-sm text-slate-400">Active Alerts</p>
        </motion.div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Performance Cards - 2 columns on large screens */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Reps Today */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
                <Users className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Active Reps Today</h3>
                <p className="text-xs text-slate-400">Live status</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {['In Training', 'In Field', 'Available', 'Offline'].map((status, idx) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      idx === 0 ? 'bg-blue-400' : idx === 1 ? 'bg-green-400' : idx === 2 ? 'bg-yellow-400' : 'bg-slate-400'
                    }`} />
                    <span className="text-sm text-slate-300">{status}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {idx === 0 ? 5 : idx === 1 ? 8 : idx === 2 ? 5 : 6}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Performer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Top Performer</h3>
                <p className="text-xs text-slate-300">This week</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <img
                src={teamData.topPerformer.avatar}
                alt={teamData.topPerformer.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/50"
              />
              <div className="flex-1">
                <p className="text-lg font-semibold text-white">{teamData.topPerformer.name}</p>
                <div className="flex items-center gap-4 mt-1">
                  <div>
                    <p className="text-2xl font-bold text-purple-300">{teamData.topPerformer.score}%</p>
                    <p className="text-xs text-slate-400">Avg Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{teamData.topPerformer.sessions}</p>
                    <p className="text-xs text-slate-400">Sessions</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Team Goals Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <Target className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Team Goals</h3>
                <p className="text-xs text-slate-400">Weekly targets</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {teamData.teamGoals.map((goal, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300">{goal.name}</span>
                    <span className="text-sm font-semibold text-white">
                      {goal.current}/{goal.total || goal.target}
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(goal.current / (goal.total || goal.target)) * 100}%` }}
                      transition={{ duration: 1, delay: 0.7 + idx * 0.1 }}
                      className={`h-full rounded-full ${
                        (goal.current / (goal.total || goal.target)) >= 0.8 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Alerts & Issues */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Alerts & Issues</h3>
                <p className="text-xs text-slate-400">Requires attention</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {teamData.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border ${
                    alert.priority === 'high' ? 'border-red-500/30 bg-red-500/10' : 'border-amber-500/30 bg-amber-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-white flex-1">{alert.message}</p>
                    <button className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Real-Time Activity Feed - 1 column on large screens */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Live Activity</h3>
                <p className="text-xs text-slate-400">Real-time updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
            {teamData.activities.map((activity, idx) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + idx * 0.05 }}
                className={`p-4 rounded-xl border ${getActivityColor(activity.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/10 rounded-lg">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{activity.user}</p>
                    <p className="text-sm text-slate-300">{activity.action}</p>
                    {activity.score && (
                      <p className={`text-xs font-semibold mt-1 ${
                        activity.score >= 80 ? 'text-green-400' : activity.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        Score: {activity.score}%
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <button className="w-full mt-4 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-sm font-medium text-white transition-all group">
            View All Activity
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* Quick Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <button className="flex items-center gap-3 bg-[#1e1e30] hover:bg-[#252538] border border-white/10 hover:border-purple-500/50 rounded-2xl p-4 transition-all group">
          <div className="p-2 bg-purple-500/10 rounded-xl">
            <Mail className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Send Team Message</p>
            <p className="text-xs text-slate-400">Broadcast to all reps</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        <button className="flex items-center gap-3 bg-[#1e1e30] hover:bg-[#252538] border border-white/10 hover:border-purple-500/50 rounded-2xl p-4 transition-all group">
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Schedule Training</p>
            <p className="text-xs text-slate-400">Create team session</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        <button className="flex items-center gap-3 bg-[#1e1e30] hover:bg-[#252538] border border-white/10 hover:border-purple-500/50 rounded-2xl p-4 transition-all group">
          <div className="p-2 bg-green-500/10 rounded-xl">
            <Trophy className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Create Challenge</p>
            <p className="text-xs text-slate-400">Gamify training</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>

        <button className="flex items-center gap-3 bg-[#1e1e30] hover:bg-[#252538] border border-white/10 hover:border-purple-500/50 rounded-2xl p-4 transition-all group">
          <div className="p-2 bg-amber-500/10 rounded-xl">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Export Report</p>
            <p className="text-xs text-slate-400">Download analytics</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </button>
      </motion.div>
    </div>
  )
}

