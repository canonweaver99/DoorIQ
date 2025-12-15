'use client'

import { useState, useEffect, Suspense, lazy } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Users, Settings, LayoutDashboard, ChevronDown, X, UserCog, Database } from 'lucide-react'

// Lazy load all dashboard components for better code splitting
const HeroPerformanceCard = lazy(() => import('@/components/dashboard/HeroPerformanceCard'))
const PerformanceMetricCards = lazy(() => import('@/components/dashboard/PerformanceMetricCards'))
const CriticalAlertsSection = lazy(() => import('@/components/dashboard/CriticalAlertsSection'))
const Last20SessionsBreakdown = lazy(() => import('@/components/dashboard/Last20SessionsBreakdown'))
const RecentSessionsPreview = lazy(() => import('@/components/dashboard/RecentSessionsPreview'))
const RecommendedActions = lazy(() => import('@/components/dashboard/RecommendedActions'))
const TabNavigation = lazy(() => import('@/components/dashboard/TabNavigation'))
const UploadTab = lazy(() => import('@/components/dashboard/tabs/UploadTab'))
const TeamTab = lazy(() => import('@/components/dashboard/tabs/TeamTab'))
const ManagerPanelTab = lazy(() => import('@/components/dashboard/tabs/ManagerPanelTab'))

// Lazy load manager components
const KnowledgeBase = lazy(() => import('@/components/manager/KnowledgeBase'))
import type { DashboardData } from '@/app/dashboard/types'
import { useIsMobile, useReducedMotion } from '@/hooks/useIsMobile'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

function DashboardPageContent() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const prefersReducedMotion = useReducedMotion()
  const [activeTab, setActiveTab] = useState('overview')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isManager, setIsManager] = useState<boolean | null>(null)
  const [loadingRole, setLoadingRole] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    userName: '',
    currentDateTime: new Date().toISOString(),
    session: null,
    loading: true,
    error: null
  })

  // Skip animations on mobile or if user prefers reduced motion
  const shouldAnimate = !isMobile && !prefersReducedMotion

  useEffect(() => {
    fetchDashboardData()
    checkUserRole()
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setDashboardData(prev => ({
        ...prev,
        currentDateTime: new Date().toISOString()
      }))
    }, 60000)

    return () => clearInterval(timeInterval)
  }, [])

  const checkUserRole = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoadingRole(false)
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData) {
        setIsManager(userData.role === 'manager' || userData.role === 'admin')
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    } finally {
      setLoadingRole(false)
    }
  }
  
  const fetchDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }))
      
      const response = await fetch('/api/dashboard/data')
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

        const data = await response.json()
      
      setDashboardData({
        userName: data.userName || 'User',
        currentDateTime: data.currentDateTime || new Date().toISOString(),
        session: data.session,
        loading: false,
        error: null
      })
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load dashboard data'
      }))
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Pitch', icon: Upload },
    { id: 'team', label: 'Team', icon: Users },
    ...(isManager ? [
      { id: 'manager', label: 'Manager Panel', icon: UserCog },
      { id: 'knowledge', label: 'Manager Tools', icon: Database },
    ] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  const handleTabChange = (tabId: string) => {
    setIsDropdownOpen(false)
    if (tabId === 'settings') {
      router.push('/settings')
    } else {
      setActiveTab(tabId)
    }
  }

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white relative">
        {/* Mobile Loading Skeleton */}
        <div className="md:hidden relative z-10 pt-6 pb-24 px-4">
          <div className="max-w-full mx-auto space-y-4">
            <div className="text-center animate-pulse">
              <div className="h-6 bg-white/10 rounded w-32 mx-auto mb-2" />
              <div className="h-4 bg-white/10 rounded w-48 mx-auto" />
            </div>
            <div className="bg-white/5 rounded-3xl p-5 animate-pulse">
              <div className="h-5 bg-white/10 rounded w-1/2 mb-3" />
              <div className="h-20 bg-white/10 rounded w-full mb-3" />
              <div className="h-4 bg-white/10 rounded w-1/3" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 rounded-3xl p-5 animate-pulse">
                <div className="h-5 bg-white/10 rounded w-1/2 mb-3" />
                <div className="h-16 bg-white/10 rounded w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Loading Skeleton */}
        <div className="hidden md:block relative z-10 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-12 sm:pb-14 md:pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-6 md:space-y-8 mt-12">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 md:p-10 animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-1/3 mb-4" />
                <div className="h-4 bg-gray-700 rounded w-1/4 mb-8" />
                <div className="h-16 bg-gray-700 rounded w-1/2 mb-6" />
                <div className="h-10 bg-gray-700 rounded w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-800 border border-gray-700 rounded-xl p-6 animate-pulse"
                  >
                    <div className="h-6 bg-gray-700 rounded w-1/2 mb-4" />
                    <div className="h-12 bg-gray-700 rounded w-3/4 mb-4" />
                    <div className="h-6 bg-gray-700 rounded w-1/3" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (dashboardData.error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-4 text-sm md:text-base">{dashboardData.error}</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchDashboardData}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-xl transition-all min-h-[44px]"
          >
            Retry
          </motion.button>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative">
      {/* Mobile Layout */}
      <div className="md:hidden relative z-10 pt-6 pb-24 px-4">
        <div className="max-w-full mx-auto">
          {/* Mobile Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 text-center"
          >
            <h1 className="font-space text-2xl tracking-tight text-white font-bold leading-tight mb-1">
              Dashboard
            </h1>
            <p className="text-sm text-white/70 font-space">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">{dashboardData.userName}</span>
            </p>
          </motion.div>

          {/* Mobile Tab Dropdown */}
          <div className="relative mb-6">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] border border-white/10 rounded-3xl shadow-xl backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                {activeTabData && (
                  <>
                    <activeTabData.icon className="w-5 h-5 text-purple-400" />
                    <span className="font-space text-white font-medium">{activeTabData.label}</span>
                  </>
                )}
              </div>
              <ChevronDown className={cn(
                "w-5 h-5 text-white/60 transition-transform duration-200",
                isDropdownOpen && "rotate-180"
              )} />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsDropdownOpen(false)}
                    className="fixed inset-0 bg-black/60 z-40"
                  />
                  
                  {/* Dropdown */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white/[0.05] border border-white/10 rounded-3xl shadow-xl backdrop-blur-xl overflow-hidden z-50"
                  >
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 transition-colors",
                            isActive
                              ? "bg-purple-600/20 text-purple-400"
                              : "text-white/80 hover:bg-white/5"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-space font-medium">{tab.label}</span>
                        </button>
                      )
                    })}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Tab Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Last 20 Sessions Breakdown */}
                <div className="bg-white/[0.03] rounded-3xl p-5 shadow-xl border border-white/10 backdrop-blur-sm">
                  <Suspense fallback={<div className="h-96 bg-white/[0.02] rounded-lg animate-pulse" />}>
                    <Last20SessionsBreakdown />
                  </Suspense>
                </div>

                {/* Hero Performance Card - Prominent */}
                <div className="bg-white/[0.03] rounded-3xl p-5 shadow-xl border border-white/10 backdrop-blur-sm">
                  <Suspense fallback={<div className="h-64 bg-white/[0.02] rounded-lg animate-pulse" />}>
                    <HeroPerformanceCard
                      userName={dashboardData.userName}
                      currentDateTime={dashboardData.currentDateTime}
                      session={dashboardData.session}
                    />
                  </Suspense>
                </div>

                {/* Critical Alerts */}
                <div className="bg-white/[0.03] rounded-3xl p-5 shadow-xl border border-white/10 backdrop-blur-sm">
                  <Suspense fallback={<div className="h-32 bg-white/[0.02] rounded-lg animate-pulse" />}>
                    <CriticalAlertsSection session={dashboardData.session} />
                  </Suspense>
                </div>

                {/* Performance Metrics */}
                <div className="bg-white/[0.03] rounded-3xl p-5 shadow-xl border border-white/10 backdrop-blur-sm">
                  <Suspense fallback={<div className="h-48 bg-white/[0.02] rounded-lg animate-pulse" />}>
                    <PerformanceMetricCards session={dashboardData.session} />
                  </Suspense>
                </div>

                {/* Recent Sessions */}
                <div className="bg-white/[0.03] rounded-3xl p-5 shadow-xl border border-white/10 backdrop-blur-sm">
                  <Suspense fallback={<div className="h-96 bg-white/[0.02] rounded-lg animate-pulse" />}>
                    <RecentSessionsPreview />
                  </Suspense>
                </div>

                {/* Recommended Actions */}
                <div className="bg-white/[0.03] rounded-3xl p-5 shadow-xl border border-white/10 backdrop-blur-sm">
                  <Suspense fallback={<div className="h-48 bg-white/[0.02] rounded-lg animate-pulse" />}>
                    <RecommendedActions session={dashboardData.session} />
                  </Suspense>
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="bg-white/[0.03] rounded-3xl p-5 shadow-xl border border-white/10 backdrop-blur-sm">
                <Suspense fallback={<div className="h-96 bg-white/[0.02] rounded-lg animate-pulse" />}>
                  <UploadTab />
                </Suspense>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="bg-white/[0.03] rounded-3xl p-5 shadow-xl border border-white/10 backdrop-blur-sm">
                <Suspense fallback={<div className="h-96 bg-white/[0.02] rounded-lg animate-pulse" />}>
                  <TeamTab
                    leaderboard={[]}
                    userRank={1}
                    teamStats={{
                      teamSize: 1,
                      avgTeamScore: 0,
                      yourScore: 0
                    }}
                  />
                </Suspense>
              </div>
            )}

            {activeTab === 'manager' && isManager && (
              <div className="bg-white/[0.03] rounded-3xl p-5 shadow-xl border border-white/10 backdrop-blur-sm">
                <Suspense fallback={<div className="h-96 bg-white/[0.02] rounded-lg animate-pulse" />}>
                  <ManagerPanelTab />
                </Suspense>
              </div>
            )}

            {activeTab === 'knowledge' && isManager && (
              <div className="bg-white/[0.03] rounded-3xl p-5 shadow-xl border border-white/10 backdrop-blur-sm">
                <Suspense fallback={
                  <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                  </div>
                }>
                  <KnowledgeBase />
                </Suspense>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block relative z-10 pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: -20 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
            transition={shouldAnimate ? { duration: 0.6 } : {}}
            className="mb-3 text-center"
          >
            <h1 className="font-space text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight text-white font-bold leading-[1.1] uppercase mb-1">
              Dashboard
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-300 drop-shadow-md font-space">
              Welcome back,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                {dashboardData.userName}
              </span>
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <Suspense fallback={<div className="h-16 bg-white/[0.02] border border-white/10 rounded-lg animate-pulse" />}>
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              onChange={(tabId) => {
                if (tabId === 'settings') {
                  router.push('/settings')
                } else {
                  setActiveTab(tabId)
                }
              }}
            />
          </Suspense>

          {/* Tab Content */}
          <motion.div
            initial={shouldAnimate ? { opacity: 0 } : false}
            animate={shouldAnimate ? { opacity: 1 } : false}
            transition={shouldAnimate ? { duration: 0.5, delay: 0.2 } : {}}
            className="mt-6 sm:mt-8"
          >
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                {/* 1. Last 20 Sessions Breakdown */}
                <Suspense fallback={<div className="h-96 bg-white/[0.02] border border-white/10 rounded-lg animate-pulse" />}>
                  <Last20SessionsBreakdown />
                </Suspense>

                {/* 2. Hero Performance Card (improved) */}
                <Suspense fallback={<div className="h-64 bg-white/[0.02] border border-white/10 rounded-lg animate-pulse" />}>
                  <HeroPerformanceCard
                    userName={dashboardData.userName}
                    currentDateTime={dashboardData.currentDateTime}
                    session={dashboardData.session}
                  />
                </Suspense>

                {/* 3. Critical Alerts Section (NEW) */}
                <Suspense fallback={<div className="h-32 bg-white/[0.02] border border-white/10 rounded-lg animate-pulse" />}>
                  <CriticalAlertsSection session={dashboardData.session} />
                </Suspense>

                {/* 4. Performance Metric Cards (enhanced) */}
                <Suspense fallback={<div className="h-48 bg-white/[0.02] border border-white/10 rounded-lg animate-pulse" />}>
                  <PerformanceMetricCards session={dashboardData.session} />
                </Suspense>

                {/* 5. Recent Sessions Preview (NEW) */}
                <Suspense fallback={<div className="h-96 bg-white/[0.02] border border-white/10 rounded-lg animate-pulse" />}>
                  <RecentSessionsPreview />
                </Suspense>

                {/* 6. Recommended Next Actions (NEW) */}
                <Suspense fallback={<div className="h-48 bg-white/[0.02] border border-white/10 rounded-lg animate-pulse" />}>
                  <RecommendedActions session={dashboardData.session} />
                </Suspense>
              </div>
            )}

            {activeTab === 'upload' && (
              <Suspense fallback={<div className="h-96 bg-white/[0.02] border border-white/10 rounded-lg animate-pulse" />}>
                <UploadTab />
              </Suspense>
            )}

            {activeTab === 'team' && (
              <Suspense fallback={<div className="h-96 bg-white/[0.02] border border-white/10 rounded-lg animate-pulse" />}>
                <TeamTab
                  leaderboard={[]}
                  userRank={1}
                  teamStats={{
                    teamSize: 1,
                    avgTeamScore: 0,
                    yourScore: 0
                  }}
                />
              </Suspense>
            )}

            {activeTab === 'manager' && isManager && (
              <Suspense fallback={<div className="h-96 bg-white/[0.02] border border-white/10 rounded-lg animate-pulse" />}>
                <ManagerPanelTab />
              </Suspense>
            )}

            {activeTab === 'knowledge' && isManager && (
              <Suspense fallback={
                <div className="flex items-center justify-center py-24">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              }>
                <KnowledgeBase />
              </Suspense>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Main Dashboard Component with Suspense
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-white/80">Loading...</div>
        </div>
    }>
      <DashboardPageContent />
    </Suspense>
  )
}
