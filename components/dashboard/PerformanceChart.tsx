'use client'

import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useState } from 'react'
import { Activity } from 'lucide-react'

interface PerformanceChartProps {
  data: Array<{
    date: string
    overall: number
    rapport: number
    discovery: number
    objections: number
    closing: number
  }>
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const [activeMetrics, setActiveMetrics] = useState({
    overall: true,
    rapport: true,
    discovery: true,
    objections: true,
    closing: true,
  })

  const metrics = [
    { key: 'overall', color: '#8B5CF6', label: 'Overall' },
    { key: 'rapport', color: '#06B6D4', label: 'Rapport' },
    { key: 'discovery', color: '#10B981', label: 'Discovery' },
    { key: 'objections', color: '#F59E0B', label: 'Objections' },
    { key: 'closing', color: '#EC4899', label: 'Closing' },
  ]

  const toggleMetric = (key: string) => {
    setActiveMetrics(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Activity className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Performance Trend</h3>
            <p className="text-xs text-slate-400">Last 7 days</p>
          </div>
        </div>
      </div>

      {/* Metric Toggle Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {metrics.map(metric => (
          <button
            key={metric.key}
            onClick={() => toggleMetric(metric.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              activeMetrics[metric.key as keyof typeof activeMetrics]
                ? 'bg-white/10 border border-white/20 text-white'
                : 'bg-white/5 border border-white/5 text-slate-400'
            }`}
            style={{
              borderColor: activeMetrics[metric.key as keyof typeof activeMetrics] ? metric.color : undefined,
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: metric.color }}
            />
            {metric.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <defs>
              {metrics.map(metric => (
                <linearGradient key={metric.key} id={`gradient-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metric.color} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={metric.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e1e30',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '12px',
              }}
              labelStyle={{ color: '#fff', marginBottom: '8px' }}
              itemStyle={{ color: '#94a3b8' }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            {metrics.map(metric => (
              activeMetrics[metric.key as keyof typeof activeMetrics] && (
                <Line
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  stroke={metric.color}
                  strokeWidth={2}
                  dot={{ fill: metric.color, r: 4 }}
                  activeDot={{ r: 6, fill: metric.color }}
                  name={metric.label}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

