'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Calendar } from 'lucide-react'
import PerformanceChart from '../PerformanceChart'
import InsightsPanel from '../InsightsPanel'
import SessionsTable from '../SessionsTable'
import { PerformanceData, Insight, Session } from './types'

interface PerformanceTabProps {
  performanceData: PerformanceData[]
  insights: Insight[]
  sessions: Session[]
}

export default function PerformanceTab({ performanceData, insights, sessions }: PerformanceTabProps) {
  const [dateRange, setDateRange] = useState('7days')

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
        <PerformanceChart data={performanceData} />
      </motion.div>

      {/* Detailed Metrics Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
      >
        <h3 className="text-lg font-semibold text-white mb-6">Average Scores by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Overall', value: 80, color: 'text-purple-400' },
            { label: 'Rapport', value: 83, color: 'text-cyan-400' },
            { label: 'Discovery', value: 78, color: 'text-green-400' },
            { label: 'Objections', value: 76, color: 'text-amber-400' },
            { label: 'Closing', value: 82, color: 'text-pink-400' },
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

      {/* Detailed Session Analytics Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <SessionsTable sessions={sessions} />
      </motion.div>
    </motion.div>
  )
}

