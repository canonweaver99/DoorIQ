'use client'

import { useEffect, useState } from 'react'
import { ActivityChartCard } from '@/components/ui/activity-chart-card'

interface WeeklySessionsData {
  weeklySessions: Array<{ day: string; value: number }>
  totalSessions: number
  previousWeekTotal: number
}

export default function WeeklySessionsChart() {
  const [data, setData] = useState<WeeklySessionsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWeeklySessions()
  }, [])

  const fetchWeeklySessions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/homepage/weekly-sessions')
      if (!response.ok) {
        throw new Error('Failed to fetch weekly sessions')
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching weekly sessions:', err)
      // Set default empty data on error
      setData({
        weeklySessions: [
          { day: "S", value: 0 },
          { day: "M", value: 0 },
          { day: "T", value: 0 },
          { day: "W", value: 0 },
          { day: "T", value: 0 },
          { day: "F", value: 0 },
          { day: "S", value: 0 },
        ],
        totalSessions: 0,
        previousWeekTotal: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-32 bg-white/10 rounded" />
      </div>
    )
  }

  if (!data) {
    return null
  }

  // Calculate percentage change
  const percentageChange = data.previousWeekTotal > 0
    ? Math.round(((data.totalSessions - data.previousWeekTotal) / data.previousWeekTotal) * 100)
    : data.totalSessions > 0 ? 100 : 0

  return (
    <ActivityChartCard
      title="Weekly Sessions"
      totalValue={`${data.totalSessions}`}
      data={data.weeklySessions}
      dropdownOptions={["Weekly", "Monthly", "Yearly"]}
      percentageChange={percentageChange}
      changeLabel="from last week"
    />
  )
}

