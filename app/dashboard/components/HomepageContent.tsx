'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import HeroQuickStart from './HeroQuickStart'
import PerformanceDashboard from './PerformanceDashboard'
import PracticeHistoryFeed from './PracticeHistoryFeed'
import QuickActionsToolbar from './QuickActionsToolbar'
import OnboardingElements from './OnboardingElements'
import NextMilestone from '@/components/dashboard/NextMilestone'
import PerformanceSnapshot from '@/components/dashboard/PerformanceSnapshot'

interface HomepageStats {
  overallScore: number
  metrics: {
    closeRate: number
    avgDurationSeconds: number
    toneScore: number
  }
  lastSession: {
    agentName: string
    score: number
    startedAt: string
    durationSeconds: number | null
  } | null
  weeklyData: Array<{ date: string; score: number }>
  skillBreakdown: {
    opening: number
    objectionHandling: number
    closing: number
    tonality: number
    pace: number
  }
  trend: number
  totalSessions: number
}

export default function HomepageContent() {
  const [stats, setStats] = useState<HomepageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHomepageData()
  }, [])

  const fetchHomepageData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/homepage/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch homepage data')
      }

      const data = await response.json()
      setStats(data)
    } catch (err: any) {
      console.error('Error fetching homepage data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
            <div className="h-4 bg-white/10 rounded w-full mb-2" />
            <div className="h-4 bg-white/10 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 text-center">
        <p className="text-white/80 mb-2">Error loading homepage data</p>
        <button
          onClick={fetchHomepageData}
          className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 rounded-md text-white text-sm transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const hasCompletedSessions = stats.totalSessions > 0
  const isEmpty = stats.overallScore === 0 && stats.metrics.closeRate === 0 && stats.metrics.avgDurationSeconds === 0

  return (
    <div className="space-y-6">
      {/* Onboarding Elements */}
      <OnboardingElements totalSessions={stats.totalSessions} />

      {/* Hero/Quick Start Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <HeroQuickStart lastSession={stats.lastSession} />
      </motion.section>

      {/* Performance Snapshot (shown after first session) */}
      {hasCompletedSessions && !isEmpty && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <PerformanceSnapshot
            overallScore={stats.overallScore}
            avgDurationSeconds={stats.metrics.avgDurationSeconds}
            toneScore={stats.metrics.toneScore}
            trend={{
              score: stats.trend,
              duration: 0, // Could calculate from historical data
              tone: 0, // Could calculate from historical data
            }}
          />
        </motion.section>
      )}

      {/* Performance Dashboard */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <PerformanceDashboard
          overallScore={stats.overallScore}
          metrics={stats.metrics}
          weeklyData={stats.weeklyData}
          trend={stats.trend}
        />
      </motion.section>

      {/* Next Milestone */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <NextMilestone />
      </motion.section>

      {/* Practice History Feed */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <PracticeHistoryFeed />
      </motion.section>

      {/* Quick Actions Toolbar */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <QuickActionsToolbar />
      </motion.section>
    </div>
  )
}

