'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import RadarChart from '@/components/analytics/RadarChart'
import ConversionFunnel from '@/components/analytics/ConversionFunnel'
import AIInsightsPanel from '@/components/analytics/AIInsightsPanel'
import RepComparison from '@/components/analytics/RepComparison'
import LeaderboardMini from '@/components/analytics/LeaderboardMini'
import DateRangePicker from '@/components/analytics/DateRangePicker'
import type { InsightType } from '@/components/analytics/AIInsightsPanel'

// Mock data - replace with real API calls
const mockReps = [
  { id: '1', name: 'Sarah Johnson' },
  { id: '2', name: 'Mike Chen' },
  { id: '3', name: 'Emily Rodriguez' },
  { id: '4', name: 'James Smith' },
  { id: '5', name: 'Alex Thompson' },
  { id: '6', name: 'Lisa Anderson' }
]

const mockLeaderboard = [
  { rank: 1, name: 'Sarah Johnson', score: 94, change: 2 },
  { rank: 2, name: 'Mike Chen', score: 91, change: -1 },
  { rank: 3, name: 'Emily Rodriguez', score: 88, change: 1 },
  { rank: 4, name: 'James Smith', score: 85, change: 0 },
  { rank: 5, name: 'Alex Thompson', score: 82, change: -2 }
]

export default function AnalyticsPage() {
  const [selectedReps, setSelectedReps] = useState<string[]>(['1'])
  const [showTeamAverage, setShowTeamAverage] = useState(false)
  const [dateRange, setDateRange] = useState('Last 7 days')
  const [refreshing, setRefreshing] = useState(false)
  const [insights, setInsights] = useState<Array<{
    type: InsightType
    title: string
    description: string
    confidence: number
    priority: 'high' | 'medium' | 'low'
  }>>([])

  // Auto-refresh insights every 60 seconds
  useEffect(() => {
    generateInsights()
    const interval = setInterval(() => {
      generateInsights()
    }, 60000)

    return () => clearInterval(interval)
  }, [selectedReps])

  const generateInsights = () => {
    // Mock AI insights - replace with real AI analysis
    const newInsights = [
      {
        type: 'pattern' as InsightType,
        title: 'Discovery Phase Success Pattern',
        description: 'Reps who ask 3+ open-ended questions in the first 2 minutes have 68% higher close rates. Consider implementing this as a best practice.',
        confidence: 87,
        priority: 'high' as const
      },
      {
        type: 'anomaly' as InsightType,
        title: 'Unusual Objection Handling Drop',
        description: 'Objection handling scores dropped 23% on Thursday afternoons. Investigation shows reps are rushing to finish before weekend.',
        confidence: 92,
        priority: 'high' as const
      },
      {
        type: 'opportunity' as InsightType,
        title: 'Untapped Closing Technique',
        description: 'Top performers use assumptive language 2.3x more often. Training the team on this technique could increase conversions by 15-20%.',
        confidence: 79,
        priority: 'medium' as const
      },
      {
        type: 'coaching' as InsightType,
        title: 'Prioritize Active Listening Training',
        description: '4 reps show consistent low scores in acknowledgment and paraphrasing. A focused 30-minute coaching session could yield quick improvements.',
        confidence: 84,
        priority: 'high' as const
      },
      {
        type: 'predictor' as InsightType,
        title: 'High Success Probability Window',
        description: 'Sessions starting between 10-11 AM have 34% higher success rates. Consider scheduling high-value leads during this time.',
        confidence: 76,
        priority: 'medium' as const
      }
    ]

    setInsights(newInsights)
  }

  const handleRefreshInsights = () => {
    setRefreshing(true)
    setTimeout(() => {
      generateInsights()
      setRefreshing(false)
    }, 1500)
  }

  const handleExport = () => {
    // Export analytics data
    console.log('Exporting analytics data...')
  }

  // Mock radar data - replace with real data based on selected reps
  const radarData = [
    { skill: 'Rapport Building', value: 87, teamAverage: 75 },
    { skill: 'Discovery', value: 92, teamAverage: 78 },
    { skill: 'Objection Handling', value: 78, teamAverage: 72 },
    { skill: 'Closing', value: 85, teamAverage: 70 },
    { skill: 'Speaking Mechanics', value: 81, teamAverage: 76 }
  ]

  // Mock funnel data - replace with real data
  const funnelStages = [
    { 
      name: 'Door Opened', 
      percentage: 100, 
      avgTime: '0:30',
      bestPerformer: 'Sarah J.'
    },
    { 
      name: 'Rapport Built', 
      percentage: 84, 
      avgTime: '2:15',
      dropoffReasons: [
        'Failed to establish common ground',
        'Too aggressive with pitch timing',
        'Lack of genuine interest shown'
      ],
      bestPerformer: 'Mike C.'
    },
    { 
      name: 'Needs Discovered', 
      percentage: 71, 
      avgTime: '4:30',
      dropoffReasons: [
        'Insufficient open-ended questions',
        'Didn\'t actively listen to responses',
        'Rushed through discovery phase'
      ],
      isDropoff: true,
      bestPerformer: 'Sarah J.'
    },
    { 
      name: 'Solution Presented', 
      percentage: 58, 
      avgTime: '3:45',
      dropoffReasons: [
        'Generic pitch not tailored to needs',
        'Technical jargon confused homeowner',
        'Failed to connect value to pain points'
      ],
      bestPerformer: 'Emily R.'
    },
    { 
      name: 'Objections Handled', 
      percentage: 45, 
      avgTime: '5:20',
      dropoffReasons: [
        'Became defensive with objections',
        'Didn\'t ask clarifying questions',
        'Gave up after first objection'
      ],
      isDropoff: true,
      bestPerformer: 'James S.'
    },
    { 
      name: 'Close Attempted', 
      percentage: 38, 
      avgTime: '2:10',
      bestPerformer: 'Sarah J.'
    },
    { 
      name: 'Sale Closed', 
      percentage: 22, 
      avgTime: '1:45',
      bestPerformer: 'Sarah J.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Performance Analytics
            </h1>
            <p className="text-white/60 text-sm">
              AI-powered insights and actionable intelligence
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date range picker */}
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
            />

            {/* Export button */}
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 
                       bg-purple-600/20 border border-purple-500/30 rounded-xl
                       hover:bg-purple-600/30 transition-all duration-200
                       text-purple-200 hover:text-white text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Three-column grid */}
        <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
          {/* Left Column - 30% */}
          <div className="xl:col-span-3 space-y-6">
            {/* Rep Comparison */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5"
            >
              <h2 className="text-sm font-medium text-white mb-4 uppercase tracking-wider">
                Rep Comparison
              </h2>
              <RepComparison
                availableReps={mockReps}
                selectedReps={selectedReps}
                onSelectionChange={setSelectedReps}
                maxSelection={4}
              />

              {/* Team average toggle */}
              <div className="mt-4 pt-4 border-t border-white/[0.08]">
                <button
                  onClick={() => setShowTeamAverage(!showTeamAverage)}
                  className={`
                    w-full flex items-center justify-between px-4 py-2.5 rounded-lg
                    transition-all duration-200
                    ${showTeamAverage 
                      ? 'bg-purple-500/20 text-purple-200' 
                      : 'bg-white/[0.02] text-white/70 hover:bg-white/[0.04] hover:text-white'
                    }
                  `}
                >
                  <span className="text-sm font-medium">Compare to Team Average</span>
                  <div className={`
                    w-10 h-5 rounded-full relative transition-colors duration-200
                    ${showTeamAverage ? 'bg-purple-500' : 'bg-white/20'}
                  `}>
                    <div className={`
                      absolute top-0.5 w-4 h-4 rounded-full bg-white
                      transition-transform duration-200
                      ${showTeamAverage ? 'translate-x-5' : 'translate-x-0.5'}
                    `} />
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Radar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5"
            >
              <h2 className="text-sm font-medium text-white mb-2 uppercase tracking-wider">
                Skills Assessment
              </h2>
              <RadarChart
                data={radarData}
                showTeamAverage={showTeamAverage}
                animated={true}
              />
            </motion.div>

            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5"
            >
              <LeaderboardMini entries={mockLeaderboard} />
            </motion.div>
          </div>

          {/* Center Column - 40% */}
          <div className="xl:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-6">
                Session Flow Analysis
              </h2>
              <ConversionFunnel stages={funnelStages} />
            </motion.div>
          </div>

          {/* Right Column - 30% */}
          <div className="xl:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-medium text-white uppercase tracking-wider">
                  AI-Powered Recommendations
                </h2>
                {refreshing && (
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                )}
              </div>
              <AIInsightsPanel
                insights={insights}
                onRefresh={handleRefreshInsights}
                refreshing={refreshing}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
