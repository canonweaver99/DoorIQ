'use client'

import { motion, useInView } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Calendar } from 'lucide-react'
import InsightsPanel from '../InsightsPanel'
import { createClient } from '@/lib/supabase/client'
import { PerformanceData, Insight, Session } from './types'

interface PerformanceTabProps {
  performanceData: PerformanceData[]
  insights: Insight[]
  sessions: Session[]
}

export default function PerformanceTab({ performanceData, insights, sessions }: PerformanceTabProps) {
  const [dateRange, setDateRange] = useState('7days')
  const [chartTimeRange, setChartTimeRange] = useState<'day' | 'week' | 'month'>('week')
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number } | null>(null)
  const [realAverages, setRealAverages] = useState({
    overall: 0,
    rapport: 0,
    discovery: 0,
    objections: 0,
    closing: 0
  })
  const [previousAverages, setPreviousAverages] = useState({
    overall: 0,
    rapport: 0,
    discovery: 0,
    objections: 0,
    closing: 0
  })
  const [realPerformanceData, setRealPerformanceData] = useState(performanceData)
  
  // Individual state for each card
  const [isOverallOpen, setIsOverallOpen] = useState(false)
  const [isRapportOpen, setIsRapportOpen] = useState(false)
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false)
  const [isObjectionOpen, setIsObjectionOpen] = useState(false)
  const [isClosingOpen, setIsClosingOpen] = useState(false)
  
  const chartRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const isChartInView = useInView(chartContainerRef, { once: false, amount: 0.5 })
  
  useEffect(() => {
    fetchRealPerformanceData()
  }, [dateRange])
  
  const fetchRealPerformanceData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return
    
    // Calculate date range
    const now = new Date()
    const daysBack = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : dateRange === '90days' ? 90 : 365
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)
    
    // Calculate previous period for comparison
    const previousStartDate = new Date()
    previousStartDate.setDate(previousStartDate.getDate() - (daysBack * 2))
    const previousEndDate = new Date()
    previousEndDate.setDate(previousEndDate.getDate() - daysBack)
    
    // Fetch current period sessions
    const { data: sessionsData } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
    
    // Fetch previous period sessions for comparison
    const { data: previousSessionsData } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', previousEndDate.toISOString())
    
    if (!sessionsData || sessionsData.length === 0) {
      setRealPerformanceData(performanceData)
      return
    }
    
    // Calculate current averages
    const avg = {
      overall: Math.round(sessionsData.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessionsData.length),
      rapport: Math.round(sessionsData.reduce((sum, s) => sum + (s.rapport_score || 0), 0) / sessionsData.length),
      discovery: Math.round(sessionsData.reduce((sum, s) => sum + (s.discovery_score || 0), 0) / sessionsData.length),
      objections: Math.round(sessionsData.reduce((sum, s) => sum + (s.objection_handling_score || 0), 0) / sessionsData.length),
      closing: Math.round(sessionsData.reduce((sum, s) => sum + (s.close_score || 0), 0) / sessionsData.length)
    }
    
    setRealAverages(avg)
    
    // Calculate previous averages
    if (previousSessionsData && previousSessionsData.length > 0) {
      const prevAvg = {
        overall: Math.round(previousSessionsData.reduce((sum, s) => sum + (s.overall_score || 0), 0) / previousSessionsData.length),
        rapport: Math.round(previousSessionsData.reduce((sum, s) => sum + (s.rapport_score || 0), 0) / previousSessionsData.length),
        discovery: Math.round(previousSessionsData.reduce((sum, s) => sum + (s.discovery_score || 0), 0) / previousSessionsData.length),
        objections: Math.round(previousSessionsData.reduce((sum, s) => sum + (s.objection_handling_score || 0), 0) / previousSessionsData.length),
        closing: Math.round(previousSessionsData.reduce((sum, s) => sum + (s.close_score || 0), 0) / previousSessionsData.length)
      }
      setPreviousAverages(prevAvg)
    }
    
    // Build performance data for chart (group by date)
    const dataByDate = sessionsData.reduce((acc: any, session) => {
      const date = new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (!acc[date]) {
        acc[date] = { date, sessions: [], overall: 0, rapport: 0, discovery: 0, objections: 0, closing: 0 }
      }
      acc[date].sessions.push(session)
      return acc
    }, {})
    
    const chartData = Object.values(dataByDate).map((day: any) => ({
      date: day.date,
      overall: Math.round(day.sessions.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) / day.sessions.length),
      rapport: Math.round(day.sessions.reduce((sum: number, s: any) => sum + (s.rapport_score || 0), 0) / day.sessions.length),
      discovery: Math.round(day.sessions.reduce((sum: number, s: any) => sum + (s.discovery_score || 0), 0) / day.sessions.length),
      objections: Math.round(day.sessions.reduce((sum: number, s: any) => sum + (s.objection_handling_score || 0), 0) / day.sessions.length),
      closing: Math.round(day.sessions.reduce((sum: number, s: any) => sum + (s.close_score || 0), 0) / day.sessions.length)
    }))
    
    setRealPerformanceData(chartData)
  }
  
  const getColor = (pct: number) => {
    if (pct >= 90) return '#10b981'
    if (pct >= 80) return '#22c55e'
    if (pct >= 70) return '#eab308'
    if (pct >= 60) return '#f97316'
    return '#ef4444'
  }
  
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return Math.round(((current - previous) / previous) * 100)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Top Metrics Row - 5 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 items-start">
        {/* Overall Card */}
        <div 
          onClick={() => setIsOverallOpen(!isOverallOpen)}
          className="rounded-lg p-5 cursor-pointer transition-all"
          style={{ 
            backgroundColor: '#2a1a3a',
            border: '2px solid #4a2a6a',
            boxShadow: 'inset 0 0 20px rgba(138, 43, 226, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)',
            outline: 'none'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-purple-200 uppercase tracking-wide">Overall Score</h3>
            <svg className={`w-3 h-3 text-purple-300 transition-transform ${isOverallOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-2 tabular-nums">{realAverages.overall}%</div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-semibold text-green-400">
              {calculateChange(realAverages.overall, previousAverages.overall) > 0 ? '+' : ''}
              {calculateChange(realAverages.overall, previousAverages.overall)}% from last period
            </p>
          </div>
          {isOverallOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 pt-3 overflow-hidden"
              style={{ borderTop: '1px solid #4a2a6a' }}
            >
              <p className="text-[15px] text-slate-300 leading-relaxed">Focus on consistency across all areas. Your rapport and discovery skills show promise.</p>
            </motion.div>
          )}
        </div>

        {/* Rapport Card */}
        <div 
          onClick={() => setIsRapportOpen(!isRapportOpen)}
          className="rounded-lg p-5 cursor-pointer transition-all"
          style={{ 
            backgroundColor: '#1a3a2a',
            border: '2px solid #2a6a4a',
            boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)',
            outline: 'none'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-emerald-200 uppercase tracking-wide">Rapport</h3>
            <svg className={`w-3 h-3 text-emerald-300 transition-transform ${isRapportOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-2 tabular-nums">{realAverages.rapport}%</div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-semibold text-green-400">
              {calculateChange(realAverages.rapport, previousAverages.rapport) > 0 ? '+' : ''}
              {calculateChange(realAverages.rapport, previousAverages.rapport)}% from last period
            </p>
          </div>
          {isRapportOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 pt-3 overflow-hidden"
              style={{ borderTop: '1px solid #2a6a4a' }}
            >
              <p className="text-[15px] text-slate-300 leading-relaxed">Incorporate personalized questions within the first 30 seconds.</p>
            </motion.div>
          )}
        </div>

        {/* Discovery Card */}
        <div 
          onClick={() => setIsDiscoveryOpen(!isDiscoveryOpen)}
          className="rounded-lg p-5 cursor-pointer transition-all"
          style={{ 
            backgroundColor: '#1a2a3a',
            border: '2px solid #2a4a6a',
            boxShadow: 'inset 0 0 20px rgba(59, 130, 246, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)',
            outline: 'none'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-wide">Discovery</h3>
            <svg className={`w-3 h-3 text-blue-300 transition-transform ${isDiscoveryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-2 tabular-nums">{realAverages.discovery}%</div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-semibold text-green-400">
              {calculateChange(realAverages.discovery, previousAverages.discovery) > 0 ? '+' : ''}
              {calculateChange(realAverages.discovery, previousAverages.discovery)}% from last period
            </p>
          </div>
          {isDiscoveryOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 pt-3 overflow-hidden"
              style={{ borderTop: '1px solid #2a4a6a' }}
            >
              <p className="text-[15px] text-slate-300 leading-relaxed">Dig deeper into pain points with follow-up questions.</p>
            </motion.div>
          )}
        </div>

        {/* Objection Card */}
        <div 
          onClick={() => setIsObjectionOpen(!isObjectionOpen)}
          className="rounded-lg p-5 cursor-pointer transition-all"
          style={{ 
            backgroundColor: '#3a2a1a',
            border: '2px solid #6a4a2a',
            boxShadow: 'inset 0 0 20px rgba(245, 158, 11, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)',
            outline: 'none'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-amber-200 uppercase tracking-wide">Objection</h3>
            <svg className={`w-3 h-3 text-amber-300 transition-transform ${isObjectionOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-2 tabular-nums">{realAverages.objections}%</div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-semibold text-green-400">
              {calculateChange(realAverages.objections, previousAverages.objections) > 0 ? '+' : ''}
              {calculateChange(realAverages.objections, previousAverages.objections)}% from last period
            </p>
          </div>
          {isObjectionOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 pt-3 overflow-hidden"
              style={{ borderTop: '1px solid #6a4a2a' }}
            >
              <p className="text-[15px] text-slate-300 leading-relaxed">Reframe price concerns as investment discussions.</p>
            </motion.div>
          )}
        </div>

        {/* Closing Card */}
        <div 
          onClick={() => setIsClosingOpen(!isClosingOpen)}
          className="rounded-lg p-5 cursor-pointer transition-all"
          style={{ 
            backgroundColor: '#3a1a2a',
            border: '2px solid #6a2a4a',
            boxShadow: 'inset 0 0 20px rgba(236, 72, 153, 0.1), 0 4px 16px rgba(0, 0, 0, 0.4)',
            outline: 'none'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-pink-200 uppercase tracking-wide">Closing</h3>
            <svg className={`w-3 h-3 text-pink-300 transition-transform ${isClosingOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-2 tabular-nums">{realAverages.closing}%</div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-xs font-semibold text-green-400">
              {calculateChange(realAverages.closing, previousAverages.closing) > 0 ? '+' : ''}
              {calculateChange(realAverages.closing, previousAverages.closing)}% from last period
            </p>
          </div>
          {isClosingOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 pt-3 overflow-hidden"
              style={{ borderTop: '1px solid #6a2a4a' }}
            >
              <p className="text-[15px] text-slate-300 leading-relaxed">Use assumptive language: "When we install" vs "If you decide".</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Performance Overview Chart */}
      <div ref={chartContainerRef} className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Performance Overview</h3>
            <p className="text-sm text-white/60">Weekly trend analysis</p>
          </div>
          {/* Time Range Tabs */}
          <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1 border border-[#2a2a2a]">
            {(['day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setChartTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  chartTimeRange === range
                    ? 'bg-[#a855f7] text-white'
                    : 'text-[#8a8a8a] hover:text-white'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="relative" style={{ height: '353px' }}>
          {/* Y-Axis */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-sm font-semibold text-white pr-2 border-r border-[#2a2a2a]">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>
          
          <div className="ml-12 mr-0 h-full pb-8 relative border-b border-[#2a2a2a] w-[95%]" ref={chartRef}>
            {/* Tooltip overlay */}
            {hoveredPoint && chartRef.current && (() => {
              const rect = chartRef.current.getBoundingClientRect()
              const pixelX = (hoveredPoint.x / 350) * rect.width
              const pixelY = (hoveredPoint.y / 240) * (rect.height - 32)
              
              const getPercentColor = (pct: number) => {
                if (pct >= 85) return '#10b981'
                if (pct >= 75) return '#22c55e'
                if (pct >= 65) return '#84cc16'
                if (pct >= 55) return '#eab308'
                if (pct >= 45) return '#f97316'
                return '#ef4444'
              }
              
              return (
                <div
                  className="absolute pointer-events-none z-50"
                  style={{
                    left: pixelX,
                    top: pixelY - 80,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="bg-black/95 border rounded-lg px-3 py-2 shadow-lg" style={{ borderColor: getPercentColor(hoveredPoint.value) }}>
                    <div className="font-bold text-lg text-center leading-tight mb-1" style={{ color: getPercentColor(hoveredPoint.value) }}>
                      {hoveredPoint.value}%
                    </div>
                    <div className="text-slate-400 text-xs text-center whitespace-nowrap">
                      Overall Score
                    </div>
                  </div>
                </div>
              )
            })()}
            
            <svg 
              viewBox="0 0 350 240" 
              className="w-full h-full absolute inset-0" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="50%" stopColor="#EC4899" />
                  <stop offset="100%" stopColor="#F472B6" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#EC4899" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <path
                d="M 25 150 C 50 135, 60 110, 75 90 C 100 72, 115 78, 125 75 C 150 72, 165 55, 175 50 C 200 45, 215 60, 225 65 C 250 70, 265 78, 275 75 C 300 72, 315 55, 325 45 L 325 240 L 25 240 Z"
                fill="url(#areaGradient)"
              />
              <motion.path
                d="M 25 150 C 50 135, 60 110, 75 90 C 100 72, 115 78, 125 75 C 150 72, 165 55, 175 50 C 200 45, 215 60, 225 65 C 250 70, 265 78, 275 75 C 300 72, 315 55, 325 45"
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isChartInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
              {/* Animated data points */}
              {[
                { cx: 25, cy: 150, value: 38 },
                { cx: 75, cy: 90, value: 63 },
                { cx: 125, cy: 75, value: 69 },
                { cx: 175, cy: 50, value: 79 },
                { cx: 225, cy: 65, value: 73 },
                { cx: 275, cy: 75, value: 69 },
                { cx: 325, cy: 45, value: 81 },
              ].map((point, index) => (
                <motion.circle
                  key={index}
                  cx={point.cx}
                  cy={point.cy}
                  r="5"
                  fill="#EC4899"
                  stroke="white"
                  strokeWidth="2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={isChartInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  transition={{
                    delay: isChartInView ? 1.5 + (index * 0.1) : 0,
                    duration: 0.5,
                    type: "spring",
                    stiffness: 260,
                    damping: 20
                  }}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint({ x: point.cx, y: point.cy, value: point.value })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </svg>
            
            <div className="absolute bottom-0 left-0 right-0 text-sm font-semibold text-white">
              {[
                { day: 'Mon', position: '7.14%' },
                { day: 'Tue', position: '21.43%' },
                { day: 'Wed', position: '35.71%' },
                { day: 'Thu', position: '50%' },
                { day: 'Fri', position: '64.29%' },
                { day: 'Sat', position: '78.57%' },
                { day: 'Sun', position: '92.86%' },
              ].map((item) => (
                <span key={item.day} className="absolute text-center" style={{ left: item.position, transform: 'translateX(-50%)' }}>{item.day}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <InsightsPanel insights={insights} />
      </motion.div>
    </motion.div>
  )
}

