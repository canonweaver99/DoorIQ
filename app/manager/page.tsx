'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, BookOpen, Database, MessageSquare, BarChart3, Settings, Home, UserCog } from 'lucide-react'
import TeamOverview from '@/components/manager/TeamOverview'
import RepManagement from '@/components/manager/RepManagement'
import TrainingHub from '@/components/manager/TrainingHub'
import KnowledgeBase from '@/components/manager/KnowledgeBase'
import MessagingCenter from '@/components/manager/MessagingCenter'
import AnalyticsDashboard from '@/components/manager/AnalyticsDashboard'
import ManagerSettings from '@/components/manager/ManagerSettings'

type Tab = 'overview' | 'reps' | 'training' | 'knowledge' | 'messages' | 'analytics' | 'settings'

const tabs = [
  { id: 'overview' as Tab, name: 'Team Overview', icon: Home },
  { id: 'reps' as Tab, name: 'Rep Management', icon: UserCog },
  { id: 'training' as Tab, name: 'Training Hub', icon: BookOpen },
  { id: 'knowledge' as Tab, name: 'Knowledge Base', icon: Database },
  { id: 'messages' as Tab, name: 'Messages', icon: MessageSquare },
  { id: 'analytics' as Tab, name: 'Analytics', icon: BarChart3 },
  { id: 'settings' as Tab, name: 'Settings', icon: Settings },
]

export default function ManagerPage() {
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
      case 'training':
        return <TrainingHub />
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e]">
      {/* Header with Role Badge */}
      <div className="border-b border-white/10 bg-[#1e1e30]/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/30">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Manager Panel</h1>
                  <p className="text-xs text-slate-400">Team Performance & Management</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                <span className="text-xs font-medium text-purple-300">Manager Mode</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 rounded-xl text-sm font-medium text-white transition-all">
                <MessageSquare className="w-4 h-4" />
                Send Message
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-purple-600/30">
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Assign Training</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-white/10 bg-[#1e1e30]/30 backdrop-blur-xl sticky top-[73px] z-40">
        <div className="max-w-[1800px] mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
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
