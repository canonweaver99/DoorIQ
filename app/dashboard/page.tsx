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
  X,
  User,
  BarChart3,
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { OnboardingBanner } from '@/components/dashboard/OnboardingBanner'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import Link from 'next/link'
import Image from 'next/image'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import dynamic from 'next/dynamic'
import { getAgentImageStyle } from '@/lib/agents/imageStyles'
import { format } from 'date-fns'

// Dynamic import for CircularProgress
const CircularProgress = dynamic(() => import('@/components/ui/CircularProgress'), { ssr: false })

// Helper to get cutout bubble image (no background)
const getAgentBubbleImage = (agentName: string | null): string => {
  if (!agentName) return '/agents/default.png'
  const agentNameTyped = agentName as AllowedAgentName
  if (PERSONA_METADATA[agentNameTyped]?.bubble?.image) {
    return PERSONA_METADATA[agentNameTyped].bubble.image
  }
  return '/agents/default.png'
}

// Helper to get agent color variant
const getAgentColorVariant = (agentName: string | null): keyof typeof COLOR_VARIANTS => {
  if (!agentName) return 'primary'
  const agentNameTyped = agentName as AllowedAgentName
  if (PERSONA_METADATA[agentNameTyped]?.bubble?.color) {
    return PERSONA_METADATA[agentNameTyped].bubble.color as keyof typeof COLOR_VARIANTS
  }
  return 'primary'
}

// Get cutout bubble image (no background) - for consistency with practice page
const getAgentImage = (agentName: string | null): string => {
  if (!agentName) return '/agents/default.png'
  const agentNameTyped = agentName as AllowedAgentName
  if (PERSONA_METADATA[agentNameTyped]?.bubble?.image) {
    return PERSONA_METADATA[agentNameTyped].bubble.image
  }
  return '/agents/default.png'
}

// Helper to format duration
const formatDuration = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0m'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// Helper to get score color
const getScoreColor = (score: number) => {
  if (!score || isNaN(score)) return 'text-slate-400'
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
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
      console.error('Error fetching weekly sessions:', weekError)
    }
    
    // Get total sessions count (all time) - include all sessions regardless of status
    const { data: allSessionsData, error: allError } = await supabase
      .from('live_sessions')
      .select('id, created_at, ended_at, agent_name')
      .eq('user_id', user.id)
    
    if (allError) {
      console.error('Error fetching all sessions:', allError)
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

  // Removed quickStats cards as per requirements

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836] pt-16 pb-2 sm:pb-4 lg:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Onboarding Banner */}
        <OnboardingBanner />
        
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

// Helper function to get key insights from session
const getKeyInsights = (session: any) => {
  const insights = []
  
  // Check for low scores
  if (session.rapport_score && session.rapport_score < 70) {
    insights.push({ type: 'warning', text: 'Work on building rapport early in the conversation' })
  }
  if (session.objection_handling_score && session.objection_handling_score < 70) {
    insights.push({ type: 'warning', text: 'Practice handling common objections more confidently' })
  }
  const closing = session.close_effectiveness_score ?? session.close_score ?? null
  if (closing && closing < 70) {
    insights.push({ type: 'warning', text: 'Focus on closing techniques and asking for the sale' })
  }
  
  // Check for high scores
  const safety = session.safety_score ?? null
  if (safety && safety >= 80) {
    insights.push({ type: 'success', text: 'Great job addressing safety concerns!' })
  }
  if (session.overall_score && session.overall_score >= 80) {
    insights.push({ type: 'success', text: 'Excellent overall performance!' })
  }
  
  // Return only the first insight
  return insights.slice(0, 1)
}

// Overview Tab Component (Merged with Performance)
function OverviewTabContent() {
  const [chartTimeRange, setChartTimeRange] = useState<'day' | 'week' | 'month'>('week')
  const [earningsTimeRange, setEarningsTimeRange] = useState<'day' | 'week' | 'month'>('week')
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; value: number; } | null>(null)
  const [hoveredEarnings, setHoveredEarnings] = useState<{ day: string; value: number; } | null>(null)
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<{ full_name: string; email: string; avatar_url?: string; rep_id?: string; created_at?: string; role?: string } | null>(null)
  const [circleSize, setCircleSize] = useState(96)
  const [skillStats, setSkillStats] = useState<{
    overall: { current: number; previous: number }
    rapport: { current: number; previous: number }
    discovery: { current: number; previous: number }
    objection: { current: number; previous: number }
    closing: { current: number; previous: number }
  } | null>(null)
  const [summaryStats, setSummaryStats] = useState<{
    totalEarnings: number
    averageScore: number
    bestScore: number
    totalSessions: number
    closePercentage: number
  } | null>(null)
  const [performanceChartData, setPerformanceChartData] = useState<Array<{ session: string; score: number; earnings: number; date: string }>>([])
  const [earningsChartData, setEarningsChartData] = useState<Array<{ session: string; earnings: number; date: string }>>([])
  const [allSessionsForList, setAllSessionsForList] = useState<any[]>([])
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
  
  // Set circle size based on screen width
  useEffect(() => {
    const handleResize = () => {
      setCircleSize(window.innerWidth >= 1024 ? 96 : 80)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
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

      // Fetch user profile
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email, avatar_url, rep_id, created_at, role, virtual_earnings')
        .eq('id', user.id)
        .single()
      
      if (userData) {
        setUserProfile({
          full_name: userData.full_name || '',
          email: userData.email || '',
          avatar_url: userData.avatar_url || undefined,
          rep_id: userData.rep_id || undefined,
          created_at: userData.created_at || undefined,
          role: userData.role || 'rep'
        })
      }
      
      // Get ALL user sessions for calculating averages and trends (with dates and earnings)
      // Include both graded and ungraded sessions for complete data
      const { data: allSessionsRaw, error: allSessionsError } = await supabase
        .from('live_sessions')
        .select('id, overall_score, rapport_score, discovery_score, objection_handling_score, close_score, created_at, virtual_earnings, analytics, agent_name, duration_seconds, sale_closed')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (allSessionsError) {
        console.error('❌ Error fetching all sessions:', allSessionsError)
      }
      
      // Filter to only sessions with scores for trend calculations
      const allSessions = (allSessionsRaw || []).filter((s: any) => s.overall_score !== null && s.overall_score !== undefined)
      
      // Store all sessions for list display
      setAllSessionsForList(allSessionsRaw || [])
      
      // Calculate week-over-week comparisons (last 7 days vs previous 7 days)
      const now = new Date()
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const fourteenDaysAgo = new Date(now)
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
      
      const recentSessions = allSessions.filter((s: any) => {
        const sessionDate = new Date(s.created_at)
        return sessionDate >= sevenDaysAgo
      })
      
      const previousSessions = allSessions.filter((s: any) => {
        const sessionDate = new Date(s.created_at)
        return sessionDate >= fourteenDaysAgo && sessionDate < sevenDaysAgo
      })
      
      const calculateAverage = (sessions: any[], field: string) => {
        const valid = sessions.filter(s => s[field] !== null && s[field] !== undefined)
        if (valid.length === 0) return 0
        return Math.round(valid.reduce((sum, s) => sum + (s[field] || 0), 0) / valid.length)
      }
      
      const skillStatsData = {
        overall: {
          current: calculateAverage(recentSessions, 'overall_score'),
          previous: calculateAverage(previousSessions, 'overall_score')
        },
        rapport: {
          current: calculateAverage(recentSessions, 'rapport_score'),
          previous: calculateAverage(previousSessions, 'rapport_score')
        },
        discovery: {
          current: calculateAverage(recentSessions, 'discovery_score'),
          previous: calculateAverage(previousSessions, 'discovery_score')
        },
        objection: {
          current: calculateAverage(recentSessions, 'objection_handling_score'),
          previous: calculateAverage(previousSessions, 'objection_handling_score')
        },
        closing: {
          current: calculateAverage(recentSessions, 'close_score'),
          previous: calculateAverage(previousSessions, 'close_score')
        }
      }
      
      setSkillStats(skillStatsData)
      
      // Calculate summary stats
      const totalEarnings = allSessions.reduce((sum: number, s: any) => {
        const earnings = s.virtual_earnings || (s.analytics?.virtual_earnings) || 0
        return sum + earnings
      }, 0)
      
      const scores = allSessions.map((s: any) => s.overall_score || 0)
      const averageScore = scores.length > 0 
        ? Math.round(scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length)
        : 0
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0
      const totalSessions = allSessionsRaw?.length || 0
      const closedSessions = allSessionsRaw?.filter((s: any) => s.sale_closed === true).length || 0
      const closePercentage = totalSessions > 0 ? Math.round((closedSessions / totalSessions) * 100) : 0
      
      setSummaryStats({
        totalEarnings,
        averageScore,
        bestScore,
        totalSessions,
        closePercentage
      })
      
      // Prepare chart data for Recent Performance (last 10 sessions)
      const chartData = allSessionsRaw && allSessionsRaw.length > 0 
        ? allSessionsRaw.slice(0, 10).reverse().map((session: any, index: number) => ({
            session: `#${allSessionsRaw.length - index}`,
            score: session.overall_score || 0,
            earnings: session.virtual_earnings || (session.analytics?.virtual_earnings) || 0,
            date: new Date(session.created_at).toLocaleDateString()
          }))
        : Array.from({ length: 10 }, (_, i) => ({
            session: `#${i + 1}`,
            score: 0,
            earnings: 0,
            date: ''
          }))
      
      setPerformanceChartData(chartData)
      
      // Prepare earnings chart data
      const earningsChartData = allSessionsRaw && allSessionsRaw.length > 0
        ? allSessionsRaw.slice(0, 10).reverse().map((session: any, index: number) => ({
            session: `#${allSessionsRaw.length - index}`,
            earnings: session.virtual_earnings || (session.analytics?.virtual_earnings) || 0,
            date: new Date(session.created_at).toLocaleDateString()
          }))
        : Array.from({ length: 10 }, (_, i) => ({
            session: `#${i + 1}`,
            earnings: 0,
            date: ''
          }))
      
      setEarningsChartData(earningsChartData)
      
      // Get recent sessions with agent_name (for display) - fetch all sessions, not just graded ones
      const { data: recentSessionsData, error: recentSessionsError } = await supabase
        .from('live_sessions')
        .select('id, overall_score, created_at, ended_at, homeowner_name, agent_name, agent_persona, virtual_earnings, analytics, duration_seconds')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (recentSessionsError) {
        console.error('Error fetching recent sessions:', recentSessionsError)
        setRecentSessions([])
        // Don't return - continue to set metrics
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
      
      setRecentSessions(formattedSessions)
    } else {
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
    if (allSessions && allSessions.length > 0 && skillStatsData) {
      // Calculate change percentages
      const overallChange = skillStatsData.overall.previous > 0 
        ? skillStatsData.overall.current - skillStatsData.overall.previous
        : 0
      const rapportChange = skillStatsData.rapport.previous > 0
        ? skillStatsData.rapport.current - skillStatsData.rapport.previous
        : 0
      const discoveryChange = skillStatsData.discovery.previous > 0
        ? skillStatsData.discovery.current - skillStatsData.discovery.previous
        : 0
      const objectionChange = skillStatsData.objection.previous > 0
        ? skillStatsData.objection.current - skillStatsData.objection.previous
        : 0
      const closingChange = skillStatsData.closing.previous > 0
        ? skillStatsData.closing.current - skillStatsData.closing.previous
        : 0
      
      setPerformanceMetrics([
        {
          id: 'overall',
          title: 'Overall Score',
          value: skillStatsData.overall.current,
          change: overallChange > 0 ? `+${overallChange}%` : `${overallChange}%`,
          feedback: 'Consistency across all areas improving. Rapport and discovery skills show promise.',
          borderColor: '#8b5cf6',
          textColor: 'text-purple-300',
          bg: '#4c1d6a',
          glowColor: 'rgba(139, 92, 246, 0.5)'
        },
        {
          id: 'rapport',
          title: 'Rapport',
          value: skillStatsData.rapport.current,
          change: rapportChange > 0 ? `+${rapportChange}%` : `${rapportChange}%`,
          feedback: 'Incorporate personalized questions within the first 30 seconds.',
          borderColor: '#10b981',
          textColor: 'text-emerald-300',
          bg: '#065f46',
          glowColor: 'rgba(16, 185, 129, 0.5)'
        },
        {
          id: 'discovery',
          title: 'Discovery',
          value: skillStatsData.discovery.current,
          change: discoveryChange > 0 ? `+${discoveryChange}%` : `${discoveryChange}%`,
          feedback: 'Dig deeper into pain points with follow-up questions.',
          borderColor: '#3b82f6',
          textColor: 'text-blue-300',
          bg: '#1e40af',
          glowColor: 'rgba(59, 130, 246, 0.5)'
        },
        {
          id: 'objection',
          title: 'Objection Handling',
          value: skillStatsData.objection.current,
          change: objectionChange > 0 ? `+${objectionChange}%` : `${objectionChange}%`,
          feedback: 'Reframe price concerns as investment discussions.',
          borderColor: '#f59e0b',
          textColor: 'text-amber-300',
          bg: '#92400e',
          glowColor: 'rgba(245, 158, 11, 0.5)'
        },
        {
          id: 'closing',
          title: 'Closing',
          value: skillStatsData.closing.current,
          change: closingChange > 0 ? `+${closingChange}%` : `${closingChange}%`,
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
      
      // Performance and earnings data calculated
      
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
  
  // Chart data ready

  // Use real notifications if available, otherwise show empty state
  const notificationsData = notifications.length > 0 ? notifications : []

  return (
    <div className="space-y-8">
      {/* Profile Header Card */}
      {userProfile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-6">
            {userProfile.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt={userProfile.full_name}
                className="w-20 h-20 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                {userProfile.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">{userProfile.full_name || 'User'}</h1>
              <p className="text-slate-400">{userProfile.email || 'No email'}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 text-sm">
                  <User className="w-4 h-4" />
                  {userProfile.role || 'rep'}
                </span>
                {userProfile.rep_id && (
                  <span className="text-sm text-slate-400">
                    Rep ID: {userProfile.rep_id}
                  </span>
                )}
                {userProfile.created_at && (
                  <span className="text-sm text-slate-400">
                    Joined {new Date(userProfile.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-8">
        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg p-5"
          style={{ 
            backgroundColor: '#2a1a3a',
            border: '2px solid #4a2a6a',
            boxShadow: 'inset 0 0 20px rgba(138, 43, 226, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-purple-200 uppercase tracking-wide">Overall Score</h3>
            <svg className="w-3 h-3 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-2 tabular-nums">{skillStats?.overall?.current ?? 0}%</div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-semibold text-green-400">
              {skillStats?.overall?.previous && skillStats.overall.previous > 0 
                ? `${(skillStats.overall.current - skillStats.overall.previous) > 0 ? '+' : ''}${skillStats.overall.current - skillStats.overall.previous}% from last week`
                : '0% from last week'
              }
            </p>
          </div>
        </motion.div>

        {/* Rapport Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-lg p-5"
          style={{ 
            backgroundColor: '#1a3a2a',
            border: '2px solid #2a6a4a',
            boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-emerald-200 uppercase tracking-wide">Rapport</h3>
            <svg className="w-3 h-3 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-2 tabular-nums">{skillStats?.rapport?.current ?? 0}%</div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-semibold text-green-400">
              {skillStats?.rapport?.previous && skillStats.rapport.previous > 0 
                ? `${(skillStats.rapport.current - skillStats.rapport.previous) > 0 ? '+' : ''}${skillStats.rapport.current - skillStats.rapport.previous}% from last week`
                : '0% from last week'
              }
            </p>
          </div>
        </motion.div>

        {/* Discovery Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg p-5"
          style={{ 
            backgroundColor: '#1a2a3a',
            border: '2px solid #2a4a6a',
            boxShadow: 'inset 0 0 20px rgba(59, 130, 246, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Discovery</h3>
            <svg className="w-3 h-3 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-2 tabular-nums">{skillStats?.discovery?.current ?? 0}%</div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-semibold text-green-400">
              {skillStats?.discovery?.previous && skillStats.discovery.previous > 0 
                ? `${(skillStats.discovery.current - skillStats.discovery.previous) > 0 ? '+' : ''}${skillStats.discovery.current - skillStats.discovery.previous}% from last week`
                : '0% from last week'
              }
            </p>
          </div>
        </motion.div>

        {/* Objection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-lg p-5"
          style={{ 
            backgroundColor: '#3a2a1a',
            border: '2px solid #6a4a2a',
            boxShadow: 'inset 0 0 20px rgba(245, 158, 11, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-amber-200 uppercase tracking-wide">Objection</h3>
            <svg className="w-3 h-3 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-2 tabular-nums">{skillStats?.objection?.current ?? 0}%</div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-semibold text-green-400">
              {skillStats?.objection?.previous && skillStats.objection.previous > 0 
                ? `${(skillStats.objection.current - skillStats.objection.previous) > 0 ? '+' : ''}${skillStats.objection.current - skillStats.objection.previous}% from last week`
                : '0% from last week'
              }
            </p>
          </div>
        </motion.div>

        {/* Closing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg p-5"
          style={{ 
            backgroundColor: '#3a1a2a',
            border: '2px solid #6a2a4a',
            boxShadow: 'inset 0 0 20px rgba(236, 72, 153, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-pink-200 uppercase tracking-wide">Closing</h3>
            <svg className="w-3 h-3 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-2 tabular-nums">{skillStats?.closing?.current ?? 0}%</div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-semibold text-green-400">
              {skillStats?.closing?.previous && skillStats.closing.previous > 0 
                ? `${(skillStats.closing.current - skillStats.closing.previous) > 0 ? '+' : ''}${skillStats.closing.current - skillStats.closing.previous}% from last week`
                : '0% from last week'
              }
            </p>
          </div>
        </motion.div>
      </div>

      {/* Stats Cards */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
          >
            <DollarSign className="w-8 h-8 text-green-400 mb-3" />
            <p className="text-2xl font-bold text-white">${(summaryStats.totalEarnings || 0).toFixed(2)}</p>
            <p className="text-sm text-slate-400">Total Earnings</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
          >
            <Target className="w-8 h-8 text-purple-400 mb-3" />
            <div className="flex items-center justify-center mb-2">
              <CircularProgress 
                percentage={summaryStats.averageScore || 0}
                size={70}
                strokeWidth={6}
              />
            </div>
            <p className="text-sm text-slate-400">Average Score</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
          >
            <Award className="w-8 h-8 text-yellow-400 mb-3" />
            <div className="flex items-center justify-center mb-2">
              <CircularProgress 
                percentage={summaryStats.bestScore || 0}
                size={70}
                strokeWidth={6}
              />
            </div>
            <p className="text-sm text-slate-400">Best Score</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
          >
            <Calendar className="w-8 h-8 text-blue-400 mb-3" />
            <p className="text-2xl font-bold text-white">{summaryStats.totalSessions || 0}</p>
            <p className="text-sm text-slate-400">Total Sessions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
          >
            <Target className="w-8 h-8 text-emerald-400 mb-3" />
            <div className="flex items-center justify-center mb-2">
              <CircularProgress 
                percentage={summaryStats.closePercentage || 0}
                size={70}
                strokeWidth={6}
              />
            </div>
            <p className="text-sm text-slate-400">Close %</p>
          </motion.div>
        </div>
      )}

      {/* Performance Charts - Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Recent Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Recent Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="session" 
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 11 }}
              />
              <YAxis 
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1e1e30',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#a855f7" 
                strokeWidth={2}
                dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Earnings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Earnings</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={earningsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="session" 
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 11 }}
              />
              <YAxis 
                stroke="#6B7280"
                tick={{ fill: '#6B7280', fontSize: 11 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1e1e30',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'white'
                }}
                formatter={(value: any) => `$${value.toFixed(2)}`}
              />
              <Line 
                type="monotone" 
                dataKey="earnings" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Old Charts Grid - Remove this entire section */}
      <div className="hidden">
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

      {/* Recent Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Sessions</h2>
          <div className="text-xs text-slate-400 px-3 py-1 bg-slate-700/50 rounded-lg">
            {allSessionsForList.length} total sessions
          </div>
        </div>
        
        {allSessionsForList.length > 0 ? (
          <div className="space-y-2 lg:space-y-3">
            {allSessionsForList.slice(0, 10).map((session: any) => {
              const insights = getKeyInsights(session)
              
              return (
                <div
                  key={session.id}
                  className="bg-card/60 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-3 lg:p-3.5 xl:p-4 border border-border/20 dark:border-slate-700 hover:border-border/40 dark:hover:border-slate-600 transition-colors shadow-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1 flex items-start gap-2 lg:gap-3 min-w-0">
                      {/* Agent Avatar with Gradient Rings */}
                      <div 
                        className="relative flex-shrink-0"
                        style={{ width: `${circleSize}px`, height: `${circleSize}px`, minWidth: `${circleSize}px` }}
                      >
                        {(() => {
                          const colorVariant = getAgentColorVariant(session.agent_name)
                          const variantStyles = COLOR_VARIANTS[colorVariant]
                          return (
                            <>
                              {/* Animated gradient rings */}
                              {[0, 1, 2].map((i) => (
                                <div
                                  key={i}
                                  className={`absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent ${variantStyles.border[i]} ${variantStyles.gradient}`}
                                  style={{
                                    animation: `spin 8s linear infinite`,
                                    opacity: 0.6 - (i * 0.15)
                                  }}
                                >
                                  <div
                                    className={`absolute inset-0 rounded-full mix-blend-screen bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace('from-', '')}/20%,transparent_70%)]`}
                                  />
                                </div>
                              ))}
                              {/* Profile Image */}
                              <div className="absolute inset-[2px] rounded-full overflow-hidden">
                                <Image
                                  src={getAgentImage(session.agent_name)}
                                  alt={session.agent_name || 'Agent'}
                                  fill
                                  className="object-cover"
                                  style={getAgentImageStyle(session.agent_name)}
                                  sizes={`${circleSize}px`}
                                  loading="lazy"
                                />
                              </div>
                            </>
                          )
                        })()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground dark:text-white mb-1 lg:mb-1.5 truncate font-space">
                          {session.agent_name || 'Training Session'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4 text-sm sm:text-base text-foreground/60 dark:text-slate-400 font-sans">
                          <span className="flex items-center flex-shrink-0">
                            <Calendar className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1 flex-shrink-0" />
                            <span className="whitespace-nowrap">{format(new Date(session.created_at), 'MMM d, yyyy')}</span>
                          </span>
                          <span className="flex items-center flex-shrink-0">
                            <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1 flex-shrink-0" />
                            <span className="whitespace-nowrap">{session.duration_seconds ? `${Math.round(session.duration_seconds / 60)} min` : 'N/A'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-0 flex items-center gap-2 sm:gap-3 lg:gap-3.5 xl:gap-4 flex-shrink-0">
                      {/* Earnings - Always Show */}
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-foreground/60 dark:text-slate-400 mb-0.5 lg:mb-1 font-space">Earned</p>
                        <p className={`text-xl sm:text-2xl lg:text-3xl font-bold font-space ${
                          session.virtual_earnings && session.virtual_earnings > 0 
                            ? 'text-emerald-500 dark:text-emerald-400' 
                            : 'text-foreground/50 dark:text-slate-500'
                        }`}>
                          ${session.virtual_earnings ? session.virtual_earnings.toFixed(2) : '0.00'}
                        </p>
                      </div>
                      
                      {/* Overall Score - Responsive Circular Progress */}
                      <div className="text-right">
                        <CircularProgress 
                          percentage={session.overall_score || 0}
                          size={circleSize}
                          strokeWidth={6}
                        />
                      </div>
                      
                      <Link
                        href={`/analytics/${session.id}`}
                        className="inline-flex items-center px-2.5 lg:px-3 py-1.5 lg:py-1.5 text-sm sm:text-base bg-gradient-to-r from-purple-600/20 to-indigo-600/20 text-purple-500 dark:text-purple-300 rounded-lg hover:from-purple-600/30 hover:to-indigo-600/30 transition-all border border-purple-500/20 font-space font-semibold"
                      >
                        View Details
                        <ChevronRight className="ml-1 lg:ml-1 w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </Link>
                    </div>
                  </div>
                  
                  {/* Key Insights - Larger and more readable */}
                  {insights.length > 0 && (
                    <div className="pt-2.5 lg:pt-3 mt-2.5 lg:mt-3 border-t border-border/20 dark:border-slate-700/50">
                      <div className="space-y-0.5 lg:space-y-1">
                        {insights.map((insight, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start space-x-2 lg:space-x-2.5 text-base sm:text-lg font-semibold font-space ${
                              insight.type === 'success' ? 'text-green-500 dark:text-green-400' : 'text-amber-500 dark:text-yellow-400'
                            }`}
                          >
                            <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5 flex-shrink-0" />
                            <span className="leading-snug">{insight.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No sessions yet</p>
            <p className="text-xs text-slate-500 mt-1">Complete training sessions to see them here</p>
          </div>
        )}
      </motion.div>
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

