'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Target, Award, Users, AlertCircle } from 'lucide-react'
import MetricCard from '../MetricCard'
import { Session } from './types'

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
  // Get critical alerts (warnings)
  const criticalAlerts = insights.filter(insight => insight.type === 'warning')
  
  // Limit to 3 most recent sessions
  const topSessions = recentSessions.slice(0, 3)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Critical Alerts - If any */}
      {criticalAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Critical Actions</h3>
              <div className="space-y-2">
                {criticalAlerts.map(alert => (
                  <p key={alert.id} className="text-sm text-amber-100">
                    • {alert.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Practice Sessions Today"
          value={metrics.sessionsToday.value}
          subtitle="sessions completed"
          trend={metrics.sessionsToday.trend}
          trendUp={metrics.sessionsToday.trendUp}
          icon={Target}
          delay={0.1}
        />
        <MetricCard
          title="Average Score"
          value={`${metrics.avgScore.value}%`}
          subtitle="this week"
          trend={metrics.avgScore.trend}
          trendUp={metrics.avgScore.trendUp}
          icon={TrendingUp}
          delay={0.15}
        />
        <MetricCard
          title="Skills Mastered"
          value={metrics.skillsMastered.value}
          subtitle={`of ${metrics.skillsMastered.total} total`}
          progress={metrics.skillsMastered.percentage}
          icon={Award}
          delay={0.2}
        />
        <MetricCard
          title="Team Ranking"
          value={`#${metrics.teamRanking.value}`}
          subtitle={`of ${metrics.teamRanking.total} members`}
          trend={metrics.teamRanking.trend}
          trendUp={metrics.teamRanking.trendUp}
          icon={Users}
          delay={0.25}
        />
      </div>

      {/* Recent Sessions - Limited to 3 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
            <p className="text-xs text-slate-400">Your last 3 training sessions</p>
          </div>
        </div>

        <div className="space-y-3">
          {topSessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
              className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-4 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-sm font-medium text-white">{session.homeowner}</p>
                    <span className={`text-lg font-bold ${getScoreColor(session.score)}`}>
                      {session.score}%
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{session.date}</span>
                    <span>•</span>
                    <span>{session.time}</span>
                    <span>•</span>
                    <span>{session.duration}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

