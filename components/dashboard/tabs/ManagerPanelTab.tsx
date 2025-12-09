'use client'

import { useState, Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useIsMobile } from '@/hooks/useIsMobile'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'

// Lazy load analytics component for better performance
const AnalyticsDashboard = lazy(() => import('@/components/manager/AnalyticsDashboard'))

export default function ManagerPanelTab() {
  const isMobile = useIsMobile()
  const [timePeriod, setTimePeriod] = useState('30')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setIsRefreshing(false)
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

      {/* Time Period Selector */}
      <div className="mb-6 flex items-center justify-end">
        <select 
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          className={`px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/40 backdrop-blur-xl font-space appearance-none cursor-pointer ${
            isMobile ? 'min-h-[44px] w-full' : 'px-5 py-3 bg-black/50'
          }`}
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

      {/* Analytics Content */}
      <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Suspense fallback={
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
          }>
            <AnalyticsDashboard timePeriod={timePeriod} />
          </Suspense>
        </motion.div>
      </PullToRefresh>
    </div>
  )
}
