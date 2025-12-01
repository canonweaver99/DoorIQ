'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'

// Dynamically import recharts to reduce initial bundle size
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false })
const ReferenceLine = dynamic(() => import('recharts').then(mod => mod.ReferenceLine), { ssr: false })
const ReferenceArea = dynamic(() => import('recharts').then(mod => mod.ReferenceArea), { ssr: false })
const Label = dynamic(() => import('recharts').then(mod => mod.Label), { ssr: false })

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
  const [hoveredLine, setHoveredLine] = useState<string | null>(null)

  const metrics = [
    { key: 'overall', color: '#6366f1', label: 'Overall', strokeWidth: 3 },
    { key: 'rapport', color: '#10b981', label: 'Rapport', strokeWidth: 2 },
    { key: 'discovery', color: '#8b5cf6', label: 'Discovery', strokeWidth: 2 },
    { key: 'objections', color: '#f59e0b', label: 'Objections', strokeWidth: 2 },
    { key: 'closing', color: '#ec4899', label: 'Closing', strokeWidth: 2 },
  ]

  const toggleMetric = (key: string) => {
    setActiveMetrics(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Calculate analytics
  const teamAverage = 75
  const latestValues = data[data.length - 1] || {}
  const oldestValues = data[0] || {}
  const trend = latestValues.overall - oldestValues.overall
  const highestScore = Math.max(...data.map(d => d.overall))
  const lowestScore = Math.min(...data.map(d => d.overall))
  const bestCategory = metrics
    .filter(m => m.key !== 'overall')
    .reduce((best, curr) => {
      const currValue = latestValues[curr.key as keyof typeof latestValues] || 0
      const bestValue = latestValues[best.key as keyof typeof latestValues] || 0
      return currValue > bestValue ? curr : best
    })
  const worstCategory = metrics
    .filter(m => m.key !== 'overall')
    .reduce((worst, curr) => {
      const currValue = latestValues[curr.key as keyof typeof latestValues] || 0
      const worstValue = latestValues[worst.key as keyof typeof latestValues] || 0
      return currValue < worstValue ? curr : worst
    })

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

      {/* Enhanced Metric Toggle Buttons with Current Values */}
      <div className="flex flex-wrap gap-2 mb-6">
        {metrics.map(metric => {
          const currentValue = latestValues[metric.key as keyof typeof latestValues] || 0
          const isActive = activeMetrics[metric.key as keyof typeof activeMetrics]
          
          return (
            <button
              key={metric.key}
              onClick={() => toggleMetric(metric.key)}
              onMouseEnter={() => setHoveredLine(metric.key)}
              onMouseLeave={() => setHoveredLine(null)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 border-2 text-white shadow-lg'
                  : 'bg-white/5 border border-white/5 text-slate-400 hover:bg-white/8'
              } ${hoveredLine === metric.key ? 'scale-105' : ''}`}
              style={{
                borderColor: isActive ? metric.color : undefined,
                boxShadow: isActive ? `0 0 20px ${metric.color}40` : undefined
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: metric.color }}
                />
                <span className={isActive ? 'font-bold' : ''}>{metric.label}</span>
                {isActive && currentValue > 0 && (
                  <span className="ml-1 opacity-75">({currentValue}%)</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        {typeof window !== 'undefined' && (
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
              domain={[50, 100]}
              ticks={[50, 60, 70, 80, 90, 100]}
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
        )}
        {typeof window === 'undefined' && (
          <div className="h-full flex items-center justify-center text-slate-400">
            Loading chart...
          </div>
        )}
      </div>
    </motion.div>
  )
}

