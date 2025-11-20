'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Home, 
  TrendingUp, 
  BookOpen, 
  Users as UsersIcon, 
  Target, 
  Award, 
  Calendar, 
  Clock, 
  Upload,
  Sparkles,
  Zap,
  DollarSign,
  AlertCircle,
  MessageCircle,
  Video,
  Trash2,
  Play,
  Loader2,
  Mic,
  Square,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { useSubscription } from '@/hooks/useSubscription'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import Link from 'next/link'

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
    <div className="mb-4 sm:mb-6 lg:mb-8 border-b border-indigo-500/30">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1 -mb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
              className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 touch-target font-sans ${
                tab.locked
                  ? 'text-indigo-500/30 cursor-not-allowed'
                  : isActive
                  ? 'text-white bg-black/50'
                  : 'text-slate-400 hover:text-white active:text-white active:bg-black/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="sm:inline">{tab.label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTabBorder"
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-indigo-500"
                  style={{ boxShadow: '0 2px 8px rgba(99, 102, 241, 0.5)' }}
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
  const [userName, setUserName] = useState('')
  const [realStats, setRealStats] = useState({
    sessionsThisWeek: 0,
    totalSessions: 0,
    avgScore: 0,
    teamRank: 1,
    totalEarnings: 0
  })
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [hasTeam, setHasTeam] = useState(false)
  
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
  
  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRealData()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
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
      const firstName = userData.full_name.split(' ')[0] || userData.email?.split('@')[0] || 'User'
      setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase())
    } else if (userData?.email) {
      // Use email username as fallback
      const emailName = userData.email.split('@')[0] || 'User'
      setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase())
    } else {
      setUserName('User')
    }
    
    // Get user's team_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single()
    
    // Check if user has a team
    setHasTeam(!!userProfile?.team_id)
    
    // Get sessions from this week (for weekly stats)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    
    const { data: sessionsThisWeekData, error: weekError } = await supabase
      .from('live_sessions')
      .select('id, overall_score, created_at, ended_at, agent_name')
      .eq('user_id', user.id)
      .gte('created_at', oneWeekAgo.toISOString())
      .order('created_at', { ascending: false })
    
    if (weekError) {
      console.error('❌ Error fetching weekly sessions:', weekError)
    } else {
      console.log('📊 Sessions this week:', sessionsThisWeekData?.length || 0, sessionsThisWeekData)
    }
    
    // Get total sessions count (all time) - include all sessions regardless of status
    const { data: allSessionsData, error: allError } = await supabase
      .from('live_sessions')
      .select('id, created_at, ended_at, agent_name')
      .eq('user_id', user.id)
    
    if (allError) {
      console.error('❌ Error fetching all sessions:', allError)
    } else {
      console.log('📊 Total sessions:', allSessionsData?.length || 0, 'Sample:', allSessionsData?.slice(0, 3))
    }
    
    const sessionsThisWeek = sessionsThisWeekData?.length || 0
    const totalSessions = allSessionsData?.length || 0
    const avgScore = sessionsThisWeekData && sessionsThisWeekData.length > 0
      ? Math.round(sessionsThisWeekData.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / sessionsThisWeekData.length)
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
      totalSessions,
      avgScore,
      teamRank,
      totalEarnings: userData?.virtual_earnings || 0
    })
  }

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
  }

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: Home, locked: false },
    { id: 'upload', label: 'Upload', icon: Upload, locked: false },
    ...(hasTeam ? [
      { id: 'team', label: 'Team', icon: UsersIcon, locked: false },
    ] : []),
  ]

  const quickStats = [
    { 
      label: 'Sessions', 
      value: realStats.totalSessions, 
      icon: Target,
      iconColor: '#3b82f6',
      iconBgColor: 'rgba(59, 130, 246, 0.2)',
      glowColor: 'rgba(59, 130, 246, 0.2)',
      valueClass: 'text-[26px]'
    },
    // Only show Rank card for team plan users
    ...(hasTeam ? [{
      label: 'Rank', 
      value: `#${realStats.teamRank}`, 
      icon: Award,
      iconColor: '#f59e0b',
      iconBgColor: 'rgba(245, 158, 11, 0.2)',
      glowColor: 'rgba(245, 158, 11, 0.2)',
      valueClass: 'text-2xl'
    }] : []),
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836] pt-32 pb-2 sm:pb-4 lg:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Minimalist Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 sm:mb-6 lg:mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            {/* Left: Welcome & Time */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 font-space">
                Welcome back, {userName}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/70 text-xs sm:text-sm font-sans">
                <span className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="break-words">{formatDate(currentTime)}</span>
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  {formatTime(currentTime)}
                </span>
              </div>
            </div>

            {/* Right: Quick Stats Cards - Vibrant Icons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {quickStats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="bg-black/70 backdrop-blur-sm border border-indigo-500/30 rounded-lg p-3 sm:p-4 hover:border-indigo-400/50 transition-colors"
                  style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs text-indigo-300/80 truncate font-space uppercase tracking-wide">{stat.label}</p>
                      <p className={`text-lg sm:text-xl lg:${stat.valueClass} font-bold text-white leading-tight truncate font-space tabular-nums`}>{stat.value}</p>
                    </div>
                    <div 
                      className="flex items-center justify-center w-7 h-7 sm:w-9 sm:h-9 rounded-full shrink-0"
                      style={{ 
                        backgroundColor: stat.iconBgColor
                      }}
                    >
                      <stat.icon className="w-[14px] h-[14px] sm:w-[18px] sm:h-[18px]" style={{ color: stat.iconColor }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <TabNavigation tabs={tabs} activeTab={activeTab} onChange={handleTabClick} />

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
            {activeTab === 'upload' && (
              <UploadTabContent />
            )}
            {activeTab === 'team' && (
              <TeamTabContent />
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
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([
    {
      id: 'overall',
      title: 'Overall Score',
      value: 0,
      change: '+0%',
      feedback: 'Complete your first session to see your scores.',
      borderColor: '#8b5cf6',
      textColor: 'text-purple-300',
      bg: '#4c1d6a',
      glowColor: 'rgba(139, 92, 246, 0.5)'
    },
    {
      id: 'rapport',
      title: 'Rapport',
      value: 0,
      change: '+0%',
      feedback: 'Build connection in the first 30 seconds.',
      borderColor: '#10b981',
      textColor: 'text-emerald-300',
      bg: '#065f46',
      glowColor: 'rgba(16, 185, 129, 0.5)'
    },
    {
      id: 'discovery',
      title: 'Discovery',
      value: 0,
      change: '+0%',
      feedback: 'Ask questions to uncover pain points.',
      borderColor: '#3b82f6',
      textColor: 'text-blue-300',
      bg: '#1e40af',
      glowColor: 'rgba(59, 130, 246, 0.5)'
    },
    {
      id: 'objection',
      title: 'Objection Handling',
      value: 0,
      change: '+0%',
      feedback: 'Turn concerns into opportunities.',
      borderColor: '#f59e0b',
      textColor: 'text-amber-300',
      bg: '#92400e',
      glowColor: 'rgba(245, 158, 11, 0.5)'
    },
    {
      id: 'closing',
      title: 'Closing',
      value: 0,
      change: '+0%',
      feedback: 'Use assumptive language to close.',
      borderColor: '#ec4899',
      textColor: 'text-pink-300',
      bg: '#9f1239',
      glowColor: 'rgba(236, 72, 153, 0.5)'
    }
  ])
  const [notifications, setNotifications] = useState<any[]>([])
  const [insightsData, setInsightsData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<{
    day: Array<{ day: string; overall: number }>
    week: Array<{ day: string; overall: number }>
    month: Array<{ day: string; overall: number }>
  }>({
    day: [],
    week: [],
    month: []
  })
  const [earningsData, setEarningsData] = useState<{
    day: Array<{ day: string; earnings: number }>
    week: Array<{ day: string; earnings: number }>
    month: Array<{ day: string; earnings: number }>
  }>({
    day: [],
    week: [],
    month: []
  })
  const chartRef = useRef<HTMLDivElement>(null)
  const earningsRef = useRef<HTMLDivElement>(null)
  const isChartInView = useInView(chartRef, { once: true, amount: 0.3 })
  const isEarningsInView = useInView(earningsRef, { once: true, amount: 0.3 })
  
  // Fetch real data on mount
  useEffect(() => {
    fetchOverviewData()
    fetchAIInsights()
  }, [])
  
  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOverviewData()
        fetchAIInsights()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchAIInsights = async () => {
    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Map icon strings to icon components
        const iconMap: Record<string, any> = {
          'trending-up': TrendingUp,
          'target': Target,
          'clock': Clock,
          'award': Award,
          'zap': Zap,
          'alert-circle': AlertCircle
        }
        
        const mappedInsights = data.insights.map((insight: any) => ({
          ...insight,
          icon: iconMap[insight.icon] || TrendingUp
        }))
        
        setInsightsData(mappedInsights)
      } else {
        // Fallback to default insights
        setInsightsData([
          {
            title: 'Analyzing your data',
            message: 'Complete more sessions to see personalized insights',
            icon: TrendingUp,
            iconColor: '#10b981',
            iconBgColor: 'rgba(16, 185, 129, 0.2)'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
      // Fallback to default insights
      setInsightsData([
        {
          title: 'Analyzing your data',
          message: 'Complete more sessions to see personalized insights',
          icon: TrendingUp,
          iconColor: '#10b981',
          iconBgColor: 'rgba(16, 185, 129, 0.2)'
        }
      ])
    }
  }
  
  const fetchOverviewData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Still set default metrics even if no user
        setPerformanceMetrics([
          {
            id: 'overall',
            title: 'Overall Score',
            value: 0,
            change: '+0%',
            feedback: 'Complete your first session to see your scores.',
            borderColor: '#8b5cf6',
            textColor: 'text-purple-300',
            bg: '#4c1d6a',
            glowColor: 'rgba(139, 92, 246, 0.5)'
          },
          {
            id: 'rapport',
            title: 'Rapport',
            value: 0,
            change: '+0%',
            feedback: 'Build connection in the first 30 seconds.',
            borderColor: '#10b981',
            textColor: 'text-emerald-300',
            bg: '#065f46',
            glowColor: 'rgba(16, 185, 129, 0.5)'
          },
          {
            id: 'discovery',
            title: 'Discovery',
            value: 0,
            change: '+0%',
            feedback: 'Ask questions to uncover pain points.',
            borderColor: '#3b82f6',
            textColor: 'text-blue-300',
            bg: '#1e40af',
            glowColor: 'rgba(59, 130, 246, 0.5)'
          },
          {
            id: 'objection',
            title: 'Objection Handling',
            value: 0,
            change: '+0%',
            feedback: 'Turn concerns into opportunities.',
            borderColor: '#f59e0b',
            textColor: 'text-amber-300',
            bg: '#92400e',
            glowColor: 'rgba(245, 158, 11, 0.5)'
          },
          {
            id: 'closing',
            title: 'Closing',
            value: 0,
            change: '+0%',
            feedback: 'Use assumptive language to close.',
            borderColor: '#ec4899',
            textColor: 'text-pink-300',
            bg: '#9f1239',
            glowColor: 'rgba(236, 72, 153, 0.5)'
          }
        ])
        return
      }
      
      // Get ALL user sessions for calculating averages and trends (with dates and earnings)
      // Include both graded and ungraded sessions for complete data
      const { data: allSessionsRaw, error: allSessionsError } = await supabase
        .from('live_sessions')
        .select('overall_score, rapport_score, discovery_score, objection_handling_score, close_score, created_at, virtual_earnings, analytics')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (allSessionsError) {
        console.error('❌ Error fetching all sessions:', allSessionsError)
      }
      
      // Filter to only sessions with scores for trend calculations
      const allSessions = (allSessionsRaw || []).filter((s: any) => s.overall_score !== null && s.overall_score !== undefined)
      
      console.log('📊 All sessions fetched:', allSessionsRaw?.length || 0, 'Total')
      console.log('📊 Sessions with scores:', allSessions.length, 'Graded')
      
      // Get recent sessions with agent_name (for display) - fetch all sessions, not just graded ones
      const { data: recentSessionsData, error: recentSessionsError } = await supabase
        .from('live_sessions')
        .select('id, overall_score, created_at, ended_at, homeowner_name, agent_name, agent_persona, virtual_earnings, analytics, duration_seconds')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      console.log('📊 Recent sessions query result:', {
        count: recentSessionsData?.length || 0,
        error: recentSessionsError?.message,
        sample: recentSessionsData?.[0]
      })
      
      if (recentSessionsError) {
        console.error('❌ Error fetching recent sessions:', recentSessionsError)
        setRecentSessions([])
        // Don't return - continue to set metrics
      }
    
    console.log('📊 Raw recent sessions data:', recentSessionsData)
    console.log('📊 Recent sessions count:', recentSessionsData?.length || 0)
    if (recentSessionsData && recentSessionsData.length > 0) {
      console.log('📊 Sample session:', {
        id: recentSessionsData[0].id,
        agent_name: recentSessionsData[0].agent_name,
        created_at: recentSessionsData[0].created_at,
        ended_at: recentSessionsData[0].ended_at,
        has_score: recentSessionsData[0].overall_score !== null
      })
    }
    
    // Format recent sessions for display
    if (recentSessionsData && recentSessionsData.length > 0) {
      const gradients = ['from-purple-500/30', 'from-blue-500/30', 'from-pink-500/30', 'from-green-500/30']
      
      const formattedSessions = recentSessionsData
        .filter((session: any) => session && session.id) // Filter out any invalid sessions
        .map((session: any, idx: number) => {
          const createdAt = session.created_at ? new Date(session.created_at) : new Date()
          const timeAgo = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60))
          
        // Try agent_name first, then agent_persona, then homeowner_name
        const agentName = session.agent_name || session.agent_persona || session.homeowner_name || null
          const displayName = session.agent_name || session.agent_persona || session.homeowner_name || 'Practice Session'
          
        return {
          id: session.id,
            name: displayName,
            score: session.overall_score ?? 0,
            earned: session.virtual_earnings ?? (session.analytics?.virtual_earnings) ?? 0,
          avatar: getAgentBubbleImage(agentName),
          time: timeAgo < 1 ? 'Just now' : timeAgo < 24 ? `${timeAgo}h ago` : `${Math.floor(timeAgo / 24)}d ago`,
          gradient: gradients[idx % gradients.length]
        }
      })
        .filter((session: any) => session && session.id) // Final filter to ensure valid sessions
      
      console.log('✅ Formatted recent sessions:', formattedSessions)
      setRecentSessions(formattedSessions)
    } else {
      console.log('⚠️ No recent sessions found in database')
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
      // Filter sessions with valid scores for each metric (include 0 as valid score)
      const sessionsWithOverall = allSessions.filter((s: any) => s.overall_score !== null && s.overall_score !== undefined)
      const sessionsWithRapport = allSessions.filter((s: any) => s.rapport_score !== null && s.rapport_score !== undefined)
      const sessionsWithDiscovery = allSessions.filter((s: any) => s.discovery_score !== null && s.discovery_score !== undefined)
      const sessionsWithObjection = allSessions.filter((s: any) => s.objection_handling_score !== null && s.objection_handling_score !== undefined)
      const sessionsWithClosing = allSessions.filter((s: any) => s.close_score !== null && s.close_score !== undefined)
      
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
          borderColor: '#8b5cf6',
          textColor: 'text-purple-300',
          bg: '#4c1d6a',
          glowColor: 'rgba(139, 92, 246, 0.5)'
        },
        {
          id: 'rapport',
          title: 'Rapport',
          value: avgRapport,
          change: '+5%',
          feedback: 'Incorporate personalized questions within the first 30 seconds.',
          borderColor: '#10b981',
          textColor: 'text-emerald-300',
          bg: '#065f46',
          glowColor: 'rgba(16, 185, 129, 0.5)'
        },
        {
          id: 'discovery',
          title: 'Discovery',
          value: avgDiscovery,
          change: '+13%',
          feedback: 'Dig deeper into pain points with follow-up questions.',
          borderColor: '#3b82f6',
          textColor: 'text-blue-300',
          bg: '#1e40af',
          glowColor: 'rgba(59, 130, 246, 0.5)'
        },
        {
          id: 'objection',
          title: 'Objection Handling',
          value: avgObjection,
          change: '+8%',
          feedback: 'Reframe price concerns as investment discussions.',
          borderColor: '#f59e0b',
          textColor: 'text-amber-300',
          bg: '#92400e',
          glowColor: 'rgba(245, 158, 11, 0.5)'
        },
        {
          id: 'closing',
          title: 'Closing',
          value: avgClosing,
          change: '+6%',
          feedback: 'Use assumptive language: "When we install" vs "If you decide".',
          borderColor: '#ec4899',
          textColor: 'text-pink-300',
          bg: '#9f1239',
          glowColor: 'rgba(236, 72, 153, 0.5)'
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
          borderColor: '#8b5cf6',
          textColor: 'text-purple-300',
          bg: '#4c1d6a',
          glowColor: 'rgba(139, 92, 246, 0.5)'
        },
        {
          id: 'rapport',
          title: 'Rapport',
          value: 0,
          change: '+0%',
          feedback: 'Build connection in the first 30 seconds.',
          borderColor: '#10b981',
          textColor: 'text-emerald-300',
          bg: '#065f46',
          glowColor: 'rgba(16, 185, 129, 0.5)'
        },
        {
          id: 'discovery',
          title: 'Discovery',
          value: 0,
          change: '+0%',
          feedback: 'Ask questions to uncover pain points.',
          borderColor: '#3b82f6',
          textColor: 'text-blue-300',
          bg: '#1e40af',
          glowColor: 'rgba(59, 130, 246, 0.5)'
        },
        {
          id: 'objection',
          title: 'Objection Handling',
          value: 0,
          change: '+0%',
          feedback: 'Turn concerns into opportunities.',
          borderColor: '#f59e0b',
          textColor: 'text-amber-300',
          bg: '#92400e',
          glowColor: 'rgba(245, 158, 11, 0.5)'
        },
        {
          id: 'closing',
          title: 'Closing',
          value: 0,
          change: '+0%',
          feedback: 'Use assumptive language to close.',
          borderColor: '#ec4899',
          textColor: 'text-pink-300',
          bg: '#9f1239',
          glowColor: 'rgba(236, 72, 153, 0.5)'
        }
      ])
    }

    // Calculate real performance and earnings trends
    if (allSessions && allSessions.length > 0) {
      const now = new Date()
      const sessionsWithDates = allSessions.filter((s: any) => s.created_at && s.overall_score !== null)
      
      // Day trends (today's hours)
      const dayHours = ['6am', '9am', '12pm', '3pm', '6pm', '9pm']
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dayData = dayHours.map(hour => {
        let hourNum = 6
        if (hour === '9am') hourNum = 9
        else if (hour === '12pm') hourNum = 12
        else if (hour === '3pm') hourNum = 15
        else if (hour === '6pm') hourNum = 18
        else if (hour === '9pm') hourNum = 21
        
        const hourStart = new Date(today)
        hourStart.setHours(hourNum, 0, 0, 0)
        const hourEnd = new Date(today)
        hourEnd.setHours(hourNum + 3, 0, 0, 0)
        
        const sessionsInHour = sessionsWithDates.filter((s: any) => {
          const sessionDate = new Date(s.created_at)
          return sessionDate >= hourStart && sessionDate < hourEnd
        })
        
        const avg = sessionsInHour.length > 0
          ? Math.round(sessionsInHour.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / sessionsInHour.length)
          : 0
        
        return { day: hour, overall: avg }
      })
      
      // Week trends (last 7 days)
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const weekData = weekDays.map((dayName, idx) => {
        const dayDate = new Date(now)
        dayDate.setDate(dayDate.getDate() - (6 - idx))
        dayDate.setHours(0, 0, 0, 0)
        const nextDay = new Date(dayDate)
        nextDay.setDate(nextDay.getDate() + 1)
        
        const sessionsInDay = sessionsWithDates.filter((s: any) => {
          const sessionDate = new Date(s.created_at)
          return sessionDate >= dayDate && sessionDate < nextDay
        })
        
        const avg = sessionsInDay.length > 0
          ? Math.round(sessionsInDay.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / sessionsInDay.length)
          : 0
        
        return { day: dayName, overall: avg }
      })
      
      // Month trends (last 4 weeks)
      const monthWeeks = []
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - (i * 7 + 7))
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        
        const sessionsInWeek = sessionsWithDates.filter((s: any) => {
          const sessionDate = new Date(s.created_at)
          return sessionDate >= weekStart && sessionDate < weekEnd
        })
        
        const avg = sessionsInWeek.length > 0
          ? Math.round(sessionsInWeek.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / sessionsInWeek.length)
          : 0
        
        monthWeeks.push({ day: `Week ${4 - i}`, overall: avg })
      }
      
      // Earnings trends
      const earningsDayData = dayHours.map(hour => {
        let hourNum = 6
        if (hour === '9am') hourNum = 9
        else if (hour === '12pm') hourNum = 12
        else if (hour === '3pm') hourNum = 15
        else if (hour === '6pm') hourNum = 18
        else if (hour === '9pm') hourNum = 21
        
        const hourStart = new Date(today)
        hourStart.setHours(hourNum, 0, 0, 0)
        const hourEnd = new Date(today)
        hourEnd.setHours(hourNum + 3, 0, 0, 0)
        
        const sessionsInHour = allSessions.filter((s: any) => {
          if (!s.created_at) return false
          const earnings = s.virtual_earnings || (s.analytics?.virtual_earnings) || 0
          if (!earnings) return false
          const sessionDate = new Date(s.created_at)
          return sessionDate >= hourStart && sessionDate < hourEnd
        })
        
        const total = sessionsInHour.reduce((sum: number, s: any) => {
          const earnings = s.virtual_earnings || (s.analytics?.virtual_earnings) || 0
          return sum + earnings
        }, 0)
        return { day: hour, earnings: total }
      })
      
      const earningsWeekData = weekDays.map((dayName, idx) => {
        const dayDate = new Date(now)
        dayDate.setDate(dayDate.getDate() - (6 - idx))
        dayDate.setHours(0, 0, 0, 0)
        const nextDay = new Date(dayDate)
        nextDay.setDate(nextDay.getDate() + 1)
        
        const sessionsInDay = allSessions.filter((s: any) => {
          if (!s.created_at) return false
          const earnings = s.virtual_earnings || (s.analytics?.virtual_earnings) || 0
          if (!earnings) return false
          const sessionDate = new Date(s.created_at)
          return sessionDate >= dayDate && sessionDate < nextDay
        })
        
        const total = sessionsInDay.reduce((sum: number, s: any) => {
          const earnings = s.virtual_earnings || (s.analytics?.virtual_earnings) || 0
          return sum + earnings
        }, 0)
        return { day: dayName, earnings: total }
      })
      
      const earningsMonthData = []
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - (i * 7 + 7))
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        
        const sessionsInWeek = allSessions.filter((s: any) => {
          if (!s.created_at) return false
          const earnings = s.virtual_earnings || (s.analytics?.virtual_earnings) || 0
          if (!earnings) return false
          const sessionDate = new Date(s.created_at)
          return sessionDate >= weekStart && sessionDate < weekEnd
        })
        
        const total = sessionsInWeek.reduce((sum: number, s: any) => {
          const earnings = s.virtual_earnings || (s.analytics?.virtual_earnings) || 0
          return sum + earnings
        }, 0)
        earningsMonthData.push({ day: `Week ${4 - i}`, earnings: total })
      }
      
      console.log('📊 Performance data calculated:', {
        day: dayData.length,
        week: weekData.length,
        month: monthWeeks.length,
        sampleDay: dayData[0],
        sampleWeek: weekData[0]
      })
      
      console.log('💰 Earnings data calculated:', {
        day: earningsDayData.length,
        week: earningsWeekData.length,
        month: earningsMonthData.length,
        sampleDay: earningsDayData[0],
        sampleWeek: earningsWeekData[0]
      })
      
      setPerformanceData({
        day: dayData,
        week: weekData,
        month: monthWeeks
      })
      
      setEarningsData({
        day: earningsDayData,
        week: earningsWeekData,
        month: earningsMonthData
      })
    } else {
      // Default empty data when no sessions exist
      const defaultDayHours = ['6am', '9am', '12pm', '3pm', '6pm', '9pm']
      const defaultWeekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      
      setPerformanceData({
        day: defaultDayHours.map((h: string) => ({ day: h, overall: 0 })),
        week: defaultWeekDays.map((d: string) => ({ day: d, overall: 0 })),
        month: [{ day: 'Week 1', overall: 0 }, { day: 'Week 2', overall: 0 }, { day: 'Week 3', overall: 0 }, { day: 'Week 4', overall: 0 }]
      })
      
      setEarningsData({
        day: defaultDayHours.map((h: string) => ({ day: h, earnings: 0 })),
        week: defaultWeekDays.map((d: string) => ({ day: d, earnings: 0 })),
        month: [{ day: 'Week 1', earnings: 0 }, { day: 'Week 2', earnings: 0 }, { day: 'Week 3', earnings: 0 }, { day: 'Week 4', earnings: 0 }]
      })
    }
    } catch (error) {
      console.error('❌ Error in fetchOverviewData:', error)
      // Ensure metrics are set even on error
      setPerformanceMetrics([
        {
          id: 'overall',
          title: 'Overall Score',
          value: 0,
          change: '+0%',
          feedback: 'Complete your first session to see your scores.',
          borderColor: '#8b5cf6',
          textColor: 'text-purple-300',
          bg: '#4c1d6a',
          glowColor: 'rgba(139, 92, 246, 0.5)'
        },
        {
          id: 'rapport',
          title: 'Rapport',
          value: 0,
          change: '+0%',
          feedback: 'Build connection in the first 30 seconds.',
          borderColor: '#10b981',
          textColor: 'text-emerald-300',
          bg: '#065f46',
          glowColor: 'rgba(16, 185, 129, 0.5)'
        },
        {
          id: 'discovery',
          title: 'Discovery',
          value: 0,
          change: '+0%',
          feedback: 'Ask questions to uncover pain points.',
          borderColor: '#3b82f6',
          textColor: 'text-blue-300',
          bg: '#1e40af',
          glowColor: 'rgba(59, 130, 246, 0.5)'
        },
        {
          id: 'objection',
          title: 'Objection Handling',
          value: 0,
          change: '+0%',
          feedback: 'Turn concerns into opportunities.',
          borderColor: '#f59e0b',
          textColor: 'text-amber-300',
          bg: '#92400e',
          glowColor: 'rgba(245, 158, 11, 0.5)'
        },
        {
          id: 'closing',
          title: 'Closing',
          value: 0,
          change: '+0%',
          feedback: 'Use assumptive language to close.',
          borderColor: '#ec4899',
          textColor: 'text-pink-300',
          bg: '#9f1239',
          glowColor: 'rgba(236, 72, 153, 0.5)'
        }
      ])
    }
  }

  const currentData = performanceData[chartTimeRange] || []
  const currentEarnings = earningsData[earningsTimeRange] || []
  
  // Safety check for empty data
  const hasData = currentData.length > 0 && currentData.some((p: any) => p.overall > 0)
  const hasEarningsData = currentEarnings.length > 0 && currentEarnings.some((e: any) => e.earnings > 0)
  
  console.log('📊 Chart data check:', {
    chartTimeRange,
    dataLength: currentData.length,
    hasData,
    samplePoint: currentData[0],
    earningsLength: currentEarnings.length,
    hasEarningsData,
    sampleEarnings: currentEarnings[0]
  })

  // Use real notifications if available, otherwise show empty state
  const notificationsData = notifications.length > 0 ? notifications : []

  return (
    <div className="space-y-6">
      {/* Performance Metrics Cards - Demo Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2 lg:gap-4">
        {performanceMetrics.map((metric, idx) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className="rounded-lg sm:rounded-xl cursor-pointer transition-all will-change-transform p-2 sm:p-3 lg:p-4 border border-indigo-500/30 bg-black/50 backdrop-blur-sm hover:border-indigo-400/50 hover:bg-black/60"
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <h3 className="text-[9px] sm:text-xs font-semibold text-indigo-300 uppercase tracking-wide font-space">
                {metric.title}
              </h3>
            </div>
            
            <div className="text-lg sm:text-xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 tabular-nums font-space">
              {metric.value}%
            </div>
            
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <p className="text-[9px] sm:text-xs font-semibold text-emerald-400 font-sans">{metric.change} from last week</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black/70 backdrop-blur-sm border border-indigo-500/30 rounded-lg sm:rounded-xl p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-1 font-space">Performance Trend</h3>
              <p className="text-xs sm:text-sm text-slate-400 font-sans">Track your improvement over time</p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex gap-1 bg-black/50 border border-indigo-500/30 rounded-lg p-1">
              {(['day', 'week', 'month'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setChartTimeRange(range)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 font-sans ${
                    chartTimeRange === range
                      ? 'bg-indigo-500/30 text-white border border-indigo-500/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Chart */}
          <div ref={chartRef} className="relative h-48 sm:h-64">
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
                  <div className="bg-black/95 border rounded-lg px-3 py-2 shadow-lg" style={{ borderColor: (() => {
                    if (hoveredPoint.value >= 85) return '#10b981'
                    if (hoveredPoint.value >= 75) return '#22c55e'
                    if (hoveredPoint.value >= 65) return '#84cc16'
                    if (hoveredPoint.value >= 55) return '#eab308'
                    if (hoveredPoint.value >= 45) return '#f97316'
                    return '#ef4444'
                  })() }}>
                    <div className="font-bold text-lg text-center leading-tight mb-1" style={{ color: (() => {
                      if (hoveredPoint.value >= 85) return '#10b981'
                      if (hoveredPoint.value >= 75) return '#22c55e'
                      if (hoveredPoint.value >= 65) return '#84cc16'
                      if (hoveredPoint.value >= 55) return '#eab308'
                      if (hoveredPoint.value >= 45) return '#f97316'
                      return '#ef4444'
                    })() }}>
                      {hoveredPoint.value}%
                    </div>
                    <div className="text-slate-400 text-xs text-center whitespace-nowrap font-sans">
                      {hoveredPoint.day}
                    </div>
                  </div>
                </div>
              )
            })()}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 900 320" style={{ paddingLeft: '20px' }}>
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="50%" stopColor="#EC4899" />
                  <stop offset="100%" stopColor="#F472B6" />
                </linearGradient>
                <linearGradient id="chartAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#EC4899" stopOpacity="0.05" />
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
                    x="50"
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
              {currentData.length > 0 && (
                <motion.path
                  key={`area-${chartTimeRange}`}
                  d={`M 80 280 ${currentData.map((point, idx) => {
                    const spacing = 660
                    const offset = 80
                    const divisor = Math.max(1, currentData.length - 1)
                    const x = 60 + offset + (idx * (spacing / divisor))
                    const y = 280 - (point.overall * 2.8)
                    return `L ${x} ${y}`
                  }).join(' ')} L ${60 + 80 + ((Math.max(0, currentData.length - 1)) * (660 / Math.max(1, currentData.length - 1)))} 280 Z`}
                fill="url(#chartAreaGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                />
              )}

              {/* Vibrant purple/pink gradient line */}
              {currentData.length > 0 && (
                <motion.path
                  key={`line-${chartTimeRange}`}
                  d={currentData.map((point, idx) => {
                    const spacing = 660
                    const offset = 80
                    const divisor = Math.max(1, currentData.length - 1)
                    const x = 60 + offset + (idx * (spacing / divisor))
                    const y = 280 - (point.overall * 2.8)
                    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`
                  }).join(' ')}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                />
              )}

              {/* Larger data points with pink fill */}
              {currentData.map((point, idx) => {
                const spacing = 660
                const offset = 80
                const divisor = Math.max(1, currentData.length - 1)
                const x = 60 + offset + (idx * (spacing / divisor))
                const y = 280 - (point.overall * 2.8)
                
                return (
                  <g key={`point-${chartTimeRange}-${idx}`}>
                    {/* Invisible larger hover area */}
                    <circle
                      cx={x}
                      cy={y}
                      r="25"
                      fill="transparent"
                      stroke="none"
                      onMouseEnter={() => setHoveredPoint({ day: point.day, value: point.overall })}
                      onMouseLeave={() => setHoveredPoint(null)}
                      className="cursor-pointer"
                      style={{ pointerEvents: 'all' }}
                    />
                    {/* Visible circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={hoveredPoint && hoveredPoint.day === point.day ? "8" : "5"}
                      fill="#EC4899"
                      stroke="white"
                      strokeWidth={hoveredPoint && hoveredPoint.day === point.day ? "3" : "2"}
                      className="cursor-pointer transition-all pointer-events-none"
                      style={{
                        transition: 'r 0.2s ease, stroke-width 0.2s ease'
                      }}
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
                      r="8"
                      fill="#EC4899"
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
          className="bg-black/70 backdrop-blur-sm border border-indigo-500/30 rounded-lg sm:rounded-xl p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-1 font-space">Earnings Trend</h3>
              <p className="text-xs sm:text-sm text-slate-400 font-sans">Track your virtual earnings</p>
            </div>
            
            {/* Time Range Selector */}
            <div className="flex gap-1 bg-black/50 border border-indigo-500/30 rounded-lg p-1">
              {(['day', 'week', 'month'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setEarningsTimeRange(range)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 font-sans ${
                    earningsTimeRange === range
                      ? 'bg-indigo-500/30 text-white border border-indigo-500/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Earnings Chart */}
          <div ref={earningsRef} className="relative h-48 sm:h-64">
            {/* Tooltip overlay - positioned absolutely outside SVG */}
            {hoveredEarnings && earningsRef.current && currentEarnings.length > 0 && (() => {
              const rect = earningsRef.current.getBoundingClientRect()
              const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings), 1)
              const idx = currentEarnings.findIndex(p => p.day === hoveredEarnings.day)
              const spacing = 660
              const offset = 80
              const divisor = Math.max(1, currentEarnings.length - 1)
              const x = 60 + offset + (idx * (spacing / divisor))
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
                  <div className="bg-black/95 border border-emerald-500 rounded-lg px-3 py-2 shadow-lg">
                    <div className="font-bold text-lg text-center leading-tight mb-1 text-emerald-400">
                      ${hoveredEarnings.value}
                    </div>
                    <div className="text-slate-400 text-xs text-center whitespace-nowrap font-sans">
                      {hoveredEarnings.day}
                    </div>
                  </div>
                </div>
              )
            })()}
            <svg className="w-full h-full overflow-visible" viewBox="0 0 900 320" style={{ paddingLeft: '20px' }}>
              <defs>
                <linearGradient id="earningsAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((percentage) => {
                const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings), 1)
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
                const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings), 1)
                const value = Math.round((percentage / 100) * maxEarnings)
                const y = 280 - (percentage * 2.8)
                return (
                  <text
                    key={percentage}
                    x="50"
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
              {currentEarnings.length > 0 && (
                <motion.path
                  key={`earnings-area-${earningsTimeRange}`}
                  d={`M 80 280 ${currentEarnings.map((point, idx) => {
                    const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings), 1)
                    const spacing = 660
                    const offset = 80
                    const divisor = Math.max(1, currentEarnings.length - 1)
                    const x = 60 + offset + (idx * (spacing / divisor))
                    const y = 280 - ((point.earnings / maxEarnings) * 280)
                    return `L ${x} ${y}`
                  }).join(' ')} L ${60 + 80 + ((Math.max(0, currentEarnings.length - 1)) * (660 / Math.max(1, currentEarnings.length - 1)))} 280 Z`}
                  fill="url(#earningsAreaGradient)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                />
              )}

              {/* Green line with glow */}
              {currentEarnings.length > 0 && (
                <motion.path
                  key={`earnings-line-${earningsTimeRange}`}
                  d={currentEarnings.map((point, idx) => {
                    const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings), 1)
                    const spacing = 660
                    const offset = 80
                    const divisor = Math.max(1, currentEarnings.length - 1)
                    const x = 60 + offset + (idx * (spacing / divisor))
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
              )}

              {/* Data points */}
              {currentEarnings.map((point, idx) => {
                const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings), 1)
                const spacing = 660
                const offset = 80
                const divisor = Math.max(1, currentEarnings.length - 1)
                const x = 60 + offset + (idx * (spacing / divisor))
                const y = 280 - ((point.earnings / maxEarnings) * 280)
                
                return (
                  <g key={`earnings-point-${earningsTimeRange}-${idx}`}>
                    {/* Invisible larger hover area */}
                    <circle
                      cx={x}
                      cy={y}
                      r="25"
                      fill="transparent"
                      stroke="none"
                      onMouseEnter={() => setHoveredEarnings({ day: point.day, value: point.earnings })}
                      onMouseLeave={() => setHoveredEarnings(null)}
                      className="cursor-pointer"
                      style={{ pointerEvents: 'all' }}
                    />
                    {/* Visible circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={hoveredEarnings && hoveredEarnings.day === point.day ? "12" : "10"}
                      fill="#10b981"
                      stroke="white"
                      strokeWidth={hoveredEarnings && hoveredEarnings.day === point.day ? "3" : "2"}
                      className="cursor-pointer transition-all pointer-events-none"
                      style={{
                        transition: 'r 0.2s ease, stroke-width 0.2s ease'
                      }}
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
              {hoveredEarnings && currentEarnings.length > 0 && (() => {
                const maxEarnings = Math.max(...currentEarnings.map(e => e.earnings), 1)
                const idx = currentEarnings.findIndex(p => p.day === hoveredEarnings.day)
                const spacing = 660
                const offset = 80
                const divisor = Math.max(1, currentEarnings.length - 1)
                const x = 60 + offset + (idx * (spacing / divisor))
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Recent Sessions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-black/50 backdrop-blur-sm border border-indigo-500/30 rounded-lg sm:rounded-xl p-4 min-h-[280px] sm:min-h-[320px]"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white font-space">Recent Sessions</h3>
            <Link href="/sessions" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium font-sans">
              View All →
            </Link>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm font-sans">No recent sessions</p>
                <p className="text-xs mt-1 font-sans">Complete a practice session to see it here</p>
              </div>
            ) : recentSessions.slice(0, 3).map((session, idx) => {
              const circumference = 2 * Math.PI * 16
              const strokeDashoffset = circumference - (session.score / 100) * circumference
              const gradients = ['from-purple-500/30', 'from-blue-500/30', 'from-pink-500/30']

              return (
                <Link
                  key={session.id || idx}
                  href={session.id ? `/analytics/${session.id}` : '/sessions'}
                >
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/30 hover:bg-black/50 transition-colors border border-indigo-500/20 cursor-pointer"
                  >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10">
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradients[idx]} to-transparent blur-md`}></div>
                      {(() => {
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
                              src={session.avatar || '/agents/default.png'}
                              alt={session.name}
                              className="relative w-full h-full rounded-full ring-2 ring-white/20 z-10 object-cover"
                              onError={(e) => {
                                // Fallback to default if image fails to load
                                const target = e.target as HTMLImageElement
                                if (target.src !== '/agents/default.png') {
                                  target.src = '/agents/default.png'
                                }
                              }}
                            />
                          </>
                        )
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate font-sans">{session.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-sans">{session.time}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="relative w-8 h-8">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="3" fill="none" />
                        <motion.circle
                          cx="18"
                          cy="18"
                          r="16"
                          stroke={(() => {
                            if (session.score >= 90) return '#10b981'
                            if (session.score >= 80) return '#22c55e'
                            if (session.score >= 70) return '#eab308'
                            if (session.score >= 60) return '#f97316'
                            return '#ef4444'
                          })()}
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
                        <span className="text-[9px] font-bold text-white font-space">{session.score}%</span>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-emerald-400 tabular-nums font-sans">+${session.earned}</div>
                  </div>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </motion.div>

        {/* Insights - Enhanced */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-black/50 backdrop-blur-sm border border-indigo-500/30 rounded-lg sm:rounded-xl p-4 min-h-[280px] sm:min-h-[320px]"
        >
          <h3 className="text-sm font-bold text-white mb-2 font-space">Insights</h3>

          <div className="space-y-2 sm:space-y-2.5">
            {insightsData.map((insight, idx) => {
              const Icon = insight.icon
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + idx * 0.1 }}
                  className="pb-2.5 border-b border-indigo-500/20 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-500/20">
                      <Icon className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[11px] font-bold text-white font-space">{insight.title}</h4>
                      <p className="text-[10px] text-slate-200 leading-relaxed font-sans">
                        {insight.percentage && <span className="text-indigo-400 font-semibold">{insight.percentage}</span>}
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
          className="bg-black/50 backdrop-blur-sm border border-indigo-500/30 rounded-lg sm:rounded-xl p-4 min-h-[280px] sm:min-h-[320px]"
        >
          <h3 className="text-sm font-bold text-white mb-2 font-space">Notifications</h3>

          <div className="space-y-2 sm:space-y-2.5">
            {notificationsData.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm font-sans">No notifications</p>
                <p className="text-xs mt-1 font-sans">You're all caught up!</p>
              </div>
            ) : notificationsData.map((notif, idx) => {
              const getIcon = () => {
                switch(notif.type) {
                  case 'manager':
                    return MessageCircle
                  case 'leaderboard':
                    return TrendingUp
                  case 'achievement':
                    return Award
                  default:
                    return AlertCircle
                }
              }
              const Icon = getIcon()
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + idx * 0.1 }}
                  className="p-2 rounded-lg border border-indigo-500/20 transition-colors cursor-pointer bg-black/30 hover:bg-black/50"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-500/20">
                      <Icon className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-[11px] font-bold text-white font-space">{notif.title}</h4>
                        <span className="text-[9px] text-slate-400 font-medium font-sans">{notif.time}</span>
                      </div>
                      <p className="text-[10px] text-slate-200 leading-relaxed font-sans">{notif.message}</p>
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
  const supabase = createClient()
  const [userRole, setUserRole] = useState<'manager' | 'rep' | 'admin' | null>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  
  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchUserRole()
    fetchVideos()
  }, [])

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile) {
      setUserRole(userProfile.role as 'manager' | 'rep' | 'admin')
    }
  }

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/team/learning-videos')
      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos || [])
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a video file (MP4, WebM, MOV, or AVI)')
      return
    }
    setUploadFile(file)
  }

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
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      alert('Please select a video file and enter a title')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', uploadTitle.trim())
      if (uploadDescription.trim()) {
        formData.append('description', uploadDescription.trim())
      }

      const response = await fetch('/api/team/learning-videos/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        // Reset form
        setUploadTitle('')
        setUploadDescription('')
        setUploadFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        // Refresh videos list
        await fetchVideos()
        alert('Video uploaded successfully!')
      } else {
        const error = await response.json()
        alert(`Upload failed: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload video. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return
    }

    try {
      const response = await fetch(`/api/team/learning-videos?id=${videoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchVideos()
        alert('Video deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Delete failed: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete video. Please try again.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const isManager = userRole === 'manager' || userRole === 'admin'

  if (loading) {
  return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

            return (
    <div className="space-y-6">
      {isManager ? (
        <>
          {/* Upload Section for Managers */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6"
            style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
          >
            <h3 className="text-lg font-bold text-white mb-4 font-space">Upload Training Video</h3>
            
            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDragging ? 'border-[#a855f7] bg-[#a855f7]/10' : 'border-[#2a2a2a]'
              }`}
            >
              <Video className="w-12 h-12 text-[#a855f7] mx-auto mb-4" />
              <p className="text-white mb-2">
                {uploadFile ? uploadFile.name : 'Drag & drop a video file here'}
              </p>
              <p className="text-sm text-slate-400 mb-4">
                or click to browse (MP4, WebM, MOV, AVI)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#a855f7] text-white rounded-lg hover:bg-[#9333ea] transition-colors"
              >
                Choose File
              </button>
            </div>

            {/* Title and Description */}
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter video title"
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#a855f7]"
                />
                  </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Enter video description"
                  rows={3}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#a855f7] resize-none"
                />
              </div>
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadFile || !uploadTitle.trim()}
                className="w-full px-6 py-3 bg-[#a855f7] text-white font-medium rounded-lg hover:bg-[#9333ea] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Video'}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}

      {/* Videos List */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">
          {isManager ? 'Team Training Videos' : 'Training Videos'}
        </h3>
        
        {videos.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center">
            <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              {isManager ? 'No videos uploaded yet. Upload your first training video above.' : 'No training videos available yet.'}
            </p>
                    </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video, idx) => (
                      <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden hover:border-[#a855f7]/50 transition-colors"
                style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
              >
                {/* Video Player */}
                <div className="relative bg-black aspect-video">
                  {selectedVideo === video.id ? (
                    <video
                      src={video.video_url}
                      controls
                      className="w-full h-full"
                      onLoadStart={() => setSelectedVideo(video.id)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={() => setSelectedVideo(video.id)}
                        className="p-4 bg-[#a855f7]/80 hover:bg-[#a855f7] rounded-full transition-colors"
                      >
                        <Play className="w-8 h-8 text-white" />
                      </button>
                    </div>
                  )}
                  </div>
                
                {/* Video Info */}
                <div className="p-4">
                  <h4 className="text-base font-bold text-white mb-2 line-clamp-2">
                    {video.title}
                  </h4>
                  {video.description && (
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{formatDate(video.created_at)}</span>
                    {video.file_size && (
                      <span>{formatFileSize(video.file_size)}</span>
                    )}
                  </div>
                  {video.uploaded_by_name && (
                    <p className="text-xs text-slate-500 mt-1">
                      Uploaded by {video.uploaded_by_name}
                    </p>
                  )}
                  
                  {/* Delete button for managers */}
                  {isManager && (
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="mt-3 px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
        </div>
        )}
      </div>
    </div>
  )
}

function UploadTabContent() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [grading, setGrading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRecordingUI, setShowRecordingUI] = useState(false)
  const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording, error: recordingError } = useVoiceRecorder()
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ 
    id: string
    name: string
    size: string
    date: string
    score: number | null
    duration: number | null
  }>>([])
  const [loadingUploads, setLoadingUploads] = useState(true)

  // Refresh uploaded files list
  const refreshUploadedFiles = async () => {
    setLoadingUploads(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoadingUploads(false)
        return
      }

      // Fetch sessions with upload_type = 'file_upload'
      const { data: sessions, error } = await supabase
        .from('live_sessions')
        .select('id, created_at, overall_score, duration_seconds, audio_url')
        .eq('user_id', user.id)
        .eq('upload_type', 'file_upload')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching uploaded sessions:', error)
        setLoadingUploads(false)
        return
      }

      // Format sessions for display
      const formatted = (sessions || []).map((session: any) => {
        const date = new Date(session.created_at)
        const fileName = session.audio_url 
          ? session.audio_url.split('/').pop() || 'Uploaded Recording'
          : 'Uploaded Recording'
        
        return {
          id: session.id,
          name: fileName.length > 50 ? fileName.substring(0, 50) + '...' : fileName,
          size: session.duration_seconds 
            ? `${Math.floor(session.duration_seconds / 60)}:${(session.duration_seconds % 60).toString().padStart(2, '0')}`
            : 'N/A',
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          score: session.overall_score,
          duration: session.duration_seconds
        }
      })

      setUploadedFiles(formatted)
      setLoadingUploads(false)
    } catch (err) {
      console.error('Error fetching uploaded sessions:', err)
      setLoadingUploads(false)
    }
  }

  // Fetch uploaded sessions from database on mount and when window regains focus
  useEffect(() => {
    refreshUploadedFiles()
    
    // Refresh when window regains focus (user returns from analytics page)
    const handleFocus = () => {
      refreshUploadedFiles()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type - check both MIME type and file extension
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'video/mp4', 'video/quicktime', 'audio/m4a']
    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase()
    const validExtensions = ['mp3', 'wav', 'webm', 'mp4', 'mov', 'm4a']
    
    const isValidType = validTypes.includes(selectedFile.type) || (fileExt && validExtensions.includes(fileExt))
    
    if (!isValidType) {
      setError('Please upload an audio file (MP3, WAV, M4A, WEBM, MP4, or MOV)')
      return
    }

    // Validate file size (max 100MB)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB')
      return
    }

    setFile(selectedFile)
    setError(null)
  }

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
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      // Validate file type - check both MIME type and file extension
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'video/mp4', 'video/quicktime', 'audio/m4a']
      const fileExt = droppedFile.name.split('.').pop()?.toLowerCase()
      const validExtensions = ['mp3', 'wav', 'webm', 'mp4', 'mov', 'm4a']
      
      const isValidType = validTypes.includes(droppedFile.type) || (fileExt && validExtensions.includes(fileExt))
      
      if (isValidType) {
        if (droppedFile.size > 100 * 1024 * 1024) {
          setError('File size must be less than 100MB')
          return
        }
        setFile(droppedFile)
        setError(null)
      } else {
        setError('Please upload an audio file (MP3, WAV, M4A, WEBM, MP4, or MOV)')
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      // Get auth token
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Please log in to upload files')
      }

      // Step 1: Upload audio file
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadData = await uploadResponse.json()

      // Step 2: Transcribe audio and create session
      setUploading(false)
      setGrading(true)

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          fileUrl: uploadData.fileUrl,
          filename: uploadData.filename
        })
      })

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json()
        const errorMessage = errorData.error || 'Transcription failed'
        const errorDetails = errorData.details ? `: ${errorData.details}` : ''
        const errorHint = errorData.hint ? ` (${errorData.hint})` : ''
        throw new Error(`${errorMessage}${errorDetails}${errorHint}`)
      }

      const transcribeData = await transcribeResponse.json()
      const newSessionId = transcribeData.sessionId

      // Grading is triggered automatically by the transcription API in the background
      setGrading(false)
      setFile(null)
      
      // Redirect to loading page, which will poll for grading completion
      // and then redirect to analytics page with results
      router.push(`/trainer/loading/${newSessionId}`)

    } catch (err: any) {
      console.error('Upload/grading error:', err)
      setError(err.message || 'Failed to process audio file')
      setUploading(false)
      setGrading(false)
    }
  }

  const handleRecordNow = async () => {
    setShowRecordingUI(true)
    await startRecording()
  }

  const handleStopRecording = async () => {
    const blob = await stopRecording()
    if (!blob) return

    setShowRecordingUI(false)
    // Ensure the MIME type is set correctly for webm files
    // MediaRecorder might return 'audio/webm;codecs=opus', so normalize it
    let mimeType = blob.type || 'audio/webm'
    if (mimeType.includes('webm')) {
      mimeType = 'audio/webm'
    } else if (mimeType.includes('mp4')) {
      mimeType = 'audio/mp4'
    }
    
    const file = new File([blob], `recording-${Date.now()}.webm`, { type: mimeType })
    setFile(file)
    setError(null)
  }

  const handleCancelRecording = () => {
    cancelRecording()
    setShowRecordingUI(false)
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
        onClick={() => !file && !uploading && !grading && fileInputRef.current?.click()}
        className={`bg-[#1a1a1a] border-2 border-dashed rounded-lg p-10 text-center transition-all cursor-pointer ${
          isDragging ? 'border-[#a855f7]' : 'border-[#2a2a2a]'
        } ${(uploading || grading) ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/mp4,video/quicktime"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || grading}
        />

        <div className="flex justify-center mb-4">
          <div className="p-6 rounded-full bg-[#0a0a0a] border border-[#2a2a2a]">
            {file ? (
              <Upload className="w-20 h-20 text-green-400" />
            ) : (
              <Upload className="w-20 h-20 text-[#a855f7]" />
            )}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">
          Upload Your Sales Calls
        </h3>
        <p className="text-sm text-[#8a8a8a] mb-6 max-w-2xl mx-auto leading-relaxed">
          Drop your audio files here or click to browse. We support MP3, WAV, M4A and more.
        </p>
        
        {file ? (
          <div className="space-y-4">
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 max-w-md mx-auto">
              <p className="text-white font-medium mb-1">{file.name}</p>
              <p className="text-xs text-[#8a8a8a]">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                  setError(null)
                }}
                disabled={uploading || grading}
                className="px-6 py-2 bg-transparent text-white font-medium rounded-lg border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
              >
                Remove
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleUpload()
                }}
                disabled={uploading || grading}
                className="px-8 py-3 bg-[#a855f7] text-white font-medium rounded-lg hover:bg-[#9333ea] transition-colors shadow-[0_2px_8px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(uploading || grading) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploading ? 'Uploading...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload & Analyze
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
              disabled={uploading || grading}
              className="px-8 py-3 bg-[#a855f7] text-white font-medium rounded-lg hover:bg-[#9333ea] transition-colors shadow-[0_2px_8px_rgba(168,85,247,0.3)] disabled:opacity-50"
            >
              Choose Files
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRecordNow()
              }}
              disabled={uploading || grading || isRecording}
              className="px-8 py-3 bg-transparent text-white font-medium rounded-lg border border-[#a855f7] hover:bg-[#a855f7]/10 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              Record Now
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-8 text-sm text-[#8a8a8a]">
          <span>Max 100MB</span>
          <span>•</span>
          <span>All audio formats</span>
          <span>•</span>
          <span>Secure</span>
        </div>
      </motion.div>

      {/* Recording UI */}
      <AnimatePresence>
        {showRecordingUI && isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6"
            style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white font-semibold">Recording</span>
                <span className="text-[#8a8a8a] text-sm">{formatTime(recordingTime)}</span>
              </div>
              <button
                onClick={handleCancelRecording}
                className="text-[#8a8a8a] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {recordingError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-300">{recordingError}</p>
              </div>
            )}
            <button
              onClick={handleStopRecording}
              className="w-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop Recording
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files */}
      {(uploadedFiles.length > 0 || loadingUploads) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4"
          style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
        >
          <h3 className="text-base font-bold text-white mb-3">Recent Uploads</h3>
          
          {loadingUploads ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#8a8a8a] animate-spin" />
            </div>
          ) : uploadedFiles.length > 0 ? (
            <div className="space-y-2.5">
              {uploadedFiles.map((file, idx) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                  onClick={() => router.push(`/analytics/${file.id}`)}
                >
                  <div className="flex items-center gap-4">
                    {/* Circular Upload Icon Bubble */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <Upload className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{file.name}</p>
                      <p className="text-xs text-[#8a8a8a]">
                        {file.size} • {file.date}
                        {file.score !== null && (
                          <span className={`ml-2 font-semibold ${
                            file.score >= 80 ? 'text-green-400' : 
                            file.score >= 60 ? 'text-yellow-400' : 
                            'text-red-400'
                          }`}>
                            • {file.score}%
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/analytics/${file.id}`)
                      }}
                      className="px-4 py-2 bg-[#a855f7] text-white text-sm font-medium rounded-lg hover:bg-[#9333ea] transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#8a8a8a] text-center py-4">No uploads yet</p>
          )}
        </motion.div>
      )}
    </div>
  )
}

function TeamTabContent() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [teamStats, setTeamStats] = useState({
    teamSize: 0,
    avgTeamScore: 0,
    topPerformer: '',
    teamGrowth: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  useEffect(() => {
    fetchTeamData()
  }, [])
  
  const fetchTeamData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    
    // Get user's team_id
    const { data: userProfile } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .single()
    
    if (!userProfile?.team_id) {
      setLoading(false)
      return
    }
    
    // Get all team members
    const { data: teamMembers } = await supabase
      .from('users')
      .select('id, full_name, virtual_earnings, email')
      .eq('team_id', userProfile.team_id)
      .order('virtual_earnings', { ascending: false })
    
    if (!teamMembers || teamMembers.length === 0) {
      setLoading(false)
      return
    }
    
    // Calculate team stats
    const teamSize = teamMembers.length
    
    // Get average team score from sessions
    const { data: allTeamSessions } = await supabase
      .from('live_sessions')
      .select('overall_score, user_id')
      .in('user_id', teamMembers.map((m: any) => m.id))
      .not('overall_score', 'is', null)
    
    const avgTeamScore = allTeamSessions && allTeamSessions.length > 0
      ? Math.round(allTeamSessions.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / allTeamSessions.length)
      : 0
    
    // Top performer
    const topPerformer = teamMembers.length > 0 
      ? teamMembers[0].full_name || teamMembers[0].email?.split('@')[0] || 'N/A'
      : 'N/A'
    
    // Calculate team growth - compare current period vs previous period
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    
    // Get current period sessions
    const { data: currentPeriodSessions } = await supabase
      .from('live_sessions')
      .select('overall_score, user_id')
      .in('user_id', teamMembers.map((m: any) => m.id))
      .gte('created_at', currentMonthStart.toISOString())
      .not('overall_score', 'is', null)
    
    // Get previous period sessions
    const { data: previousPeriodSessions } = await supabase
      .from('live_sessions')
      .select('overall_score, user_id')
      .in('user_id', teamMembers.map((m: any) => m.id))
      .gte('created_at', previousMonthStart.toISOString())
      .lt('created_at', currentMonthStart.toISOString())
      .not('overall_score', 'is', null)
    
    const currentAvg = currentPeriodSessions && currentPeriodSessions.length > 0
      ? currentPeriodSessions.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / currentPeriodSessions.length
      : 0
    
    const previousAvg = previousPeriodSessions && previousPeriodSessions.length > 0
      ? previousPeriodSessions.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / previousPeriodSessions.length
      : 0
    
    const teamGrowth = previousAvg > 0 
      ? Math.round(((currentAvg - previousAvg) / previousAvg) * 100)
      : currentAvg > 0 ? 100 : 0
    
    setTeamStats({
      teamSize,
      avgTeamScore,
      topPerformer,
      teamGrowth
    })
    
    // Build leaderboard with change calculations (reuse date variables from above)
    // Note: now, currentMonthStart, previousMonthStart already defined above
    
    // Get current period earnings for all members
    const { data: currentPeriodEarnings } = await supabase
      .from('live_sessions')
      .select('user_id, virtual_earnings')
      .in('user_id', teamMembers.map((m: any) => m.id))
      .gte('created_at', currentMonthStart.toISOString())
      .not('virtual_earnings', 'is', null)
    
    // Get previous period earnings
    const { data: previousPeriodEarnings } = await supabase
      .from('live_sessions')
      .select('user_id, virtual_earnings')
      .in('user_id', teamMembers.map((m: any) => m.id))
      .gte('created_at', previousMonthStart.toISOString())
      .lt('created_at', currentMonthStart.toISOString())
      .not('virtual_earnings', 'is', null)
    
    // Calculate earnings per member for each period
    const currentEarningsMap = new Map<string, number>()
    currentPeriodEarnings?.forEach((s: any) => {
      const current = currentEarningsMap.get(s.user_id) || 0
      currentEarningsMap.set(s.user_id, current + (s.virtual_earnings || 0))
    })
    
    const previousEarningsMap = new Map<string, number>()
    previousPeriodEarnings?.forEach((s: any) => {
      const current = previousEarningsMap.get(s.user_id) || 0
      previousEarningsMap.set(s.user_id, current + (s.virtual_earnings || 0))
    })
    
    // Build leaderboard
    const leaderboardData = teamMembers.map((member: any, index: number) => {
      const isYou = member.id === user.id
      const firstName = member.full_name?.split(' ')[0] || 'User'
      const lastName = member.full_name?.split(' ').slice(1).join(' ') || ''
      const displayName = isYou ? `${firstName} ${lastName} (You)` : member.full_name || 'Team Member'
      
      // Calculate change from previous period
      const currentEarnings = currentEarningsMap.get(member.id) || 0
      const previousEarnings = previousEarningsMap.get(member.id) || 0
      const change = previousEarnings > 0
        ? Math.round(((currentEarnings - previousEarnings) / previousEarnings) * 100)
        : currentEarnings > 0 ? 100 : 0
      
      const changeDisplay = change > 0 
        ? `+${change}%` 
        : change < 0 
        ? `${change}%` 
        : '+0%'
      
      return {
        rank: index + 1,
        name: displayName,
        score: member.virtual_earnings || 0,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name || member.email || 'User')}&background=random`,
        change: changeDisplay,
        badge: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : undefined,
        isYou
      }
    })
    
    setLeaderboard(leaderboardData)
    setLoading(false)
  }
  
  const teamStatsArray = [
    { 
      label: 'Team Size', 
      value: `${teamStats.teamSize}`, 
      icon: UsersIcon,
      borderColor: '#2a4a6a',
      bg: '#1a2a3a',
      textColor: 'text-blue-200',
      glowColor: 'rgba(59, 130, 246, 0.1)'
    },
    { 
      label: 'Avg Team Score', 
      value: `${teamStats.avgTeamScore}%`, 
      icon: TrendingUp,
      borderColor: '#4a2a6a',
      bg: '#2a1a3a',
      textColor: 'text-purple-200',
      glowColor: 'rgba(138, 43, 226, 0.1)'
    },
    { 
      label: 'Top Performer', 
      value: teamStats.topPerformer, 
      icon: Award,
      borderColor: '#6a4a2a',
      bg: '#3a2a1a',
      textColor: 'text-amber-200',
      glowColor: 'rgba(245, 158, 11, 0.1)'
    },
    { 
      label: 'Team Growth', 
      value: teamStats.teamGrowth > 0 ? `+${teamStats.teamGrowth}%` : '0%', 
      icon: Zap,
      borderColor: '#2a6a4a',
      bg: '#1a3a2a',
      textColor: 'text-emerald-200',
      glowColor: 'rgba(16, 185, 129, 0.1)'
    },
  ]

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          {/* Team Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {teamStatsArray.map((stat, idx) => {
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
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <p className="text-sm">No team members found</p>
            </div>
          ) : leaderboard.map((member, idx) => (
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
                <p className="text-lg font-bold text-green-400">${(member.score || 0).toFixed(2)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
        </>
      )}
    </div>
  )
}

