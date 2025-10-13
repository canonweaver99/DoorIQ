'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { Home, TrendingUp, BookOpen, Users as UsersIcon, Target, Award, Calendar, Clock, MessageSquare } from 'lucide-react'
import TabNavigation from '@/components/dashboard/TabNavigation'
import OverviewTab from '@/components/dashboard/tabs/OverviewTab'
import PerformanceTab from '@/components/dashboard/tabs/PerformanceTab'
import LearningTab from '@/components/dashboard/tabs/LearningTab'
import TeamTab from '@/components/dashboard/tabs/TeamTab'
import MessagesTab from '@/components/dashboard/tabs/MessagesTab'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

type LiveSession = Database['public']['Tables']['live_sessions']['Row']

// Mock data
const mockData = {
  user: {
    name: 'Alex',
    rank: 3,
  },
  quickStats: {
    sessionsThisWeek: 12,
    avgScore: 78,
    teamRank: 3,
  },
  metrics: {
    sessionsToday: { value: 3, trend: 15, trendUp: true },
    avgScore: { value: 78, trend: 5, trendUp: true },
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
  const searchParams = useSearchParams()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState('overview')
  const [userName, setUserName] = useState('Alex')
  const [realStats, setRealStats] = useState({
    sessionsThisWeek: 0,
    avgScore: 0,
    teamRank: 1
  })

  // Load tab from URL params or localStorage
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
    } else {
      const savedTab = localStorage.getItem('dashboardActiveTab')
      if (savedTab) {
        setActiveTab(savedTab)
      }
    }
  }, [searchParams])

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem('dashboardActiveTab', activeTab)
  }, [activeTab])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])
  
  // Fetch real user data
  useEffect(() => {
    fetchRealData()
  }, [])
  
  const fetchRealData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return
    
    // Get user name
    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()
    
    if (userData?.full_name) {
      setUserName(userData.full_name.split(' ')[0] || 'Alex')
    }
    
    // Get sessions from this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const { data: sessions } = await supabase
      .from('live_sessions')
      .select('overall_score, created_at')
      .eq('user_id', user.id)
      .gte('created_at', oneWeekAgo.toISOString())
    
    const sessionsThisWeek = sessions?.length || 0
    const avgScore = sessions && sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessions.length)
      : 0
    
    setRealStats({
      sessionsThisWeek,
      avgScore,
      teamRank: 1 // Will be calculated when team feature is implemented
    })
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'learning', label: 'Learning', icon: BookOpen },
    { id: 'team', label: 'Team', icon: UsersIcon },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ]

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
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent mb-2">
                Welcome back, {userName}! 👋
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Sessions', value: realStats.sessionsThisWeek, icon: Target },
                { label: 'Avg Score', value: `${realStats.avgScore}%`, icon: TrendingUp },
                { label: 'Rank', value: `#${realStats.teamRank}`, icon: Award },
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

        {/* Tab Navigation */}
        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Content with Smooth Transitions */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <OverviewTab
              key="overview"
              metrics={mockData.metrics}
              recentSessions={mockData.recentSessions}
              insights={mockData.insights}
            />
          )}
          {activeTab === 'performance' && (
            <PerformanceTab
              key="performance"
              performanceData={mockData.performanceData}
              insights={mockData.insights}
              sessions={mockData.recentSessions}
            />
          )}
          {activeTab === 'learning' && (
            <LearningTab
              key="learning"
            />
          )}
          {activeTab === 'team' && (
            <TeamTab
              key="team"
              leaderboard={mockData.leaderboard}
              userRank={mockData.user.rank}
              teamStats={{
                teamSize: mockData.metrics.teamRanking.total,
                avgTeamScore: 75,
                yourScore: mockData.metrics.avgScore.value,
              }}
            />
          )}
          {activeTab === 'messages' && (
            <MessagesTab key="messages" />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
