'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { 
  Home, 
  TrendingUp, 
  BookOpen, 
  Users as UsersIcon, 
  Target, 
  Award, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Upload,
  Sparkles,
  Zap,
  DollarSign
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { useSubscription } from '@/hooks/useSubscription'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'

// Helper to get cutout bubble image (no background)
const getAgentBubbleImage = (agentName: string | null): string => {
  if (!agentName) return '/agents/default.png'
  const agentNameTyped = agentName as AllowedAgentName
  if (PERSONA_METADATA[agentNameTyped]?.bubble?.image) {
    return PERSONA_METADATA[agentNameTyped].bubble.image
  }
  return '/agents/default.png'
}

type LiveSession = Database['public']['Tables']['live_sessions']['Row']

// Tab Navigation Component
interface Tab {
  id: string
  label: string
  icon: any
  locked?: boolean
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
}

function TabNavigation({ tabs, activeTab, onChange }: TabNavigationProps) {
  return (
    <div className="mb-8 border-b border-[#2a2a2a]">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => !tab.locked && onChange(tab.id)}
              disabled={tab.locked}
              className={`relative flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                tab.locked
                  ? 'text-[#4a4a4a] cursor-not-allowed'
                  : isActive
                  ? 'text-white bg-[#1a1a1a]'
                  : 'text-[#888888] hover:text-[#bbbbbb]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTabBorder"
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#a855f7]"
                  style={{ boxShadow: '0 2px 8px rgba(168, 85, 247, 0.3)' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// Main Dashboard Component
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]" />}> 
      <DashboardPageContent />
    </Suspense>
  )
}

function DashboardPageContent() {
  const searchParams = useSearchParams()
  const subscription = useSubscription()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState('overview')
  const [userName, setUserName] = useState('Alex')
  const [realStats, setRealStats] = useState({
    sessionsThisWeek: 0,
    avgScore: 0,
    teamRank: 1,
    totalEarnings: 0
  })
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  
  const isPaidUser = subscription.hasActiveSubscription

  // Load tab from URL params or localStorage
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
    } else {
      const savedTab = localStorage.getItem('newDashboardActiveTab')
      if (savedTab) {
        setActiveTab(savedTab)
      }
    }
  }, [searchParams])

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem('newDashboardActiveTab', activeTab)
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
    
    // Get user name and earnings
    const { data: userData } = await supabase
      .from('users')
      .select('full_name, virtual_earnings')
      .eq('id', user.id)
      .single()
    
    if (userData?.full_name) {
      // Capitalize first name properly
      const firstName = userData.full_name.split(' ')[0] || 'Alex'
      setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase())
    }
    
    // Get user's team_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single()
    
    // Get sessions from this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const { data: sessions } = await supabase
      .from('live_sessions')
      .select('overall_score, created_at, homeowner_name, virtual_earnings')
      .eq('user_id', user.id)
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: false })
    
    const sessionsThisWeek = sessions?.length || 0
    const avgScore = sessions && sessions.length > 0
      ? Math.round(sessions.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / sessions.length)
      : 0
    
    // Calculate team rank based on virtual_earnings
    let teamRank = 1
    if (userProfile?.team_id) {
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id, virtual_earnings')
        .eq('team_id', userProfile.team_id)
        .not('virtual_earnings', 'is', null)
      
      if (teamMembers && teamMembers.length > 1) {
        // Sort by virtual_earnings descending
        const sorted = [...teamMembers].sort((a, b) => (b.virtual_earnings || 0) - (a.virtual_earnings || 0))
        const userIndex = sorted.findIndex(m => m.id === user.id)
        teamRank = userIndex >= 0 ? userIndex + 1 : teamMembers.length
      }
    }
    
    setRealStats({
      sessionsThisWeek,
      avgScore,
      teamRank,
      totalEarnings: userData?.virtual_earnings || 0
    })
  }

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: Home, locked: false },
    { id: 'learning', label: 'Learning', icon: BookOpen, locked: !isPaidUser },
    { id: 'upload', label: 'Upload', icon: Upload, locked: !isPaidUser },
    { id: 'team', label: 'Team', icon: UsersIcon, locked: !isPaidUser },
    { id: 'messages', label: 'Messages', icon: MessageSquare, locked: !isPaidUser },
  ]

  const quickStats = [
    { 
      label: 'Sessions', 
      value: realStats.sessionsThisWeek, 
      icon: Target,
      iconColor: '#3b82f6',
      iconBgColor: 'rgba(59, 130, 246, 0.2)',
      glowColor: 'rgba(59, 130, 246, 0.2)',
      valueClass: 'text-[26px]'
    },
    { 
      label: 'Rank', 
      value: `#${realStats.teamRank}`, 
      icon: Award,
      iconColor: '#f59e0b',
      iconBgColor: 'rgba(245, 158, 11, 0.2)',
      glowColor: 'rgba(245, 158, 11, 0.2)',
      valueClass: 'text-2xl'
    },
    { 
      label: 'Earnings', 
      value: `$${realStats.totalEarnings.toFixed(0)}`, 
      icon: DollarSign,
      iconColor: '#10b981',
      iconBgColor: 'rgba(16, 185, 129, 0.2)',
      glowColor: 'rgba(16, 185, 129, 0.2)',
      valueClass: 'text-[26px]'
    },
  ] as const

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Minimalist Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Welcome & Time */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, {userName}
              </h1>
              <div className="flex items-center gap-4 text-white/70 text-sm">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(currentTime)}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(currentTime)}
                </span>
              </div>
            </div>

            {/* Right: Quick Stats Cards - Vibrant Icons */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {quickStats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4"
                  style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-white/60">{stat.label}</p>
                      <p className={`${stat.valueClass} font-bold text-white leading-tight`}>{stat.value}</p>
                    </div>
                    <div 
                      className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 ml-2"
                      style={{ 
                        backgroundColor: stat.iconBgColor
                      }}
                    >
                      <stat.icon className="w-[18px] h-[18px]" style={{ color: stat.iconColor }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab Content with Smooth Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
          {activeTab === 'overview' && (
            <OverviewTabContent />
          )}
          {activeTab === 'learning' && (
            <LearningTabContent />
          )}
            {activeTab === 'upload' && (
              <UploadTabContent />
            )}
            {activeTab === 'team' && (
              <TeamTabContent />
            )}
            {activeTab === 'messages' && (
              <MessagesTabContent />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Overview Tab Component (Merged with Performance)
function OverviewTabContent() {
  const [chartTimeRange, setChartTimeRange] = useState<'day' | 'week' | 'month'>('week')
  const [earningsTimeRange, setEarningsTimeRange] = useState<'day' | 'week' | 'month'>('week')
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; value: number; } | null>(null)
  const [hoveredEarnings, setHoveredEarnings] = useState<{ day: string; value: number; } | null>(null)
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const chartRef = useRef<HTMLDivElement>(null)
  const earningsRef = useRef<HTMLDivElement>(null)
  const isChartInView = useInView(chartRef, { once: true, amount: 0.3 })
  const isEarningsInView = useInView(earningsRef, { once: true, amount: 0.3 })
  
  // Fetch real data on mount
  useEffect(() => {
    fetchOverviewData()
  }, [])
  
  const fetchOverviewData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return
    
    // Get ALL user sessions for calculating averages (not just recent 4)
    const { data: allSessions } = await supabase
      .from('live_sessions')
      .select('overall_score, rapport_score, discovery_score, objection_handling_score, close_score')
      .eq('user_id', user.id)
      .not('overall_score', 'is', null)
    
    // Get recent sessions with agent_name (for display) - fetch all sessions, not just graded ones
    const { data: recentSessionsData, error: recentSessionsError } = await supabase
      .from('live_sessions')
      .select('overall_score, created_at, homeowner_name, agent_name, agent_persona, virtual_earnings')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4)
    
    if (recentSessionsError) {
      console.error('Error fetching recent sessions:', recentSessionsError)
    }
    
    // Format recent sessions for display
    if (recentSessionsData && recentSessionsData.length > 0) {
      const gradients = ['from-purple-500/30', 'from-blue-500/30', 'from-pink-500/30', 'from-green-500/30']
      
      const formattedSessions = recentSessionsData.map((session: any, idx: number) => {
        const timeAgo = Math.floor((Date.now() - new Date(session.created_at).getTime()) / (1000 * 60 * 60))
        // Try agent_name first, then agent_persona, then homeowner_name
        const agentName = session.agent_name || session.agent_persona || session.homeowner_name || null
        return {
          name: session.agent_name || session.agent_persona || session.homeowner_name || 'Practice Session',
          score: session.overall_score || 0,
          earned: session.virtual_earnings || 0,
          avatar: getAgentBubbleImage(agentName),
          time: timeAgo < 1 ? 'Just now' : timeAgo < 24 ? `${timeAgo}h ago` : `${Math.floor(timeAgo / 24)}d ago`,
          gradient: gradients[idx % gradients.length]
        }
      })
      console.log('✅ Formatted recent sessions:', formattedSessions)
      setRecentSessions(formattedSessions)
    } else {
      console.log('⚠️ No recent sessions found')
      setRecentSessions([])
    }
    
    // Fetch real notifications from messages
    const { data: messages } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(full_name)')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4)
    
    if (messages && messages.length > 0) {
      const formattedNotifications = messages.map((msg: any) => {
        const timeAgo = Math.floor((Date.now() - new Date(msg.created_at).getTime()) / (1000 * 60 * 60))
        const senderName = msg.sender?.full_name || 'Manager'
        
        return {
          type: 'manager',
          title: 'Message from Manager',
          message: msg.message || msg.message_text || '',
          time: timeAgo < 1 ? 'Just now' : timeAgo < 24 ? `${timeAgo}h ago` : `${Math.floor(timeAgo / 24)}d ago`,
          iconColor: '#a855f7',
          iconBgColor: 'rgba(168, 85, 247, 0.2)'
        }
      })
      setNotifications(formattedNotifications)
    } else {
      setNotifications([])
    }
    
    // Calculate average scores from all sessions that have scores
    if (allSessions && allSessions.length > 0) {
      // Filter sessions with valid scores for each metric
      const sessionsWithOverall = allSessions.filter((s: any) => s.overall_score !== null && s.overall_score > 0)
      const sessionsWithRapport = allSessions.filter((s: any) => s.rapport_score !== null && s.rapport_score > 0)
      const sessionsWithDiscovery = allSessions.filter((s: any) => s.discovery_score !== null && s.discovery_score > 0)
      const sessionsWithObjection = allSessions.filter((s: any) => s.objection_handling_score !== null && s.objection_handling_score > 0)
      const sessionsWithClosing = allSessions.filter((s: any) => s.close_score !== null && s.close_score > 0)
      
      const avgOverall = sessionsWithOverall.length > 0
        ? Math.round(sessionsWithOverall.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / sessionsWithOverall.length)
        : 0
      const avgRapport = sessionsWithRapport.length > 0
        ? Math.round(sessionsWithRapport.reduce((sum: number, s: any) => sum + (s.rapport_score || 0), 0) / sessionsWithRapport.length)
        : 0
      const avgDiscovery = sessionsWithDiscovery.length > 0
        ? Math.round(sessionsWithDiscovery.reduce((sum: number, s: any) => sum + (s.discovery_score || 0), 0) / sessionsWithDiscovery.length)
        : 0
      const avgObjection = sessionsWithObjection.length > 0
        ? Math.round(sessionsWithObjection.reduce((sum: number, s: any) => sum + (s.objection_handling_score || 0), 0) / sessionsWithObjection.length)
        : 0
      const avgClosing = sessionsWithClosing.length > 0
        ? Math.round(sessionsWithClosing.reduce((sum: number, s: any) => sum + (s.close_score || 0), 0) / sessionsWithClosing.length)
        : 0
      
      setPerformanceMetrics([
        {
          id: 'overall',
          title: 'Overall Score',
          value: avgOverall,
          change: '+7%',
          feedback: 'Consistency across all areas improving. Rapport and discovery skills show promise.',
          borderColor: '#4a2a6a',
          textColor: 'text-purple-200',
          bg: '#2a1a3a',
          glowColor: 'rgba(138, 43, 226, 0.1)'
        },
        {
          id: 'rapport',
          title: 'Rapport',
          value: avgRapport,
          change: '+5%',
          feedback: 'Incorporate personalized questions within the first 30 seconds.',
          borderColor: '#2a6a4a',
          textColor: 'text-emerald-200',
          bg: '#1a3a2a',
          glowColor: 'rgba(16, 185, 129, 0.1)'
        },
        {
          id: 'discovery',
          title: 'Discovery',
          value: avgDiscovery,
          change: '+13%',
          feedback: 'Dig deeper into pain points with follow-up questions.',
          borderColor: '#2a4a6a',
          textColor: 'text-blue-200',
          bg: '#1a2a3a',
          glowColor: 'rgba(59, 130, 246, 0.1)'
        },
        {
          id: 'objection',
          title: 'Objection Handling',
          value: avgObjection,
          change: '+8%',
          feedback: 'Reframe price concerns as investment discussions.',
          borderColor: '#6a4a2a',
          textColor: 'text-amber-200',
          bg: '#3a2a1a',
          glowColor: 'rgba(245, 158, 11, 0.1)'
        },
        {
          id: 'closing',
          title: 'Closing',
          value: avgClosing,
          change: '+6%',
          feedback: 'Use assumptive language: "When we install" vs "If you decide".',
          borderColor: '#6a2a4a',
          textColor: 'text-pink-200',
          bg: '#3a1a2a',
          glowColor: 'rgba(236, 72, 153, 0.1)'
        }
      ])
    } else {
      // Set default metrics when no sessions exist
      setPerformanceMetrics([
        {
          id: 'overall',
          title: 'Overall Score',
          value: 0,
          change: '+0%',
          feedback: 'Complete your first session to see your scores.',
          borderColor: '#4a2a6a',
          textColor: 'text-purple-200',
          bg: '#2a1a3a',
          glowColor: 'rgba(138, 43, 226, 0.1)'
        },
        {
          id: 'rapport',
          title: 'Rapport',
          value: 0,
          change: '+0%',
          feedback: 'Build connection in the first 30 seconds.',
          borderColor: '#2a6a4a',
          textColor: 'text-emerald-200',
          bg: '#1a3a2a',
          glowColor: 'rgba(16, 185, 129, 0.1)'
        },
        {
          id: 'discovery',
          title: 'Discovery',
          value: 0,
          change: '+0%',
          feedback: 'Ask questions to uncover pain points.',
          borderColor: '#2a4a6a',
          textColor: 'text-blue-200',
          bg: '#1a2a3a',
          glowColor: 'rgba(59, 130, 246, 0.1)'
        },
        {
          id: 'objection',
          title: 'Objection Handling',
          value: 0,
          change: '+0%',
          feedback: 'Turn concerns into opportunities.',
          borderColor: '#6a4a2a',
          textColor: 'text-amber-200',
          bg: '#3a2a1a',
          glowColor: 'rgba(245, 158, 11, 0.1)'
        },
        {
          id: 'closing',
          title: 'Closing',
          value: 0,
          change: '+0%',
          feedback: 'Use assumptive language to close.',
          borderColor: '#6a2a4a',
          textColor: 'text-pink-200',
          bg: '#3a1a2a',
          glowColor: 'rgba(236, 72, 153, 0.1)'
        }
      ])
    }
  }

  const performanceData = {
    day: [
      { day: '6am', overall: 0 },
      { day: '9am', overall: 0 },
      { day: '12pm', overall: 75 },
      { day: '3pm', overall: 82 },
      { day: '6pm', overall: 80 },
      { day: '9pm', overall: 0 },
    ],
    week: [
      { day: 'Mon', overall: 75 },
      { day: 'Tue', overall: 78 },
      { day: 'Wed', overall: 76 },
      { day: 'Thu', overall: 82 },
      { day: 'Fri', overall: 80 },
      { day: 'Sat', overall: 85 },
      { day: 'Sun', overall: 83 },
    ],
    month: [
      { day: 'Week 1', overall: 72 },
      { day: 'Week 2', overall: 78 },
      { day: 'Week 3', overall: 81 },
      { day: 'Week 4', overall: 85 },
    ],
  }

  const earningsData = {
    day: [
      { day: '6am', earnings: 0 },
      { day: '9am', earnings: 0 },
      { day: '12pm', earnings: 89 },
      { day: '3pm', earnings: 142 },
      { day: '6pm', earnings: 93 },
      { day: '9pm', earnings: 0 },
    ],
    week: [
      { day: 'Mon', earnings: 89 },
      { day: 'Tue', earnings: 142 },
      { day: 'Wed', earnings: 93 },
      { day: 'Thu', earnings: 178 },
      { day: 'Fri', earnings: 125 },
      { day: 'Sat', earnings: 156 },
      { day: 'Sun', earnings: 138 },
    ],
    month: [
      { day: 'Week 1', earnings: 324 },
      { day: 'Week 2', earnings: 489 },
      { day: 'Week 3', earnings: 567 },
      { day: 'Week 4', earnings: 721 },
    ],
  }

  const currentData = performanceData[chartTimeRange]
  const currentEarnings = earningsData[earningsTimeRange]

  // Insights and notifications data
  const insightsData = [
    {
      title: 'Rapport building',
      message: 'improvement this week',
      percentage: '+23%',
      icon: TrendingUp,
      iconColor: '#10b981',
      iconBgColor: 'rgba(16, 185, 129, 0.2)'
    },
    {
      title: 'Discovery questions',
      message: 'Ask follow-up questions to uncover deeper pain points',
      icon: Target,
      iconColor: '#3b82f6',
      iconBgColor: 'rgba(59, 130, 246, 0.2)'
    },
    {
      title: 'Peak performance',
      message: 'Sessions between 2-4 PM show highest scores',
      icon: Clock,
      iconColor: '#f59e0b',
      iconBgColor: 'rgba(245, 158, 11, 0.2)'
    },
    {
      title: 'Closing techniques',
      message: 'Assumptive language increases close rate',
      percentage: '+18%',
      icon: Award,
      iconColor: '#a855f7',
      iconBgColor: 'rgba(168, 85, 247, 0.2)'
    },
  ]

  // Use real notifications if available, otherwise show empty state
  const notificationsData = notifications.length > 0 ? notifications : []

  return (
    <div className="space-y-6">
      {/* Performance Metrics Cards - Vibrant */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {performanceMetrics.map((metric, idx) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="rounded-lg p-5"
            style={{ 
              backgroundColor: metric.bg,
              border: `2px solid ${metric.borderColor}`,
              boxShadow: `inset 0 0 20px ${metric.glowColor}, 0 4px 16px rgba(0, 0, 0, 0.4)`
            }}
          >
            <div>
              <h3 className={`text-xs font-semibold ${metric.textColor} uppercase tracking-wide mb-2`}>
                {metric.title}
              </h3>
              
              <div className="text-3xl font-bold text-white mb-2 tabular-nums">
                {metric.value}%
              </div>
              
              <div className="text-xs text-green-400 font-semibold mb-3">
                {metric.change} from last week
              </div>

              <div className="pt-3" style={{ borderTop: `1px solid ${metric.borderColor}` }}>
                <p className="text-[15px] text-slate-300 leading-relaxed">{metric.feedback}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6"
          style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 24px rgba(168, 85, 247, 0.1)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Performance Trend</h3>
              <p className="text-sm text-white/60">Track your improvement over time</p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-[#2a2a2a]">
              {(['day', 'week', 'month'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setChartTimeRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    chartTimeRange === range
                      ? 'bg-[#a855f7] text-white shadow-lg shadow-purple-500/30'
                      : 'text-[#8a8a8a] hover:text-white'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Chart */}
          <div ref={chartRef} className="relative h-64">
            {/* Tooltip overlay - positioned absolutely outside SVG */}
            {hoveredPoint && chartRef.current && (() => {
              const rect = chartRef.current.getBoundingClientRect()
              const idx = currentData.findIndex(p => p.day === hoveredPoint.day)
              const spacing = 660
              const offset = 80
              const x = 60 + offset + (idx * (spacing / (currentData.length - 1)))
              const pixelX = (x / 850) * rect.width
              const pixelY = ((280 - (hoveredPoint.value * 2.8)) / 320) * rect.height
              
              return (
                <div
                  className="absolute pointer-events-none z-50"
                  style={{
                    left: pixelX,
                    top: pixelY - 100,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="bg-[#1e1e30]/95 border border-white/20 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                    <p className="text-white font-semibold mb-2">
                      {hoveredPoint.day}
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm text-white">
                        Score: <span className="font-bold text-white">{hoveredPoint.value}%</span>
                      </p>
                    </div>
                  </div>
                </div>
              )
            })()}
            <svg className="w-full h-full" viewBox="0 0 850 320">
              <defs>
                <linearGradient id="chartAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines - Subtle */}
              {[25, 50, 75].map((value) => {
                const y = 280 - (value * 2.8)
                return (
                  <line
                    key={value}
                    x1="60"
                    y1={y}
                    x2="790"
                    y2={y}
                    stroke="#222222"
                    strokeWidth="1"
                  />
                )
              })}

              {/* Y-axis labels */}
              {[0, 25, 50, 75, 100].map((value) => {
                const y = 280 - (value * 2.8)
                return (
                  <text
                    key={value}
                    x="40"
                    y={y + 6}
                    fill="#ffffff"
                    fontSize="15"
                    fontWeight="600"
                    textAnchor="end"
                  >
                    {value}%
                  </text>
                )
              })}

              {/* Area under curve - Gradient fill */}
              <motion.path
                key={`area-${chartTimeRange}`}
                d={`M 80 280 ${currentData.map((point, idx) => {
                  const spacing = 660
                  const offset = 80
                  const x = 60 + offset + (idx * (spacing / (currentData.length - 1)))
                  const y = 280 - (point.overall * 2.8)
                  return `L ${x} ${y}`
                }).join(' ')} L ${60 + 80 + ((currentData.length - 1) * (660 / (currentData.length - 1)))} 280 Z`}
                fill="url(#chartAreaGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              />

              {/* Vibrant pink/magenta line with glow */}
              <motion.path
                key={`line-${chartTimeRange}`}
                d={currentData.map((point, idx) => {
                  const spacing = 660
                  const offset = 80
                  const x = 60 + offset + (idx * (spacing / (currentData.length - 1)))
                  const y = 280 - (point.overall * 2.8)
                  return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
                }).join(' ')}
                fill="none"
                stroke="#ec4899"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="drop-shadow(0 0 8px rgba(236, 72, 153, 0.4))"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />

              {/* Larger data points with pink fill */}
              {currentData.map((point, idx) => {
                const spacing = 660
                const offset = 80
                const x = 60 + offset + (idx * (spacing / (currentData.length - 1)))
                const y = 280 - (point.overall * 2.8)
                
                return (
                  <g key={`point-${chartTimeRange}-${idx}`}>
                    <motion.circle
                      cx={x}
                      cy={y}
                      r="10"
                      fill="#ec4899"
                      stroke="white"
                      strokeWidth="2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: 1.5 + (idx * 0.1),
                        duration: 0.5,
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                      }}
                      onMouseEnter={() => setHoveredPoint({ day: point.day, value: point.overall })}
                      onMouseLeave={() => setHoveredPoint(null)}
                      className="cursor-pointer"
                      whileHover={{ scale: 1.3 }}
                    />
                    
                    {/* X-axis labels - Closer to chart */}
                    <text
                      x={x}
                      y="298"
                      fill="#ffffff"
                      fontSize="15"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {point.day}
                    </text>
                  </g>
                )
              })}

              {/* Hover tooltip with vertical line */}
              {hoveredPoint && (() => {
                const idx = currentData.findIndex(p => p.day === hoveredPoint.day)
                const spacing = 660
                const offset = 80
                const x = 60 + offset + (idx * (spacing / (currentData.length - 1)))
                const y = 280 - (hoveredPoint.value * 2.8)
                
                return (
                  <g>
                    {/* Vertical dashed line - thicker and smoother */}
                    <line
                      x1={x}
                      y1="20"
                      x2={x}
                      y2="280"
                      stroke="#ffffff"
                      strokeWidth="3"
                      strokeDasharray="8 4"
                      opacity="0.8"
                    />
                    {/* Enlarged hover dot */}
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      fill="#ec4899"
                      stroke="#ffffff"
                      strokeWidth="3"
                      opacity="0.9"
                    />
                  </g>
                )
              })()}
            </svg>
          </div>
        </motion.div>

        {/* Earnings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6"
          style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 24px rgba(16, 185, 129, 0.1)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white mb-1">Earnings Trend</h3>
              <p className="text-sm text-white/60">Track your virtual earnings</p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-[#2a2a2a]">
              {(['day', 'week', 'month'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setEarningsTimeRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    earningsTimeRange === range
                      ? 'bg-[#10b981] text-white shadow-lg shadow-green-500/30'
                      : 'text-[#8a8a8a] hover:text-white'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Earnings Chart */}
          <div ref={earningsRef} className="relative h-64">
            {/* Tooltip overlay - positioned absolutely outside SVG */}
            {hoveredEarnings && earningsRef.current && (() => {
              const rect = earningsRef.current.getBoundingClientRect()
              const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings))
              const idx = currentEarnings.findIndex(p => p.day === hoveredEarnings.day)
              const spacing = 660
              const offset = 80
              const x = 60 + offset + (idx * (spacing / (currentEarnings.length - 1)))
              const pixelX = (x / 850) * rect.width
              const pixelY = ((280 - ((hoveredEarnings.value / maxEarnings) * 280)) / 320) * rect.height
              
              return (
                <div
                  className="absolute pointer-events-none z-50"
                  style={{
                    left: pixelX,
                    top: pixelY - 100,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="bg-[#1e1e30]/95 border border-white/20 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                    <p className="text-white font-semibold mb-2">
                      {hoveredEarnings.day}
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm text-white">
                        Earnings: <span className="font-bold text-white">${hoveredEarnings.value}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )
            })()}
            <svg className="w-full h-full" viewBox="0 0 850 320">
              <defs>
                <linearGradient id="earningsAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((percentage) => {
                const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings))
                const value = (percentage / 100) * maxEarnings
                const y = 280 - (percentage * 2.8)
                return percentage !== 0 && percentage !== 100 ? (
                  <line
                    key={percentage}
                    x1="60"
                    y1={y}
                    x2="790"
                    y2={y}
                    stroke="#222222"
                    strokeWidth="1"
                  />
                ) : null
              })}

              {/* Y-axis labels */}
              {[0, 25, 50, 75, 100].map((percentage) => {
                const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings))
                const value = Math.round((percentage / 100) * maxEarnings)
                const y = 280 - (percentage * 2.8)
                return (
                  <text
                    key={percentage}
                    x="40"
                    y={y + 6}
                    fill="#ffffff"
                    fontSize="15"
                    fontWeight="600"
                    textAnchor="end"
                  >
                    ${value}
                  </text>
                )
              })}

              {/* Area under curve */}
              <motion.path
                key={`earnings-area-${earningsTimeRange}`}
                d={`M 80 280 ${currentEarnings.map((point, idx) => {
                  const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings))
                  const spacing = 660
                  const offset = 80
                  const x = 60 + offset + (idx * (spacing / (currentEarnings.length - 1)))
                  const y = 280 - ((point.earnings / maxEarnings) * 280)
                  return `L ${x} ${y}`
                }).join(' ')} L ${60 + 80 + ((currentEarnings.length - 1) * (660 / (currentEarnings.length - 1)))} 280 Z`}
                fill="url(#earningsAreaGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              />

              {/* Green line with glow */}
              <motion.path
                key={`earnings-line-${earningsTimeRange}`}
                d={currentEarnings.map((point, idx) => {
                  const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings))
                  const spacing = 660
                  const offset = 80
                  const x = 60 + offset + (idx * (spacing / (currentEarnings.length - 1)))
                  const y = 280 - ((point.earnings / maxEarnings) * 280)
                  return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
                }).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />

              {/* Data points */}
              {currentEarnings.map((point, idx) => {
                const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings))
                const spacing = 660
                const offset = 80
                const x = 60 + offset + (idx * (spacing / (currentEarnings.length - 1)))
                const y = 280 - ((point.earnings / maxEarnings) * 280)
                
                return (
                  <g key={`earnings-point-${earningsTimeRange}-${idx}`}>
                    <motion.circle
                      cx={x}
                      cy={y}
                      r="10"
                      fill="#10b981"
                      stroke="white"
                      strokeWidth="2"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: 1.5 + (idx * 0.1),
                        duration: 0.5,
                        type: "spring",
                        stiffness: 260,
                        damping: 20
                      }}
                      onMouseEnter={() => setHoveredEarnings({ day: point.day, value: point.earnings })}
                      onMouseLeave={() => setHoveredEarnings(null)}
                      className="cursor-pointer"
                      whileHover={{ scale: 1.3 }}
                    />
                    
                    {/* X-axis labels */}
                    <text
                      x={x}
                      y="298"
                      fill="#ffffff"
                      fontSize="15"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {point.day}
                    </text>
                  </g>
                )
              })}

              {/* Hover tooltip with vertical line */}
              {hoveredEarnings && (() => {
                const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings))
                const idx = currentEarnings.findIndex(p => p.day === hoveredEarnings.day)
                const spacing = 660
                const offset = 80
                const x = 60 + offset + (idx * (spacing / (currentEarnings.length - 1)))
                const y = 280 - ((hoveredEarnings.value / maxEarnings) * 280)
                
                return (
                  <g>
                    {/* Vertical dashed line - thicker and smoother */}
                    <line
                      x1={x}
                      y1="20"
                      x2={x}
                      y2="280"
                      stroke="#ffffff"
                      strokeWidth="3"
                      strokeDasharray="8 4"
                      opacity="0.8"
                    />
                    {/* Enlarged hover dot */}
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="3"
                      opacity="0.9"
                    />
                  </g>
                )
              })()}
            </svg>
          </div>
        </motion.div>
      </div>

      {/* Bottom Grid: Recent Sessions + Insights + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 min-h-[320px]"
          style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Recent Sessions</h3>
            <button className="text-sm text-[#a855f7] hover:text-[#9333ea] transition-colors">
              View All →
            </button>
          </div>

          <div className="space-y-2.5">
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <p className="text-sm">No recent sessions</p>
                <p className="text-xs mt-1">Complete a practice session to see it here</p>
              </div>
            ) : recentSessions.map((session, idx) => {
              const circumference = 2 * Math.PI * 16
              const strokeDashoffset = circumference - (session.score / 100) * circumference

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
                  className="flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative w-8 h-8 flex-shrink-0">
                      {(() => {
                        // Get agent color variant from session name
                        const agentName = session.name as AllowedAgentName
                        const getAgentColorVariant = (name: string): keyof typeof COLOR_VARIANTS => {
                          if (PERSONA_METADATA[name as AllowedAgentName]?.bubble?.color) {
                            return PERSONA_METADATA[name as AllowedAgentName].bubble.color as keyof typeof COLOR_VARIANTS
                          }
                          return 'primary'
                        }
                        const colorVariant = getAgentColorVariant(agentName || '')
                        const variantStyles = COLOR_VARIANTS[colorVariant]
                        return (
                          <>
                            {/* Animated gradient rings */}
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className={`absolute inset-0 rounded-full border ${variantStyles.border[i]} ${variantStyles.gradient} bg-gradient-to-br to-transparent`}
                                style={{
                                  animation: `spin 8s linear infinite`,
                                  opacity: 0.5 - (i * 0.1),
                                  transform: `scale(${1 - i * 0.05})`
                                }}
                              />
                            ))}
                            {/* Profile Image */}
                            <img 
                              src={session.avatar}
                              alt={session.name}
                              className="relative w-full h-full rounded-full object-cover z-10"
                            />
                          </>
                        )
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">{session.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="relative w-9 h-9">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="16" 
                          stroke="rgba(255,255,255,0.1)" 
                          strokeWidth="3" 
                          fill="none" 
                        />
                        <motion.circle
                          cx="18"
                          cy="18"
                          r="16"
                          stroke="#a855f7"
                          strokeWidth="3"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          fill="none"
                          initial={{ strokeDashoffset: circumference }}
                          animate={{ strokeDashoffset }}
                          transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white">{session.score}%</span>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-green-400 tabular-nums">+${session.earned}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Insights - Enhanced */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 min-h-[320px]"
          style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
        >
          <h3 className="text-base font-bold text-white mb-3">Insights</h3>

          <div className="space-y-2.5">
            {insightsData.map((insight, idx) => {
              const Icon = insight.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + idx * 0.1 }}
                  className="pb-2.5 border-b border-[#2a2a2a] last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-2.5">
                    <div 
                      className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                      style={{ 
                        backgroundColor: insight.iconBgColor
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: insight.iconColor }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-white mb-1">{insight.title}</h4>
                      <p className="text-[11px] text-white leading-relaxed">
                        {insight.percentage && <span className="text-[#a855f7] font-semibold">{insight.percentage}</span>}
                        {insight.percentage && ' '}
                        {insight.message}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 min-h-[320px]"
          style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
        >
          <h3 className="text-base font-bold text-white mb-3">Notifications</h3>

          <div className="space-y-2.5">
            {notificationsData.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <p className="text-sm">No notifications</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : notificationsData.map((notif, idx) => {
              const getIcon = () => {
                switch(notif.type) {
                  case 'manager':
                    return MessageSquare
                  case 'leaderboard':
                    return TrendingUp
                  case 'achievement':
                    return Award
                  default:
                    return MessageSquare
                }
              }
              const Icon = getIcon()
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + idx * 0.1 }}
                  className="pb-2.5 border-b border-[#2a2a2a] last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-2.5">
                    <div 
                      className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                      style={{ 
                        backgroundColor: notif.iconBgColor
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: notif.iconColor }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                        <span className="text-[10px] text-white/60 font-medium">{notif.time}</span>
                      </div>
                      <p className="text-[11px] text-white leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function LearningTabContent() {
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null)

  const playbooks = [
    {
      id: 'objections',
      title: 'Handling Price Objections',
      description: 'Learn proven techniques to overcome budget concerns',
      progress: 75,
      lessons: 12,
      duration: '45 min',
      icon: Target,
      iconColor: '#f59e0b',
      iconBgColor: 'rgba(245, 158, 11, 0.25)',
      borderColor: '#6a4a2a',
      bg: '#3a2a1a',
      textColor: 'text-amber-200',
      glowColor: 'rgba(245, 158, 11, 0.1)'
    },
    {
      id: 'rapport',
      title: 'Building Instant Rapport',
      description: 'Master the first 30 seconds of every conversation',
      progress: 90,
      lessons: 8,
      duration: '30 min',
      icon: MessageSquare,
      iconColor: '#14b8a6',
      iconBgColor: 'rgba(20, 184, 166, 0.25)',
      borderColor: '#2a6a5a',
      bg: '#1a3a2f',
      textColor: 'text-teal-200',
      glowColor: 'rgba(20, 184, 166, 0.1)'
    },
    {
      id: 'closing',
      title: 'Advanced Closing Techniques',
      description: 'Close more deals with assumptive language',
      progress: 60,
      lessons: 15,
      duration: '60 min',
      icon: Zap,
      iconColor: '#a855f7',
      iconBgColor: 'rgba(168, 85, 247, 0.25)',
      borderColor: '#4a2a6a',
      bg: '#2a1a3a',
      textColor: 'text-purple-200',
      glowColor: 'rgba(138, 43, 226, 0.1)'
    },
    {
      id: 'discovery',
      title: 'Discovery Questions Mastery',
      description: 'Ask the right questions to uncover pain points',
      progress: 45,
      lessons: 10,
      duration: '40 min',
      icon: Target,
      iconColor: '#ec4899',
      iconBgColor: 'rgba(236, 72, 153, 0.25)',
      borderColor: '#6a2a4a',
      bg: '#3a1a2a',
      textColor: 'text-pink-200',
      glowColor: 'rgba(236, 72, 153, 0.1)'
    },
  ]

  const coachingTips = [
    {
      title: 'Use Their Name',
      tip: 'Use prospect\'s name 2-3 times in the first minute to build instant rapport.',
      color: '#a855f7'
    },
    {
      title: 'Mirror Their Energy',
      tip: 'Match your prospect\'s speaking pace and energy level for subconscious connection.',
      color: '#3b82f6'
    },
    {
      title: 'Assumptive Language',
      tip: 'Replace "if" with "when" in your closes for stronger commitment language.',
      color: '#10b981'
    },
  ]

  return (
    <div className="space-y-4">
      {/* Playbooks Grid */}
      <div>
        <h3 className="text-base font-bold text-white mb-4">Sales Playbooks</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {playbooks.map((playbook, idx) => {
            const Icon = playbook.icon
            return (
              <motion.div
                key={playbook.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                onClick={() => setSelectedPlaybook(playbook.id)}
                className="rounded-lg p-5 cursor-pointer"
                style={{ 
                  backgroundColor: playbook.bg,
                  border: `2px solid ${playbook.borderColor}`,
                  boxShadow: `inset 0 0 20px ${playbook.glowColor}, 0 4px 16px rgba(0, 0, 0, 0.4)`
                }}
              >
                <div>
                  <h4 className={`text-xs font-semibold ${playbook.textColor} uppercase tracking-wide mb-3`}>
                    {playbook.title}
                  </h4>
                  <p className="text-[15px] text-slate-300 leading-relaxed mb-3">{playbook.description}</p>

                  <div className="flex items-center gap-2 text-xs text-green-400 font-semibold mb-4">
                    <span>{playbook.lessons} lessons</span>
                    <span>•</span>
                    <span>{playbook.duration}</span>
                  </div>

                  <div className="pt-3" style={{ borderTop: `1px solid ${playbook.borderColor}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-300">Progress</span>
                      <span className="text-lg font-bold text-white">{playbook.progress}%</span>
                    </div>
                    <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#a855f7]"
                        initial={{ width: 0 }}
                        animate={{ width: `${playbook.progress}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + idx * 0.1 }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Coaching Tips */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4" style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}>
        <h3 className="text-base font-bold text-white mb-3">Coaching Tips</h3>

        <div className="space-y-2.5">
          {coachingTips.map((tip, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
              className="pb-2.5 border-b border-[#2a2a2a] last:border-0 last:pb-0"
            >
              <div className="flex items-start gap-2">
                <div 
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: tip.color }}
                />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white mb-1">{tip.title}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{tip.tip}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function UploadTabContent() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: string; date: string }>>([
    { name: 'sales-call-oct-15.mp3', size: '12.5 MB', date: '2 days ago' },
    { name: 'pitch-practice-session.mp3', size: '8.2 MB', date: '5 days ago' },
  ])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    // Handle file upload logic here
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-[#1a1a1a] border-2 border-dashed rounded-lg p-10 text-center transition-all ${
          isDragging ? 'border-[#a855f7]' : 'border-[#2a2a2a]'
        }`}
        style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
      >
        <div className="flex justify-center mb-4">
          <div className="p-6 rounded-full bg-[#0a0a0a] border border-[#2a2a2a]">
            <Upload className="w-20 h-20 text-[#a855f7]" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">
          Upload Your Sales Calls
        </h3>
        <p className="text-sm text-[#8a8a8a] mb-6 max-w-2xl mx-auto leading-relaxed">
          Drop your audio files here or click to browse. We support MP3, WAV, M4A and more.
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <button className="px-8 py-3 bg-[#a855f7] text-white font-medium rounded-lg hover:bg-[#9333ea] transition-colors shadow-[0_2px_8px_rgba(168,85,247,0.3)]">
            Choose Files
          </button>
          <button className="px-8 py-3 bg-transparent text-white font-medium rounded-lg border border-[#a855f7] hover:bg-[#a855f7]/10 transition-all">
            Record Now
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-8 text-sm text-[#8a8a8a]">
          <span>Max 100MB</span>
          <span>•</span>
          <span>All audio formats</span>
          <span>•</span>
          <span>Secure</span>
        </div>
      </motion.div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4"
          style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
        >
          <h3 className="text-base font-bold text-white mb-3">Recent Uploads</h3>
          
          <div className="space-y-2.5">
            {uploadedFiles.map((file, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a]">
                    <svg className="w-5 h-5 text-[#8a8a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <p className="text-xs text-[#8a8a8a]">{file.size} • {file.date}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-[#a855f7] text-white text-sm font-medium rounded-lg hover:bg-[#9333ea] transition-colors">
                    Analyze
                  </button>
                  <button className="p-2 text-[#8a8a8a] hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

function TeamTabContent() {
  const leaderboard = [
    { 
      rank: 1, 
      name: 'Sarah Chen', 
      score: 892, 
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      change: '+12',
      badge: '🥇'
    },
    { 
      rank: 2, 
      name: 'Marcus Johnson', 
      score: 875, 
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      change: '+8',
      badge: '🥈'
    },
    { 
      rank: 3, 
      name: 'Alex Rivera (You)', 
      score: 840, 
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      isYou: true,
      change: '+15',
      badge: '🥉'
    },
    { 
      rank: 4, 
      name: 'David Martinez', 
      score: 825, 
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
      change: '+5',
    },
    { 
      rank: 5, 
      name: 'Emma Wilson', 
      score: 810, 
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      change: '+3',
    },
  ]

  const teamStats = [
    { 
      label: 'Team Size', 
      value: '24', 
      icon: UsersIcon,
      borderColor: '#2a4a6a',
      bg: '#1a2a3a',
      textColor: 'text-blue-200',
      glowColor: 'rgba(59, 130, 246, 0.1)'
    },
    { 
      label: 'Avg Team Score', 
      value: '78%', 
      icon: TrendingUp,
      borderColor: '#4a2a6a',
      bg: '#2a1a3a',
      textColor: 'text-purple-200',
      glowColor: 'rgba(138, 43, 226, 0.1)'
    },
    { 
      label: 'Top Performer', 
      value: 'Sarah C.', 
      icon: Award,
      borderColor: '#6a4a2a',
      bg: '#3a2a1a',
      textColor: 'text-amber-200',
      glowColor: 'rgba(245, 158, 11, 0.1)'
    },
    { 
      label: 'Team Growth', 
      value: '+12%', 
      icon: Zap,
      borderColor: '#2a6a4a',
      bg: '#1a3a2a',
      textColor: 'text-emerald-200',
      glowColor: 'rgba(16, 185, 129, 0.1)'
    },
  ]

  return (
    <div className="space-y-4">
      {/* Team Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {teamStats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="rounded-lg p-5"
              style={{ 
                backgroundColor: stat.bg,
                border: `2px solid ${stat.borderColor}`,
                boxShadow: `inset 0 0 20px ${stat.glowColor}, 0 4px 16px rgba(0, 0, 0, 0.4)`
              }}
            >
              <h3 className={`text-xs font-semibold ${stat.textColor} uppercase tracking-wide mb-2`}>
                {stat.label}
              </h3>
              <p className="text-3xl font-bold text-white tabular-nums">{stat.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4"
        style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">Team Leaderboard</h3>
          <button className="text-sm text-[#a855f7] hover:text-[#9333ea] transition-colors">
            View All →
          </button>
        </div>

        <div className="space-y-2.5">
          {leaderboard.map((member, idx) => (
            <motion.div
              key={member.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-lg ${
                member.isYou 
                  ? 'bg-[#0a0a0a] border-2 border-[#a855f7]' 
                  : 'bg-[#0a0a0a] border border-[#2a2a2a]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                  <span className="text-sm font-bold text-white">
                    {member.badge || `#${member.rank}`}
                  </span>
                </div>
                
                <img 
                  src={member.avatar} 
                  alt={member.name} 
                  className="w-10 h-10 rounded-full ring-1 ring-[#2a2a2a] object-cover"
                />
                
                <div>
                  <p className="text-sm font-semibold text-white">
                    {member.name}
                  </p>
                  <p className="text-xs text-white/60">
                    {member.change} this week
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-lg font-bold text-white">{member.score}</p>
                <p className="text-xs text-white/60">points</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function MessagesTabContent() {
  const [selectedManager, setSelectedManager] = useState('canon weaver')
  const [messageInput, setMessageInput] = useState('')

  const managers = [
    {
      id: 1,
      name: 'canon weaver',
      role: 'Manager',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      online: true,
      unreadCount: 0
    }
  ]

  const conversation = [
    {
      id: 1,
      from: 'Manager',
      message: 'Great job on handling objections this week. Your improvement is impressive.',
      time: '2h ago',
      isUser: false
    },
    {
      id: 2,
      from: 'You',
      message: 'Thanks! I\'ve been practicing with the objection handling playbook.',
      time: '1h ago',
      isUser: true
    }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-350px)] min-h-[600px]">
      {/* Left Sidebar - Managers List */}
      <div className="lg:col-span-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 flex flex-col" style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}>
        <h3 className="text-base font-bold text-white mb-4">Your Managers</h3>
        
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search managers..."
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#8a8a8a] focus:outline-none focus:border-[#a855f7] transition-colors"
          />
          <svg className="absolute right-3 top-3 w-5 h-5 text-[#8a8a8a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Managers List */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {managers.map((manager) => (
            <motion.div
              key={manager.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelectedManager(manager.name)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedManager === manager.name
                  ? 'bg-[#a855f7]/10 border-l-4 border-l-[#a855f7]'
                  : 'bg-[#0a0a0a] hover:bg-[#0a0a0a]/50'
              }`}
            >
              <div className="relative">
                <img
                  src={manager.avatar}
                  alt={manager.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                {manager.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1a1a1a]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{manager.name}</p>
                <p className="text-xs text-[#8a8a8a]">{manager.online ? 'Online' : 'Offline'}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pro Tip */}
        <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
            <svg className="w-5 h-5 text-[#a855f7] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-white mb-1">Pro Tip</p>
              <p className="text-sm text-white leading-relaxed">
                Regular check-ins with your manager lead to 23% better performance!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Conversation */}
      <div className="lg:col-span-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg flex flex-col" style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}>
        {/* Conversation Header */}
        <div className="px-6 py-4 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#a855f7] flex items-center justify-center text-white font-bold text-sm">
                {selectedManager.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#1a1a1a]" />
            </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{selectedManager}</h3>
                    <p className="text-sm text-white/60">Manager • Online</p>
                  </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conversation.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${msg.isUser ? 'order-2' : 'order-1'}`}>
                <div
                  className={`rounded-lg px-4 py-3 ${
                    msg.isUser
                      ? 'bg-[#a855f7] text-white'
                      : 'bg-[#0a0a0a] border border-[#2a2a2a] text-white'
                  }`}
                >
                  <p className="text-base leading-relaxed">{msg.message}</p>
                </div>
                <p className="text-sm text-white/60 mt-1 px-1">
                  {msg.time}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <button className="p-2 text-[#8a8a8a] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button className="p-2 text-[#8a8a8a] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-4 py-2.5 text-base text-white placeholder-white/40 focus:outline-none focus:border-[#a855f7] transition-colors"
            />
            <button className="p-2 text-[#8a8a8a] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button className="p-2.5 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

