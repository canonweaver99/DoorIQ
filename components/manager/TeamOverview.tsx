'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, Target, Mail, Calendar, Trophy, Download, Activity, DollarSign, UserPlus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface TeamStats {
  totalReps: number
  activeNow: number
  teamAverage: number
  totalEarned: number
  topPerformers: Array<{
    id: string
    name: string
    email: string
    score: number
    sessionCount: number
    earnings: number
  }>
}

interface RevenueDataPoint {
  period: string
  fullPeriod: string
  revenue: number
  repsWhoSold: number
  totalSales: number
}

export default function TeamOverview() {
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month'>('month')
  const [stats, setStats] = useState<TeamStats>({
    totalReps: 0,
    activeNow: 0,
    teamAverage: 0,
    totalEarned: 0,
    topPerformers: []
  })
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [exportingPDF, setExportingPDF] = useState(false)

  // Fetch team stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/team/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching team stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Fetch revenue data when time period changes
  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const response = await fetch(`/api/team/revenue?period=${timePeriod}`)
        if (response.ok) {
          const data = await response.json()
          setRevenueData(data.revenueData || [])
        }
      } catch (error) {
        console.error('Error fetching revenue data:', error)
      }
    }

    fetchRevenueData()
  }, [timePeriod])

  const exportToPDF = async () => {
    setExportingPDF(true)
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Add header
      pdf.setFontSize(20)
      pdf.setTextColor(139, 92, 246) // Purple
      pdf.text('DoorIQ Team Performance Report', 20, 25)
      
      pdf.setFontSize(12)
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 35)
      
      let yPosition = 50
      
      // Add team stats
      pdf.setFontSize(16)
      pdf.setTextColor(0, 0, 0)
      pdf.text('Team Statistics', 20, yPosition)
      yPosition += 15
      
      pdf.setFontSize(11)
      pdf.text(`Total Earned: $${stats.totalEarned.toLocaleString()}`, 20, yPosition)
      yPosition += 8
      pdf.text(`Team Average: ${stats.teamAverage}%`, 20, yPosition)
      yPosition += 8
      pdf.text(`Total Reps: ${stats.totalReps}`, 20, yPosition)
      yPosition += 8
      pdf.text(`Currently Active: ${stats.activeNow}`, 20, yPosition)
      yPosition += 20
      
      // Add top performers
      if (stats.topPerformers.length > 0) {
        pdf.setFontSize(16)
        pdf.setTextColor(0, 0, 0)
        pdf.text('Top Performers (Last 30 Days)', 20, yPosition)
        yPosition += 15
        
        stats.topPerformers.forEach((performer, index) => {
          pdf.setFontSize(11)
          pdf.text(`${index + 1}. ${performer.name}`, 20, yPosition)
          pdf.text(`${performer.score}%`, 100, yPosition)
          pdf.text(`${performer.sessionCount} sessions`, 140, yPosition)
          yPosition += 8
        })
        yPosition += 20
      }
      
      // Add revenue data summary
      if (revenueData.length > 0) {
        pdf.setFontSize(16)
        pdf.text('Revenue Summary', 20, yPosition)
        yPosition += 15
        
        const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0)
        const totalSales = revenueData.reduce((sum, d) => sum + d.totalSales, 0)
        
        pdf.setFontSize(11)
        pdf.text(`Period: ${timePeriod}`, 20, yPosition)
        yPosition += 8
        pdf.text(`Total Revenue: $${totalRevenue.toLocaleString()}`, 20, yPosition)
        yPosition += 8
        pdf.text(`Total Sales: ${totalSales}`, 20, yPosition)
        yPosition += 8
        pdf.text(`Avg Revenue per Sale: $${totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0}`, 20, yPosition)
      }
      
      // Footer
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text('DoorIQ - AI-Powered Sales Training Platform', 20, 280)
      
      pdf.save(`dooriq-team-report-${new Date().toISOString().split('T')[0]}.pdf`)
      
    } catch (error) {
      console.error('PDF export error:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setExportingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* TOP METRICS ROW - 4 Minimal Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="metric-card"
        >
          <DollarSign className="w-4 h-4 text-slate-400 mb-4" />
          <p className="metric-value">${stats.totalEarned.toLocaleString()}</p>
          <p className="metric-label">Total Earned</p>
          <p className="metric-change text-slate-400">Virtual earnings from training</p>
        </motion.div>

        {/* Team Average */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="metric-card"
        >
          <Target className="w-4 h-4 text-slate-400 mb-4" />
          <p className="metric-value">{stats.teamAverage}%</p>
          <p className="metric-label">Team Average</p>
          <p className="metric-change text-slate-400">Average performance score</p>
        </motion.div>

        {/* Total Reps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="metric-card"
        >
          <Users className="w-4 h-4 text-slate-400 mb-4" />
          <p className="metric-value">{stats.totalReps}</p>
          <p className="metric-label">Total Reps</p>
          <p className="metric-change text-slate-400">Team members</p>
        </motion.div>

        {/* Active Now */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="metric-card"
        >
          <Activity className="w-4 h-4 text-green-400 mb-4" />
          <p className="metric-value">{stats.activeNow}</p>
          <p className="metric-label">Active Now</p>
          <p className="metric-change text-slate-400">Active in last hour</p>
        </motion.div>
      </div>

      {/* MAIN CONTENT AREA - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN - Team Performance Chart (60% / 3 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-3 performance-chart"
        >
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Team Performance</h3>
              <p className="text-sm text-slate-400 mt-1">Total team revenue over time</p>
            </div>
            
            {/* Time Period Toggle */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
              <button
                onClick={() => setTimePeriod('day')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  timePeriod === 'day'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTimePeriod('week')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  timePeriod === 'week'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimePeriod('month')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  timePeriod === 'month'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenueData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="period" 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  angle={timePeriod === 'week' ? -15 : 0}
                  textAnchor={timePeriod === 'week' ? 'end' : 'middle'}
                  height={timePeriod === 'week' ? 50 : 30}
                />
                <YAxis 
                  stroke="#6B7280"
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-[#1e1e30]/95 border border-white/10 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                          <p className="text-white font-semibold mb-2">
                            {data.fullPeriod || data.period}
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm text-purple-300">
                              Revenue: <span className="font-bold text-white">${data.revenue.toLocaleString()}</span>
                            </p>
                            <p className="text-sm text-cyan-300">
                              Reps Who Sold: <span className="font-bold text-white">{data.repsWhoSold}</span>
                            </p>
                            <p className="text-sm text-green-300">
                              Total Sales: <span className="font-bold text-white">{data.totalSales}</span>
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#revenueGradient)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                  label={{
                    position: 'top',
                    fill: '#9CA3AF',
                    fontSize: 10,
                    formatter: (value: number) => value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value}`
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[350px] text-slate-400">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No revenue data available yet</p>
                <p className="text-sm mt-1">Start training sessions to see performance metrics</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* RIGHT COLUMN - Top Performers (40% / 2 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="lg:col-span-2 overview-card p-6"
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white">Top Performers</h3>
            <p className="text-sm text-slate-400 mt-1">Highest scoring reps (last 30 days)</p>
          </div>

          {stats.topPerformers.length > 0 ? (
            <>
              <ul className="top-performers space-y-0">
                {stats.topPerformers.map((performer, index) => (
                  <motion.li
                    key={performer.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
                    className="performer-item"
                  >
                    <div className="flex items-center flex-1 gap-3">
                      <span className="text-sm font-medium text-slate-500 w-6">{index + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/5">
                        {performer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{performer.name}</p>
                        <p className="text-xs text-slate-400">{performer.sessionCount} sessions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-white">{performer.score}%</span>
                    </div>
                  </motion.li>
                ))}
              </ul>

              <Link 
                href="/manager?tab=reps"
                className="block w-full mt-6 py-2 text-sm text-center text-slate-400 hover:text-white transition-colors"
              >
                View All Reps →
              </Link>
            </>
          ) : (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No performance data yet</p>
                <p className="text-sm mt-1">Team members need to complete training sessions</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* BOTTOM ROW - Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className="quick-actions"
      >
        <Link href="/manager?tab=messages" className="action-card">
          <Mail className="w-5 h-5 text-slate-400 mb-3 mx-auto" />
          <p className="text-sm font-medium text-white">Send Team Message</p>
        </Link>

        <Link href="/team/invite" className="action-card">
          <UserPlus className="w-5 h-5 text-slate-400 mb-3 mx-auto" />
          <p className="text-sm font-medium text-white">Invite Teammate</p>
        </Link>

        <Link href="/manager?tab=analytics" className="action-card">
          <Trophy className="w-5 h-5 text-slate-400 mb-3 mx-auto" />
          <p className="text-sm font-medium text-white">View Analytics</p>
        </Link>

        <button 
          onClick={exportToPDF}
          disabled={exportingPDF}
          className="action-card"
        >
          {exportingPDF ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-slate-400 border-t-purple-400 rounded-full mb-3 mx-auto"
            />
          ) : (
            <Download className="w-5 h-5 text-slate-400 mb-3 mx-auto" />
          )}
          <p className="text-sm font-medium text-white">
            {exportingPDF ? 'Exporting...' : 'Export Report'}
          </p>
        </button>
      </motion.div>
    </div>
  )
}
