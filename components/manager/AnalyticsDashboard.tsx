'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Loader2 } from 'lucide-react'
import RadarChart from '@/components/analytics/RadarChart'
import ConversionFunnel from '@/components/analytics/ConversionFunnel'
import AIInsightsPanel from '@/components/analytics/AIInsightsPanel'
import RepComparison from '@/components/analytics/RepComparison'
import LeaderboardMini from '@/components/analytics/LeaderboardMini'
import DateRangePicker from '@/components/analytics/DateRangePicker'
import type { InsightType } from '@/components/analytics/AIInsightsPanel'

const mockReps = [
  { id: '1', name: 'Sarah Johnson' },
  { id: '2', name: 'Mike Chen' },
  { id: '3', name: 'Emily Rodriguez' },
  { id: '4', name: 'James Smith' },
]

const mockLeaderboard = [
  { rank: 1, name: 'Sarah Johnson', score: 94, change: 2 },
  { rank: 2, name: 'Mike Chen', score: 91, change: -1 },
  { rank: 3, name: 'Emily Rodriguez', score: 88, change: 1 },
  { rank: 4, name: 'James Smith', score: 85, change: 0 },
]

export default function AnalyticsDashboard() {
  const [selectedReps, setSelectedReps] = useState<string[]>(['1'])
  const [showTeamAverage, setShowTeamAverage] = useState(false)
  const [dateRange, setDateRange] = useState('Last 30 Days')
  const [refreshing, setRefreshing] = useState(false)
  const [insights, setInsights] = useState<Array<{ type: InsightType; title: string; description: string; confidence: number; priority: 'high' | 'medium' | 'low' }>>([])

  useEffect(() => {
    generateInsights()
    const id = setInterval(generateInsights, 60000)
    return () => clearInterval(id)
  }, [selectedReps])

  const generateInsights = () => {
    setInsights([
      { type: 'pattern', title: 'Discovery Questions Drive Wins', description: '3+ open-ended questions early increases close rate by 68%.', confidence: 87, priority: 'high' },
      { type: 'anomaly', title: 'Thursday Afternoon Dip', description: 'Objection handling down 23% on Thursdays 3-5 PM.', confidence: 92, priority: 'high' },
      { type: 'opportunity', title: 'Assumptive Language Undersused', description: 'Top reps use assumptive closes 2.3x more.', confidence: 79, priority: 'medium' },
      { type: 'coaching', title: 'Active Listening Gap', description: '4 reps need acknowledgment and paraphrasing drills.', confidence: 84, priority: 'high' },
      { type: 'predictor', title: 'Best Time Window', description: '10–11 AM sessions have 34% higher success.', confidence: 76, priority: 'medium' },
    ])
  }

  const handleRefreshInsights = () => {
    setRefreshing(true)
    setTimeout(() => { generateInsights(); setRefreshing(false) }, 1200)
  }

  const handleExport = () => {
    // TODO: implement export for manager analytics
    console.log('Export manager analytics')
  }

  const radarData = [
    { skill: 'Rapport Building', value: 84, teamAverage: 76 },
    { skill: 'Discovery', value: 86, teamAverage: 78 },
    { skill: 'Objection Handling', value: 73, teamAverage: 71 },
    { skill: 'Closing', value: 81, teamAverage: 69 },
    { skill: 'Speaking Mechanics', value: 79, teamAverage: 75 },
  ]

  const funnelStages = [
    { name: 'Door Opened', percentage: 100, avgTime: '0:30', bestPerformer: 'Sarah J.' },
    { name: 'Rapport Built', percentage: 82, avgTime: '2:10', bestPerformer: 'Mike C.' },
    { name: 'Needs Discovered', percentage: 68, avgTime: '4:20', isDropoff: true, dropoffReasons: ['Insufficient open-ended questions', 'Rushed discovery'], bestPerformer: 'Sarah J.' },
    { name: 'Solution Presented', percentage: 57, avgTime: '3:40', dropoffReasons: ['Generic pitch', 'Jargon confusion'], bestPerformer: 'Emily R.' },
    { name: 'Objections Handled', percentage: 44, avgTime: '5:05', isDropoff: true, dropoffReasons: ['Defensive tone', 'No clarifying questions'], bestPerformer: 'James S.' },
    { name: 'Close Attempted', percentage: 36, avgTime: '2:00', bestPerformer: 'Sarah J.' },
    { name: 'Sale Closed', percentage: 21, avgTime: '1:40', bestPerformer: 'Sarah J.' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Analytics Dashboard</h2>
          <p className="text-slate-400">Actionable team performance insights</p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-purple-600/30">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Three-column grid: 30-40-30 */}
      <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
        {/* Left 30% */}
        <div className="xl:col-span-3 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
            <h3 className="text-sm font-medium text-white mb-4 uppercase tracking-wider">Rep Comparison</h3>
            <RepComparison availableReps={mockReps} selectedReps={selectedReps} onSelectionChange={setSelectedReps} maxSelection={4} />
            <div className="mt-4 pt-4 border-t border-white/[0.08]">
              <button onClick={() => setShowTeamAverage(!showTeamAverage)} className={`${showTeamAverage ? 'bg-purple-500/20 text-purple-200' : 'bg-white/[0.02] text-white/70 hover:bg-white/[0.04] hover:text-white'} w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all`}>
                <span className="text-sm font-medium">Compare to Team Average</span>
                <div className={`${showTeamAverage ? 'bg-purple-500' : 'bg-white/20'} w-10 h-5 rounded-full relative`}>
                  <div className={`${showTeamAverage ? 'translate-x-5' : 'translate-x-0.5'} absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform`} />
                </div>
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
            <h3 className="text-sm font-medium text-white mb-2 uppercase tracking-wider">Skills Assessment</h3>
            <RadarChart data={radarData} showTeamAverage={showTeamAverage} animated={true} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
            <LeaderboardMini entries={mockLeaderboard} />
          </motion.div>
        </div>

        {/* Center 40% */}
        <div className="xl:col-span-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Session Flow Analysis</h3>
            <ConversionFunnel stages={funnelStages} />
          </motion.div>
        </div>

        {/* Right 30% */}
        <div className="xl:col-span-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-medium text-white uppercase tracking-wider">AI-Powered Recommendations</h3>
              {refreshing && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
            </div>
            <AIInsightsPanel insights={insights} onRefresh={handleRefreshInsights} refreshing={refreshing} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

