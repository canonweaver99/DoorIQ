'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, Users, Settings, LayoutDashboard } from 'lucide-react'
import HeroPerformanceCard from '@/components/dashboard/HeroPerformanceCard'
import PerformanceMetricCards from '@/components/dashboard/PerformanceMetricCards'
import CriticalAlertsSection from '@/components/dashboard/CriticalAlertsSection'
import RecentSessionsPreview from '@/components/dashboard/RecentSessionsPreview'
import RecommendedActions from '@/components/dashboard/RecommendedActions'
import TabNavigation from '@/components/dashboard/TabNavigation'
import UploadTab from '@/components/dashboard/tabs/UploadTab'
import TeamTab from '@/components/dashboard/tabs/TeamTab'
import type { DashboardData } from '@/app/dashboard/types'

function DashboardPageContent() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    userName: '',
    currentDateTime: new Date().toISOString(),
    session: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    fetchDashboardData()
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setDashboardData(prev => ({
        ...prev,
        currentDateTime: new Date().toISOString()
      }))
    }, 60000)

    return () => clearInterval(timeInterval)
  }, [])
  
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

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white relative">
        <div className="relative z-10 pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Loading skeleton */}
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
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{dashboardData.error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Pitch', icon: Upload },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative">
      <div className="relative z-10 pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-3 text-center"
          >
            <h1 className="font-space text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white font-bold leading-[1.1] uppercase mb-1">
              Dashboard
            </h1>
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-300 drop-shadow-md font-space">
              Welcome back,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                {dashboardData.userName}
              </span>
            </p>
          </motion.div>

          {/* Tab Navigation */}
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

          {/* Tab Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8"
          >
            {activeTab === 'overview' && (
              <div className="space-y-6 md:space-y-8">
                {/* 1. Hero Performance Card (improved) */}
                <HeroPerformanceCard
                  userName={dashboardData.userName}
                  currentDateTime={dashboardData.currentDateTime}
                  session={dashboardData.session}
                />

                {/* 2. Critical Alerts Section (NEW) */}
                <CriticalAlertsSection session={dashboardData.session} />

                {/* 3. Performance Metric Cards (enhanced) */}
                <PerformanceMetricCards session={dashboardData.session} />

                {/* 4. Recent Sessions Preview (NEW) */}
                <RecentSessionsPreview />

                {/* 5. Recommended Next Actions (NEW) */}
                <RecommendedActions session={dashboardData.session} />
              </div>
            )}

            {activeTab === 'upload' && <UploadTab />}

            {activeTab === 'team' && (
              <TeamTab
                leaderboard={[]}
                userRank={1}
                teamStats={{
                  teamSize: 1,
                  avgTeamScore: 0,
                  yourScore: 0
                }}
              />
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
