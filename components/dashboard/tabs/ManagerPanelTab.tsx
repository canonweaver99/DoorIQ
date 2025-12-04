'use client'

import { useState, useEffect, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, BarChart3, UserCog, Video } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { IOSSegmentedControl } from '@/components/ui/ios-segmented-control'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useHaptic } from '@/hooks/useHaptic'

// Lazy load tab components for better performance
const RepManagement = lazy(() => import('@/components/manager/RepManagement'))
const KnowledgeBase = lazy(() => import('@/components/manager/KnowledgeBase'))
const AnalyticsDashboard = lazy(() => import('@/components/manager/AnalyticsDashboard'))
const TrainingVideos = lazy(() => import('@/components/manager/TrainingVideos'))

type Tab = 'reps' | 'knowledge' | 'analytics' | 'videos'

const tabs = [
  { id: 'analytics' as Tab, name: 'Analytics', icon: BarChart3 },
  { id: 'reps' as Tab, name: 'Rep Management', icon: UserCog },
  { id: 'knowledge' as Tab, name: 'Knowledge Base', icon: Database },
  { id: 'videos' as Tab, name: 'Training Videos', icon: Video },
]

export default function ManagerPanelTab() {
  const isMobile = useIsMobile()
  const { trigger } = useHaptic()
  const [timePeriod, setTimePeriod] = useState('30')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('analytics')

  const handleTabClick = (tabId: Tab) => {
    trigger('selection')
    setActiveTab(tabId)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsRefreshing(false)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reps':
        return <RepManagement />
      case 'knowledge':
        return <KnowledgeBase />
      case 'analytics':
        return <AnalyticsDashboard timePeriod={timePeriod} />
      case 'videos':
        return <TrainingVideos />
      default:
        return <AnalyticsDashboard timePeriod={timePeriod} />
    }
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <h2 className="font-bold text-white mb-2 font-space text-2xl md:text-3xl">
          Manager Panel
        </h2>
        <p className="text-white/70 font-sans text-sm md:text-base">
          Oversee your team performance, manage reps, and track analytics
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div className={`mb-6 ${isMobile ? '' : 'border-b border-[#2a2a2a] pb-2'}`}>
        {isMobile ? (
          <div className="space-y-4">
            <IOSSegmentedControl
              options={tabs.map(tab => ({
                value: tab.id,
                label: tab.name,
                icon: <tab.icon className="w-4 h-4" />
              }))}
              value={activeTab}
              onChange={(value) => handleTabClick(value as Tab)}
              size="md"
            />
            
            {/* Time Period Selector for Analytics */}
            {activeTab === 'analytics' && (
              <div className="flex justify-center">
                <select 
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/40 backdrop-blur-xl font-space appearance-none cursor-pointer min-h-[44px]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='white' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="180">Last 6 Months</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab, index) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <motion.button
                    key={tab.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => handleTabClick(tab.id)}
                    className={`relative flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 font-space ${
                      isActive
                        ? 'text-white bg-[#1a1a1a]'
                        : 'text-[#888888] hover:text-[#bbbbbb]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                    
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
            
            {/* Time Period Selector - only show for Analytics tab */}
            {activeTab === 'analytics' && (
              <div className="flex items-center">
                <select 
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  className="px-5 py-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/20 backdrop-blur-sm font-space"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="180">Last 6 Months</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Content */}
      <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center py-24">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            }>
              {renderTabContent()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </PullToRefresh>
    </div>
  )
}
