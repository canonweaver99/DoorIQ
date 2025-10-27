'use client'

import { motion } from 'framer-motion'
import { LucideIcon, Lock } from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon: LucideIcon
  locked?: boolean
  isPremium?: boolean
}

interface TabNavigationProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  demoMode?: boolean
}

export default function TabNavigation({ tabs, activeTab, onChange, demoMode = false }: TabNavigationProps) {
  return (
    <div className="sticky top-0 z-20 bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-white/10 mb-8">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon

          return (
            <motion.button
              key={tab.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => !tab.locked && !demoMode && onChange(tab.id)}
              disabled={tab.locked || demoMode}
              className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                tab.locked
                  ? 'text-slate-600 cursor-not-allowed opacity-60'
                  : demoMode
                  ? (isActive ? 'text-white cursor-default' : 'text-slate-400 cursor-default')
                  : isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={tab.locked ? 'Upgrade to unlock this feature' : demoMode ? 'Demo mode - tabs for display only' : undefined}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${tab.locked ? 'text-slate-600' : isActive ? 'text-purple-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.locked && <Lock className="w-3 h-3 text-amber-500" />}
              
              {/* Active indicator */}
              {isActive && (
                <>
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-t-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                  <motion.div
                    layoutId="activeTabBorder"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                </>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

