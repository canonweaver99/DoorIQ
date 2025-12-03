'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart } from 'recharts'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

interface WeeklyDataPoint {
  date: string
  score: number
}

interface WeeklyPerformanceGraphProps {
  data: WeeklyDataPoint[]
}

export default function WeeklyPerformanceGraph({ data }: WeeklyPerformanceGraphProps) {
  // Check if we have any real data (non-zero scores)
  const hasRealData = data.some(point => point.score > 0)

  // Empty state with sample trajectory
  if (!hasRealData) {
    // Generate sample trajectory data (showing potential growth)
    const today = new Date()
    const sampleData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      // Simulate growth from 50 to 85 over 7 days
      const score = 50 + (35 * (7 - i) / 7)
      sampleData.push({
        date: format(date, 'MMM d'),
        score: Math.round(score)
      })
    }

    return (
      <div className="relative w-full h-64">
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400/20 rounded-full"
              initial={{
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%',
                opacity: 0.3,
              }}
              animate={{
                y: [null, Math.random() * 50 - 25],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 p-6 h-full flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <h3 className="text-white font-bold text-lg mb-2">Your Journey Starts Here</h3>
            <p className="text-white/70 text-sm mb-4">
              Even Michael Jordan practiced free throws 🏀
            </p>
          </motion.div>

          {/* Sample trajectory chart */}
          <div className="w-full h-40 opacity-50">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sampleData}>
                <defs>
                  <linearGradient id="sampleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.3)"
                  style={{ fontSize: '10px' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  stroke="rgba(255,255,255,0.3)"
                  style={{ fontSize: '10px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  fill="url(#sampleGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-purple-400 text-xs font-medium mt-2"
          >
            This could be you in 30 days
          </motion.p>
        </div>
      </div>
    )
  }

  // Format dates for display
  const formattedData = data.map(point => ({
    ...point,
    dateLabel: format(new Date(point.date), 'MMM d')
  }))

  // Ensure we have at least 7 data points (fill missing days with null)
  const last7Days: WeeklyDataPoint[] = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const existingPoint = data.find(d => d.date === dateStr)
    if (existingPoint) {
      last7Days.push(existingPoint)
    } else {
      last7Days.push({ date: dateStr, score: 0 })
    }
  }

  const chartData = last7Days.map(point => ({
    date: format(new Date(point.date), 'MMM d'),
    score: point.score || 0
  }))

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="date" 
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            domain={[0, 100]}
            stroke="rgba(255,255,255,0.5)"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#8b5cf6" 
            strokeWidth={2}
            fill="url(#performanceGradient)"
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

