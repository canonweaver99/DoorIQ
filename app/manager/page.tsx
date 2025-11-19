'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Database, BarChart3, Settings, UserCog, BookOpen } from 'lucide-react'
import RepManagement from '@/components/manager/RepManagement'
import KnowledgeBase from '@/components/manager/KnowledgeBase'
import AnalyticsDashboard from '@/components/manager/AnalyticsDashboard'
import ManagerSettings from '@/components/manager/ManagerSettings'

type Tab = 'reps' | 'knowledge' | 'analytics' | 'settings'

const tabs = [
  { id: 'analytics' as Tab, name: 'Analytics', icon: BarChart3 },
  { id: 'reps' as Tab, name: 'Rep Management', icon: UserCog },
  { id: 'knowledge' as Tab, name: 'Knowledge Base', icon: Database },
  { id: 'settings' as Tab, name: 'Settings', icon: Settings },
]

function ManagerPageContent() {
  const searchParams = useSearchParams()
  
  // Initialize activeTab from URL parameter using lazy initializer to match server render
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tabParam = searchParams.get('tab') as Tab | null
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      return tabParam
    }
    return 'analytics'
  })

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab | null
    if (tabParam && tabs.some(tab => tab.id === tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [searchParams, activeTab])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reps':
        return <RepManagement />
      case 'knowledge':
        return <KnowledgeBase />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'settings':
        return <ManagerSettings />
      default:
        return <AnalyticsDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4 sm:px-6 lg:px-8 pt-32">
      <div className="max-w-[1800px] mx-auto">
        {/* Header Section matching dashboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          {/* Title & Description */}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 font-space">
              Manager Panel
            </h1>
            <p className="text-white/70 font-sans">
              Oversee your team performance, manage reps, and track analytics
            </p>
          </div>
        </motion.div>

        {/* Tab Navigation matching dashboard style */}
        <div className="mb-8 border-b border-[#2a2a2a]">
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
                  onClick={() => setActiveTab(tab.id)}
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
        </div>

        {/* Tab Content with smooth transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function ManagerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    }>
      <ManagerPageContent />
    </Suspense>
  )
}
