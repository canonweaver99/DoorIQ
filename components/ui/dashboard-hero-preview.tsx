'use client'

import { useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export function DashboardHeroPreview() {
  const [activeTab, setActiveTab] = useState('overview')
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number } | null>(null)
  const [chartTimeRange, setChartTimeRange] = useState<'day' | 'week' | 'month'>('week')
  
  // Optimized: Single state object instead of 5 separate states
  const [cardStates, setCardStates] = useState({
    overall: false,
    rapport: false,
    discovery: false,
    objection: false,
    closing: false
  })
  
  const toggleCard = (card: keyof typeof cardStates) => {
    setCardStates(prev => ({ ...prev, [card]: !prev[card] }))
  }
  
  const chartRef = useRef<HTMLDivElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const isChartInView = useInView(chartContainerRef, { once: false, amount: 0.5 })
  
  // Calculate date range
  const startDate = new Date('2024-09-08')
  const today = new Date()
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'performance', label: 'Performance', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'learning', label: 'Learning', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'upload', label: 'Upload', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
    { id: 'team', label: 'Team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'messages', label: 'Messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  ]

  const getColor = (pct: number) => {
    if (pct >= 90) return '#10b981'
    if (pct >= 80) return '#22c55e'
    if (pct >= 70) return '#eab308'
    if (pct >= 60) return '#f97316'
    return '#ef4444'
  }

  return (
    <div className="w-full max-w-[2000px] mx-auto bg-black/70 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-hidden shadow-lg shadow-indigo-500/10 border border-indigo-500/30 font-sans">
      <div className="px-6 sm:px-8 lg:px-10 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 font-space">Dashboard</h2>
            <p className="text-xs sm:text-sm font-medium text-slate-400 font-sans">{formatDate(startDate)} - {formatDate(today)}</p>
          </div>
          <button className="px-4 sm:px-5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-white text-xs sm:text-sm font-semibold rounded-lg border border-indigo-500/30 transition-all font-sans">
            Download
          </button>
        </div>

        {/* Tabs - Only Overview shown */}
        <div className="flex gap-6 mb-6 border-b border-indigo-500/30 overflow-x-auto">
          <div className="pb-3 px-1 text-sm font-semibold whitespace-nowrap text-white border-b-2 border-indigo-500">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Overview
            </span>
          </div>
        </div>

        {/* Tab Content - Overview Only */}
        <div className="space-y-8">
            {/* Top Metrics Row - 5 cards (matte style) */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2 lg:gap-4 items-start">
              {/* Overall Card */}
              <div 
                onClick={() => toggleCard('overall')}
                className="rounded-lg sm:rounded-xl cursor-pointer transition-all will-change-transform p-2 sm:p-3 lg:p-4 border border-indigo-500/30 bg-black/50 backdrop-blur-sm hover:border-indigo-400/50 hover:bg-black/60"
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-[9px] sm:text-xs font-semibold text-indigo-300 uppercase tracking-wide font-space">Overall Score</h3>
                  <svg className={`w-3 h-3 text-indigo-400 transition-transform ${cardStates.overall ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="text-lg sm:text-xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 tabular-nums font-space">83%</div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-[9px] sm:text-xs font-semibold text-emerald-400 font-sans">+7% from last week</p>
                </div>
                {cardStates.overall && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 pt-3 overflow-hidden border-t border-indigo-500/30"
                  >
                    <p className="text-xs sm:text-sm font-bold text-indigo-400 mb-2 font-space">AI Feedback</p>
                    <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed font-sans">Focus on consistency across all areas. Your rapport and discovery skills show promise.</p>
                  </motion.div>
                )}
              </div>

              {/* Rapport Card */}
              <div 
                onClick={() => toggleCard('rapport')}
                className="rounded-lg sm:rounded-xl cursor-pointer transition-all will-change-transform p-2 sm:p-3 lg:p-4 border border-indigo-500/30 bg-black/50 backdrop-blur-sm hover:border-indigo-400/50 hover:bg-black/60"
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-[9px] sm:text-xs font-semibold text-indigo-300 uppercase tracking-wide font-space">Rapport</h3>
                  <svg className={`w-3 h-3 text-indigo-400 transition-transform ${cardStates.rapport ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="text-lg sm:text-xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 tabular-nums font-space">88%</div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-[9px] sm:text-xs font-semibold text-emerald-400 font-sans">+5% from last week</p>
                </div>
                {cardStates.rapport && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 pt-3 overflow-hidden border-t border-indigo-500/30"
                  >
                    <p className="text-xs sm:text-sm font-bold text-indigo-400 mb-2 font-space">AI Feedback</p>
                    <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed font-sans">Incorporate personalized questions within the first 30 seconds. Reference specific details about their property.</p>
                  </motion.div>
                )}
              </div>

              {/* Discovery Card */}
              <div 
                onClick={() => toggleCard('discovery')}
                className="rounded-lg sm:rounded-xl cursor-pointer transition-all will-change-transform p-2 sm:p-3 lg:p-4 border border-indigo-500/30 bg-black/50 backdrop-blur-sm hover:border-indigo-400/50 hover:bg-black/60"
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-[9px] sm:text-xs font-semibold text-indigo-300 uppercase tracking-wide font-space">Discovery</h3>
                  <svg className={`w-3 h-3 text-indigo-400 transition-transform ${cardStates.discovery ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="text-lg sm:text-xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 tabular-nums font-space">82%</div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-[9px] sm:text-xs font-semibold text-emerald-400 font-sans">+13% from last week</p>
                </div>
                {cardStates.discovery && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 pt-3 overflow-hidden border-t border-indigo-500/30"
                  >
                    <p className="text-xs sm:text-sm font-bold text-indigo-400 mb-2 font-space">AI Feedback</p>
                    <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed font-sans">Dig deeper into pain points with follow-up questions about specific frustrations.</p>
                  </motion.div>
                )}
              </div>

              {/* Objection Card */}
              <div 
                onClick={() => toggleCard('objection')}
                className="rounded-lg sm:rounded-xl cursor-pointer transition-all will-change-transform p-2 sm:p-3 lg:p-4 border border-indigo-500/30 bg-black/50 backdrop-blur-sm hover:border-indigo-400/50 hover:bg-black/60"
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-[9px] sm:text-xs font-semibold text-indigo-300 uppercase tracking-wide font-space">Objection</h3>
                  <svg className={`w-3 h-3 text-indigo-400 transition-transform ${cardStates.objection ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="text-lg sm:text-xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 tabular-nums font-space">79%</div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-[9px] sm:text-xs font-semibold text-emerald-400 font-sans">+8% from last week</p>
                </div>
                {cardStates.objection && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 pt-3 overflow-hidden border-t border-indigo-500/30"
                  >
                    <p className="text-xs sm:text-sm font-bold text-indigo-400 mb-2 font-space">AI Feedback</p>
                    <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed font-sans">Reframe price concerns as investment discussions. Pivot to ROI and break down savings.</p>
                  </motion.div>
                )}
              </div>

              {/* Closing Card */}
              <div 
                onClick={() => toggleCard('closing')}
                className="rounded-lg sm:rounded-xl cursor-pointer transition-all will-change-transform p-2 sm:p-3 lg:p-4 border border-indigo-500/30 bg-black/50 backdrop-blur-sm hover:border-indigo-400/50 hover:bg-black/60"
              >
                <div className="flex items-center justify-between mb-1 sm:mb-2">
                  <h3 className="text-[9px] sm:text-xs font-semibold text-indigo-300 uppercase tracking-wide font-space">Closing</h3>
                  <svg className={`w-3 h-3 text-indigo-400 transition-transform ${cardStates.closing ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="text-lg sm:text-xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 tabular-nums font-space">85%</div>
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-[9px] sm:text-xs font-semibold text-emerald-400 font-sans">+6% from last week</p>
                </div>
                {cardStates.closing && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 pt-3 overflow-hidden border-t border-indigo-500/30"
                  >
                    <p className="text-xs sm:text-sm font-bold text-indigo-400 mb-2 font-space">AI Feedback</p>
                    <p className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed font-sans">Use assumptive language in your close. Replace questions with statements like 'When we install this'.</p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Bottom Section - Graph under Overall Score */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left Column - Performance Overview under Overall Score */}
              <div ref={chartContainerRef} className="lg:col-span-3 pt-4" style={{ maxWidth: '98%' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 font-space">Performance Overview</h3>
                    <p className="text-xs sm:text-sm text-slate-400 font-sans">Weekly trend analysis</p>
                  </div>
                  {/* Time Range Tabs */}
                  <div className="flex gap-1 bg-black/50 border border-indigo-500/30 rounded-lg p-1">
                    {(['day', 'week', 'month'] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setChartTimeRange(range)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 font-sans ${
                          chartTimeRange === range
                            ? 'bg-indigo-500/30 text-white border border-indigo-500/50'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative" style={{ height: '353px' }}>
                  {/* Y-Axis */}
                  <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs font-bold text-slate-300 pr-2 border-r border-indigo-500/30">
                    <span className="text-white text-sm font-space">100%</span>
                    <span className="text-white text-sm font-space">75%</span>
                    <span className="text-white text-sm font-space">50%</span>
                    <span className="text-white text-sm font-space">25%</span>
                    <span className="text-white text-sm font-space">0%</span>
                  </div>
                  
                   <div className="ml-12 h-full pb-8 relative border-b border-indigo-500/30" ref={chartRef} style={{ paddingRight: '25px' }}>
                    {/* Tooltip overlay - positioned absolutely */}
                    {hoveredPoint && chartRef.current && (() => {
                      const rect = chartRef.current.getBoundingClientRect()
                      const pixelX = (hoveredPoint.x / 350) * rect.width
                      const pixelY = (hoveredPoint.y / 240) * (rect.height - 32)
                      
                      // Red-green color scale based on percentage
                      const getPercentColor = (pct: number) => {
                        if (pct >= 85) return '#10b981' // green-500
                        if (pct >= 75) return '#22c55e' // green-400
                        if (pct >= 65) return '#84cc16' // lime-500
                        if (pct >= 55) return '#eab308' // yellow-500
                        if (pct >= 45) return '#f97316' // orange-500
                        return '#ef4444' // red-500
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
                              47 Sessions
                            </div>
                            <div className="text-green-400 text-xs text-center font-semibold whitespace-nowrap">
                              $4,238 Earned
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                    
                    <svg 
                      viewBox="0 0 350 240" 
                      className="w-full h-full absolute inset-0" 
                      preserveAspectRatio="xMidYMid meet"
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
                         d="M 0 148.8 C 29 119, 44 104, 58.33 88.8 C 87 82, 102 78, 116.67 74.4 C 146 60, 161 56, 175 50.4 C 204 58, 219 63, 233.33 64.8 C 262 72, 277 75, 291.67 74.4 C 320 52, 335 48, 350 45.6 L 350 240 L 0 240 Z"
                         fill="url(#areaGradient)"
                       />
                      <motion.path
                        key={chartTimeRange}
                        d="M 0 148.8 C 29 119, 44 104, 58.33 88.8 C 87 82, 102 78, 116.67 74.4 C 146 60, 161 56, 175 50.4 C 204 58, 219 63, 233.33 64.8 C 262 72, 277 75, 291.67 74.4 C 320 52, 335 48, 350 45.6"
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={isChartInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                      />
                      {/* Hover vertical line */}
                      {hoveredPoint && (
                        <line
                          x1={hoveredPoint.x}
                          y1="0"
                          x2={hoveredPoint.x}
                          y2="240"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeDasharray="5 5"
                          opacity="0.6"
                        />
                      )}
                      
                      {/* Animated data points */}
                      {[
                        { cx: 0, cy: 148.8, value: 38 },        // Mon - 38%
                        { cx: 58.33, cy: 88.8, value: 63 },    // Tue - 63%
                        { cx: 116.67, cy: 74.4, value: 69 },   // Wed - 69%
                        { cx: 175, cy: 50.4, value: 79 },      // Thu - 79%
                        { cx: 233.33, cy: 64.8, value: 73 },   // Fri - 73%
                        { cx: 291.67, cy: 74.4, value: 69 },   // Sat - 69%
                        { cx: 350, cy: 45.6, value: 81 },      // Sun - 81%
                      ].map((point, index) => (
                        <g key={index}>
                          <motion.circle
                            cx={point.cx}
                            cy={point.cy}
                            r={hoveredPoint && hoveredPoint.x === point.cx ? "8" : "5"}
                            fill="#EC4899"
                            stroke="white"
                            strokeWidth={hoveredPoint && hoveredPoint.x === point.cx ? "3" : "2"}
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
                        </g>
                      ))}
                     </svg>
                     
                     <div className="absolute bottom-0 left-0 right-0 text-xs font-bold text-gray-300 h-6">
                       {[
                         { day: 'Mon', cx: 25 },
                         { day: 'Tue', cx: 75 },
                         { day: 'Wed', cx: 125 },
                         { day: 'Thu', cx: 175 },
                         { day: 'Fri', cx: 225 },
                         { day: 'Sat', cx: 275 },
                         { day: 'Sun', cx: 325 },
                       ].map((item) => (
                         <span 
                           key={item.day} 
                           className="absolute text-center text-white text-sm font-semibold" 
                           style={{ 
                             left: `calc(${(item.cx / 350) * 100}%)`, 
                             transform: 'translateX(-50%)'
                           }}
                         >
                           {item.day}
                         </span>
                       ))}
                     </div>
                   </div>
                </div>
              </div>

              {/* Right Column - Recent Sessions + Notifications */}
              <div className="lg:col-span-2 space-y-4">
                {/* Recent Sessions */}
                <div className="bg-black/50 backdrop-blur-sm border border-indigo-500/30 rounded-lg sm:rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white font-space">Recent Sessions</h3>
                    <button className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium font-sans">
                      View All →
                    </button>
                  </div>
                
                  <div className="space-y-2">
                    {[
                      { name: 'Skeptical Sam', earned: '93', percent: 87, avatar: '/agents/sam.png', color: 'from-purple-500/30', time: '2h ago' },
                      { name: 'Too Expensive Tim', earned: '89', percent: 84, avatar: '/agents/tim.png', color: 'from-blue-500/30', time: '5h ago' },
                      { name: 'Think About It Tina', earned: '85', percent: 81, avatar: '/agents/tina.png', color: 'from-pink-500/30', time: '1d ago' }
                    ].map((session, index) => {
                      const circumference = 2 * Math.PI * 16
                      const strokeDashoffset = circumference - (session.percent / 100) * circumference
                      
                      return (
                        <div key={index} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/30 hover:bg-black/50 transition-colors border border-indigo-500/20">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="relative">
                              <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${session.color} to-transparent blur-md`}></div>
                              <img 
                                src={session.avatar}
                                alt={session.name}
                                className="relative w-8 h-8 rounded-full ring-2 ring-white/20 flex-shrink-0"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-white truncate font-sans">{session.name}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5 font-sans">{session.time}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="relative w-8 h-8">
                              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="16" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="3" fill="none" />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="16"
                                  stroke={getColor(session.percent)}
                                  strokeWidth="3"
                                  strokeDasharray={circumference}
                                  strokeDashoffset={strokeDashoffset}
                                  strokeLinecap="round"
                                  fill="none"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[9px] font-bold text-white font-space">{session.percent}%</span>
                              </div>
                            </div>
                            <div className="text-xs font-bold text-emerald-400 tabular-nums font-sans">+${session.earned}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-black/50 backdrop-blur-sm border border-indigo-500/30 rounded-lg sm:rounded-xl p-4">
                  <h3 className="text-sm font-bold text-white mb-2 font-space">Notifications</h3>
                
                  <div className="space-y-2">
                    {[
                      { 
                        type: 'manager', 
                        title: 'Message from Manager',
                        message: 'Great work this week! Objection handling improved.',
                        time: '2h ago',
                        icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z'
                      },
                      { 
                        type: 'leaderboard', 
                        title: 'New Leader!',
                        message: 'Sarah Chen took #1 with 892 points.',
                        time: '5h ago',
                        icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
                      },
                      { 
                        type: 'achievement', 
                        title: 'Achievement Unlocked',
                        message: 'Earned "Closer Pro" badge.',
                        time: '1d ago',
                        icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
                      }
                    ].map((notif, index) => {
                      const colorMap: Record<string, { bg: string; iconBg: string }> = {
                        manager: { bg: 'rgba(168, 85, 247, 0.2)', iconBg: 'rgba(168, 85, 247, 0.2)' },
                        leaderboard: { bg: 'rgba(16, 185, 129, 0.2)', iconBg: 'rgba(16, 185, 129, 0.2)' },
                        achievement: { bg: 'rgba(245, 158, 11, 0.2)', iconBg: 'rgba(245, 158, 11, 0.2)' }
                      }
                      const colors = colorMap[notif.type] || colorMap.manager
                      const iconColors: Record<string, string> = {
                        manager: '#a855f7',
                        leaderboard: '#10b981',
                        achievement: '#f59e0b'
                      }
                      const iconColor = iconColors[notif.type] || iconColors.manager
                      
                      return (
                        <div key={index} className="p-2 rounded-lg border border-indigo-500/20 transition-colors cursor-pointer bg-black/30 hover:bg-black/50">
                          <div className="flex items-start gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-500/20">
                              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={notif.icon} />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <h4 className="text-[11px] font-bold text-white font-space">{notif.title}</h4>
                                <span className="text-[9px] text-slate-400 font-medium font-sans">{notif.time}</span>
                              </div>
                              <p className="text-[10px] text-slate-200 leading-relaxed font-sans">{notif.message}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}

