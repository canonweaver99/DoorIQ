'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Target, Award, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import EnhancedMetricCard from '../overview/EnhancedMetricCard'
import CriticalActionCard from '../overview/CriticalActionCard'
import SessionCard from '../overview/SessionCard'
import DailyFocusWidget from '../overview/DailyFocusWidget'
import QuickActionsFAB from '../overview/QuickActionsFAB'
import { MetricCardSkeleton, SessionCardSkeleton, EmptyState } from '../overview/SkeletonLoader'
import { Session } from './types'
import { useState, useEffect } from 'react'

interface OverviewTabProps {
  metrics: {
    sessionsToday: { value: number; trend: number; trendUp: boolean }
    avgScore: { value: number; trend: number; trendUp: boolean }
    skillsMastered: { value: number; total: number; percentage: number }
    teamRanking: { value: number; total: number; trend: number; trendUp: boolean }
  }
  recentSessions: Session[]
  insights: Array<{ id: number; text: string; type: string }>
}

export default function OverviewTab({ metrics, recentSessions, insights }: OverviewTabProps) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // Get critical alerts (warnings)
  const criticalActions = insights
    .filter(insight => insight.type === 'warning')
    .map((insight, index) => ({
      id: insight.id,
      text: insight.text,
      severity: index === 0 ? 'high' : 'medium' as 'high' | 'medium' | 'low',
      timestamp: new Date(Date.now() - Math.random() * 7200000), // Random time in last 2 hours
    }))

  // Prepare session data with skills and insights
  const enhancedSessions = recentSessions.slice(0, 4).map(session => ({
    id: session.id,
    homeowner: session.homeowner,
    time: session.time,
    score: session.score,
    skills: {
      rapport: 75 + Math.random() * 25,
      discovery: 70 + Math.random() * 25,
      objections: 65 + Math.random() * 25,
      closing: 70 + Math.random() * 25,
    },
    insight: session.feedback.slice(0, 60) + '...',
  }))

  // Generate sparkline data (7 days)
  const generateSparkline = (baseValue: number) => 
    Array.from({ length: 7 }, () => baseValue + (Math.random() - 0.5) * 10)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 pb-24"
    >
      {/* Critical Actions */}
      {criticalActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <CriticalActionCard actions={criticalActions} />
        </motion.div>
      )}

      {/* Enhanced Metrics Grid - Reduced spacing */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <EnhancedMetricCard
            title="Sessions Today"
            value={metrics.sessionsToday.value}
            trend={metrics.sessionsToday.trend}
            trendUp={metrics.sessionsToday.trendUp}
            icon={Target}
            sparklineData={generateSparkline(metrics.sessionsToday.value)}
            historicalData={{
              sevenDay: metrics.sessionsToday.value + 2,
              thirtyDay: metrics.sessionsToday.value + 15,
              allTime: metrics.sessionsToday.value + 127,
            }}
            delay={0}
          />
          <EnhancedMetricCard
            title="Average Score"
            value={`${metrics.avgScore.value}%`}
            trend={metrics.avgScore.trend}
            trendUp={metrics.avgScore.trendUp}
            icon={TrendingUp}
            sparklineData={generateSparkline(metrics.avgScore.value)}
            historicalData={{
              sevenDay: metrics.avgScore.value,
              thirtyDay: metrics.avgScore.value - 3,
              allTime: metrics.avgScore.value - 8,
            }}
            delay={0.05}
          />
          <EnhancedMetricCard
            title="Skills Mastered"
            value={metrics.skillsMastered.value}
            trend={8}
            trendUp={true}
            icon={Award}
            sparklineData={generateSparkline(metrics.skillsMastered.value)}
            historicalData={{
              sevenDay: metrics.skillsMastered.value,
              thirtyDay: metrics.skillsMastered.value - 1,
              allTime: metrics.skillsMastered.value - 3,
            }}
            delay={0.1}
          />
          <DailyFocusWidget
            current={metrics.sessionsToday.value}
            goal={3}
            type="sessions"
            delay={0.15}
          />
        </div>
      )}

      {/* Recent Sessions - 24px gap from metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-4 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Recent Sessions</h3>
          <Link
            href="/sessions"
            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <SessionCardSkeleton key={i} />)}
          </div>
        ) : enhancedSessions.length > 0 ? (
          <div className="space-y-2">
            {enhancedSessions.map((session, index) => (
              <SessionCard
                key={session.id}
                session={session}
                delay={0.25 + index * 0.05}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No sessions yet. Start your first training!" />
        )}
      </motion.div>

      {/* Quick Actions FAB */}
      <QuickActionsFAB />
    </motion.div>
  )
}

