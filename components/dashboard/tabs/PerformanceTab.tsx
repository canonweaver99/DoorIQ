'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import PerformanceChart from '../PerformanceChart'
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
  const [realAverages, setRealAverages] = useState({
    overall: 0,
    rapport: 0,
    discovery: 0,
    objections: 0,
    closing: 0
  })
  const [realPerformanceData, setRealPerformanceData] = useState(performanceData)
  
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
    
    // Fetch sessions in range
    const { data: sessionsData } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
    
    if (!sessionsData || sessionsData.length === 0) {
      setRealPerformanceData(performanceData)
      return
    }
    
    // Calculate averages
    const avg = {
      overall: Math.round(sessionsData.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessionsData.length),
      rapport: Math.round(sessionsData.reduce((sum, s) => sum + (s.rapport_score || 0), 0) / sessionsData.length),
      discovery: Math.round(sessionsData.reduce((sum, s) => sum + (s.discovery_score || 0), 0) / sessionsData.length),
      objections: Math.round(sessionsData.reduce((sum, s) => sum + (s.objection_handling_score || 0), 0) / sessionsData.length),
      closing: Math.round(sessionsData.reduce((sum, s) => sum + (s.close_score || 0), 0) / sessionsData.length)
    }
    
    setRealAverages(avg)
    
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Date Range Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex items-center justify-end gap-2 mb-4"
      >
        <Calendar className="w-4 h-4 text-slate-400" />
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-[#1e1e30] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="all">All Time</option>
        </select>
      </motion.div>

      {/* Enhanced Chart - Larger */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <PerformanceChart data={realPerformanceData} />
      </motion.div>

      {/* Detailed Metrics Summary - Real Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
      >
        <h3 className="text-lg font-semibold text-white mb-6">Average Scores by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Overall', value: realAverages.overall, color: 'text-purple-400' },
            { label: 'Rapport', value: realAverages.rapport, color: 'text-cyan-400' },
            { label: 'Discovery', value: realAverages.discovery, color: 'text-green-400' },
            { label: 'Objections', value: realAverages.objections, color: 'text-amber-400' },
            { label: 'Closing', value: realAverages.closing, color: 'text-pink-400' },
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
              className="text-center"
            >
              <p className="text-xs text-slate-400 mb-1">{metric.label}</p>
              <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}%</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Performance Insights - Full Version */}
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

