'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Database, MessageSquare, BarChart3, Settings, Home, UserCog, BookOpen } from 'lucide-react'
import TeamOverview from '@/components/manager/TeamOverview'
import RepManagement from '@/components/manager/RepManagement'
import KnowledgeBase from '@/components/manager/KnowledgeBase'
import MessagingCenter from '@/components/manager/MessagingCenter'
import AnalyticsDashboard from '@/components/manager/AnalyticsDashboard'
import ManagerSettings from '@/components/manager/ManagerSettings'

type Tab = 'overview' | 'reps' | 'knowledge' | 'messages' | 'analytics' | 'settings'

const tabs = [
  { id: 'overview' as Tab, name: 'Team Overview', icon: Home },
  { id: 'reps' as Tab, name: 'Rep Management', icon: UserCog },
  { id: 'knowledge' as Tab, name: 'Knowledge Base', icon: Database },
  { id: 'messages' as Tab, name: 'Messages', icon: MessageSquare },
  { id: 'analytics' as Tab, name: 'Analytics', icon: BarChart3 },
  { id: 'settings' as Tab, name: 'Settings', icon: Settings },
]

function ManagerPageContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  // Set the active tab from URL parameter if provided
  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab | null
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TeamOverview />
      case 'reps':
        return <RepManagement />
      case 'knowledge':
        return <KnowledgeBase />
      case 'messages':
        return <MessagingCenter />
      case 'analytics':
        return <AnalyticsDashboard />
      case 'settings':
        return <ManagerSettings />
      default:
        return <TeamOverview />
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header Section matching dashboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left: Title & Description */}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Manager Panel
              </h1>
              <p className="text-white/70">
                Oversee your team performance, manage reps, and track analytics
              </p>
            </div>

            {/* Right: Quick Stats (matching dashboard style) */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4"
                style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-white/60">Active Reps</p>
                    <p className="text-[26px] font-bold text-white leading-tight">24</p>
                  </div>
                  <div 
                    className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 ml-2"
                    style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)' }}
                  >
                    <Users className="w-[18px] h-[18px]" style={{ color: '#a855f7' }} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4"
                style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-white/60">Messages</p>
                    <p className="text-[26px] font-bold text-white leading-tight">3</p>
                  </div>
                  <div 
                    className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 ml-2"
                    style={{ backgroundColor: 'rgba(236, 72, 153, 0.2)' }}
                  >
                    <MessageSquare className="w-[18px] h-[18px]" style={{ color: '#ec4899' }} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4"
                style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-white/60">Avg Score</p>
                    <p className="text-[26px] font-bold text-white leading-tight">78%</p>
                  </div>
                  <div 
                    className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 ml-2"
                    style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
                  >
                    <BarChart3 className="w-[18px] h-[18px]" style={{ color: '#10b981' }} />
                  </div>
                </div>
              </motion.div>
            </div>
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
                  className={`relative flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
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
