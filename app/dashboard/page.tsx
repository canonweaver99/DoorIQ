'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Target, Award, Users, Zap, Calendar, Clock } from 'lucide-react'
import MetricCard from '@/components/dashboard/MetricCard'
import PerformanceChart from '@/components/dashboard/PerformanceChart'
import InsightsPanel from '@/components/dashboard/InsightsPanel'
import SessionsTable from '@/components/dashboard/SessionsTable'
import PlaybookSection from '@/components/dashboard/PlaybookSection'
import LeaderboardWidget from '@/components/dashboard/LeaderboardWidget'
import UpcomingChallenges from '@/components/dashboard/UpcomingChallenges'

// Mock data
const mockData = {
  user: {
    name: 'Alex',
    rank: 3,
    streak: 7,
  },
  quickStats: {
    sessionsThisWeek: 12,
    avgScore: 78,
    currentStreak: 7,
    teamRank: 3,
  },
  metrics: {
    sessionsToday: { value: 3, trend: 15, trendUp: true },
    avgScore: { value: 78, trend: 5, trendUp: true },
    skillsMastered: { value: 8, total: 12, percentage: 67 },
    teamRanking: { value: 3, total: 24, trend: 2, trendUp: true },
  },
  insights: [
    {
      id: 1,
      text: 'Your rapport building improved 23% this week',
      action: 'Keep it up!',
      type: 'success',
    },
    {
      id: 2,
      text: 'Try more assumptive language in closes',
      action: 'Practice Now',
      type: 'suggestion',
    },
    {
      id: 3,
      text: 'Peak performance time: 2-4 PM',
      action: 'Learn More',
      type: 'insight',
    },
    {
      id: 4,
      text: 'Focus area: Handling price objections',
      action: 'Practice Now',
      type: 'warning',
    },
  ],
  performanceData: [
    { date: 'Mon', overall: 75, rapport: 80, discovery: 72, objections: 70, closing: 78 },
    { date: 'Tue', overall: 78, rapport: 82, discovery: 75, objections: 74, closing: 80 },
    { date: 'Wed', overall: 76, rapport: 78, discovery: 74, objections: 72, closing: 79 },
    { date: 'Thu', overall: 82, rapport: 85, discovery: 80, objections: 78, closing: 84 },
    { date: 'Fri', overall: 80, rapport: 83, discovery: 78, objections: 76, closing: 82 },
    { date: 'Sat', overall: 85, rapport: 88, discovery: 83, objections: 82, closing: 86 },
    { date: 'Sun', overall: 83, rapport: 85, discovery: 81, objections: 80, closing: 84 },
  ],
  recentSessions: [
    {
      id: 1,
      date: '2025-10-08',
      time: '2:30 PM',
      homeowner: 'Skeptical Steve',
      duration: '5:30',
      score: 85,
      feedback: 'Excellent rapport building and strong close',
    },
    {
      id: 2,
      date: '2025-10-08',
      time: '11:15 AM',
      homeowner: 'Budget Betty',
      duration: '4:45',
      score: 72,
      feedback: 'Good discovery, work on objection handling',
    },
    {
      id: 3,
      date: '2025-10-07',
      time: '3:45 PM',
      homeowner: 'Busy Bob',
      duration: '3:20',
      score: 78,
      feedback: 'Quick and efficient, strong assumptive language',
    },
    {
      id: 4,
      date: '2025-10-07',
      time: '10:30 AM',
      homeowner: 'Decision Debbie',
      duration: '6:15',
      score: 68,
      feedback: 'Good start, need to work on closing confidence',
    },
    {
      id: 5,
      date: '2025-10-06',
      time: '4:00 PM',
      homeowner: 'Austin',
      duration: '5:00',
      score: 88,
      feedback: 'Outstanding performance across all areas',
    },
  ],
  leaderboard: [
    { id: 1, name: 'Sarah Chen', score: 892, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
    { id: 2, name: 'Marcus Johnson', score: 875, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
    { id: 3, name: 'Alex (You)', score: 840, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', isCurrentUser: true },
    { id: 4, name: 'David Martinez', score: 825, avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' },
    { id: 5, name: 'Emma Wilson', score: 810, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
  ],
}

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-2">
                Welcome back, {mockData.user.name}! 👋
              </h1>
              <div className="flex items-center gap-4 text-slate-400 text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(currentTime)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(currentTime)}
                </span>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Sessions', value: mockData.quickStats.sessionsThisWeek, icon: Target },
                { label: 'Avg Score', value: `${mockData.quickStats.avgScore}%`, icon: TrendingUp },
                { label: 'Streak', value: `${mockData.quickStats.currentStreak}d`, icon: Zap },
                { label: 'Rank', value: `#${mockData.quickStats.teamRank}`, icon: Award },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <stat.icon className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-slate-400">{stat.label}</span>
                  </div>
                  <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <MetricCard
            title="Practice Sessions Today"
            value={mockData.metrics.sessionsToday.value}
            subtitle="sessions completed"
            trend={mockData.metrics.sessionsToday.trend}
            trendUp={mockData.metrics.sessionsToday.trendUp}
            icon={Target}
            delay={0}
          />
          <MetricCard
            title="Average Score"
            value={`${mockData.metrics.avgScore.value}%`}
            subtitle="this week"
            trend={mockData.metrics.avgScore.trend}
            trendUp={mockData.metrics.avgScore.trendUp}
            icon={TrendingUp}
            delay={0.1}
          />
          <MetricCard
            title="Skills Mastered"
            value={mockData.metrics.skillsMastered.value}
            subtitle={`of ${mockData.metrics.skillsMastered.total} total`}
            progress={mockData.metrics.skillsMastered.percentage}
            icon={Award}
            delay={0.2}
          />
          <MetricCard
            title="Team Ranking"
            value={`#${mockData.metrics.teamRanking.value}`}
            subtitle={`of ${mockData.metrics.teamRanking.total} members`}
            trend={mockData.metrics.teamRanking.trend}
            trendUp={mockData.metrics.teamRanking.trendUp}
            icon={Users}
            delay={0.3}
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <InsightsPanel insights={mockData.insights} />
            <PerformanceChart data={mockData.performanceData} />
            <SessionsTable sessions={mockData.recentSessions} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <PlaybookSection />
            <LeaderboardWidget leaderboard={mockData.leaderboard} />
            <UpcomingChallenges />
          </div>
        </div>
      </div>
    </div>
  )
}
