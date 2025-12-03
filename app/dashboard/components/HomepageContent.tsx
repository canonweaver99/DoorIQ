'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import HeroQuickStart from './HeroQuickStart'
import PerformanceDashboard from './PerformanceDashboard'
import PracticeHistoryFeed from './PracticeHistoryFeed'
import QuickActionsToolbar from './QuickActionsToolbar'
import OnboardingElements from './OnboardingElements'
import MiniLeaderboard from '@/components/dashboard/MiniLeaderboard'
import PerformanceSnapshot from '@/components/dashboard/PerformanceSnapshot'
import WeeklySessionsChart from '@/components/dashboard/WeeklySessionsChart'
import DailyMotivationalQuote from '@/components/dashboard/DailyMotivationalQuote'
import QuickTips from '@/components/dashboard/QuickTips'
import RecommendedAgents from '@/components/dashboard/RecommendedAgents'
import SkillGapsAnalysis from '@/components/dashboard/SkillGapsAnalysis'
import RecommendedPractice from './RecommendedPractice'
import { useRouter } from 'next/navigation'
import { Play, ArrowRight } from 'lucide-react'

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

interface RotatingStats {
  streak: number
  repsToday: number
  teamRank: number
  averageScore: number
}

export default function HomepageContent() {
  const [stats, setStats] = useState<HomepageStats | null>(null)
  const [rotatingStats, setRotatingStats] = useState<RotatingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHomepageData()
  }, [])

  const fetchHomepageData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [statsResponse, rotatingResponse] = await Promise.all([
        fetch('/api/homepage/stats'),
        fetch('/api/homepage/rotating-stats')
      ])

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch homepage data')
      }

      const statsData = await statsResponse.json()
      setStats(statsData)

      if (rotatingResponse.ok) {
        const rotatingData = await rotatingResponse.json()
        setRotatingStats(rotatingData)
      }
    } catch (err: any) {
      console.error('Error fetching homepage data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 md:space-y-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-6 md:p-8 animate-pulse">
            <div className="h-6 bg-white/10 rounded-lg w-1/3 mb-4" />
            <div className="h-4 bg-white/10 rounded-lg w-full mb-3" />
            <div className="h-4 bg-white/10 rounded-lg w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8 text-center">
        <p className="text-white/80 mb-4 text-lg">Error loading homepage data</p>
        <button
          onClick={fetchHomepageData}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white font-medium transition-all"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) {
    // Show guest-friendly content when no stats
    return (
      <div className="space-y-6 md:space-y-8">
        <OnboardingElements totalSessions={0} />
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DailyMotivationalQuote streak={0} overallScore={0} />
        </motion.section>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <HeroQuickStart lastSession={null} />
        </motion.section>
      </div>
    )
  }

  const hasCompletedSessions = stats.totalSessions > 0
  const isEmpty = stats.overallScore === 0 && stats.metrics.closeRate === 0 && stats.metrics.avgDurationSeconds === 0

  // Generate skill gaps from breakdown for tips and recommendations
  const skillGaps = Object.entries(stats.skillBreakdown)
    .map(([skill, score]) => ({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1).replace(/([A-Z])/g, ' $1'),
      score
    }))
    .sort((a, b) => a.score - b.score)

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Onboarding Elements - Only show for new users */}
      <OnboardingElements totalSessions={stats.totalSessions} />

      {/* YOUR MISSION TODAY - Moved to top */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <RecommendedPractice />
      </motion.section>

      {/* Daily Motivational Quote */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="my-12 md:my-16 lg:my-20"
      >
        <DailyMotivationalQuote 
          streak={rotatingStats?.streak} 
          overallScore={stats.overallScore} 
        />
      </motion.section>

      {/* Quick Tips - Show for all users */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
      >
        <QuickTips 
          skillGaps={hasCompletedSessions ? skillGaps : []} 
          overallScore={stats.overallScore} 
        />
      </motion.section>

      {/* Hero/Quick Start Section - Main CTA */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <HeroQuickStart lastSession={stats.lastSession} />
      </motion.section>

      {/* Recommended Agents - Show for all users */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <RecommendedAgents skillGaps={hasCompletedSessions ? skillGaps : []} />
      </motion.section>

      {/* Performance Snapshot (shown after first session) */}
      {hasCompletedSessions && !isEmpty && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <PerformanceSnapshot
            overallScore={stats.overallScore}
            avgDurationSeconds={stats.metrics.avgDurationSeconds}
            toneScore={stats.metrics.toneScore}
            trend={{
              score: stats.trend,
              duration: 0,
              tone: 0,
            }}
          />
        </motion.section>
      )}

      {/* Weekly Sessions Chart */}
      {hasCompletedSessions && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <WeeklySessionsChart />
        </motion.section>
      )}

      {/* Performance Dashboard */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <PerformanceDashboard
          overallScore={stats.overallScore}
          metrics={stats.metrics}
          weeklyData={stats.weeklyData}
          trend={stats.trend}
          totalSessions={stats.totalSessions}
        />
      </motion.section>

      {/* Skill Gaps Analysis */}
      {hasCompletedSessions && !isEmpty && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <SkillGapsAnalysis skillBreakdown={stats.skillBreakdown} />
        </motion.section>
      )}

      {/* Mini Leaderboard */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <MiniLeaderboard />
      </motion.section>

      {/* Practice History Feed */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        <PracticeHistoryFeed />
      </motion.section>

      {/* Quick Actions Toolbar */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <QuickActionsToolbar />
      </motion.section>

      {/* Ready to Practice? - Moved to bottom */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        <ReadyToPracticeCard />
      </motion.section>
    </div>
  )
}

// Ready to Practice Card Component
function ReadyToPracticeCard() {
  const router = useRouter()

  const handleStartPractice = () => {
    router.push('/trainer')
  }

  return (
    <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 md:p-8 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025] overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="font-space text-white text-2xl md:text-3xl font-bold tracking-tight mb-2">
            Ready to Practice?
          </h2>
          <p className="font-space text-white/60 text-base md:text-lg">
            Start a new practice session and improve your skills
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartPractice}
          className="group/btn flex items-center justify-center gap-3 px-8 py-4 bg-white text-black font-bold rounded-md text-base md:text-lg tracking-tight hover:bg-white/95 transition-all font-space whitespace-nowrap"
        >
          <Play className="w-5 h-5" />
          Start Practice Session
          <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" />
        </motion.button>
      </div>
    </div>
  )
}
