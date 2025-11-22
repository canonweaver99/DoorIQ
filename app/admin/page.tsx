'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { 
  Building2, Users, CreditCard, Activity, ArrowRight, 
  TrendingUp, Target, DollarSign, BarChart3, Eye
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  users: {
    total: number
    active: number
    bySubscription: {
      active: number
      trialing: number
      canceled: number
      past_due: number
      unpaid: number
      null: number
    }
    dailyChange?: number
    activeDailyChange?: number
  }
  credits: {
    used: number
    available: number
    limit: number
  }
  sessions: {
    total: number
    avgOverallScore: number
    avgRapportScore: number
    avgObjectionScore: number
    successRate: number
    closeRate: number
    salesClosed: number
    dailyChange?: number
    successRateDailyChange?: number
    salesClosedDailyChange?: number
  }
  organizations: {
    total: number
    activeSubscriptions: number
    totalSeats: number
    dailyChange?: number
    activeSubscriptionsDailyChange?: number
  }
  revenue: {
    monthly: number
    annual: number
    dailyChange?: number
  }
  websiteViews?: {
    total: number
    thisMonth: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats')
      }

      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4 font-sans">Failed to load dashboard statistics</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-sans font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-space font-bold tracking-tight text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 font-sans leading-relaxed">Overview of all organizations and system metrics</p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            icon={<Users className="w-6 h-6 text-blue-600" />}
            trend={`${stats.users.active} active users`}
            dailyChange={stats.users.dailyChange}
            bgColor="bg-blue-50"
            iconBg="bg-blue-100"
          />
          <StatCard
            title="Organizations"
            value={stats.organizations.total}
            icon={<Building2 className="w-6 h-6 text-purple-600" />}
            trend={`${stats.organizations.activeSubscriptions} active subscriptions`}
            dailyChange={stats.organizations.dailyChange}
            bgColor="bg-purple-50"
            iconBg="bg-purple-100"
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${stats.revenue.monthly.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6 text-green-600" />}
            trend={`$${stats.revenue.annual.toLocaleString()} annually`}
            dailyChange={stats.revenue.dailyChange}
            bgColor="bg-green-50"
            iconBg="bg-green-100"
          />
          <StatCard
            title="Total Sessions"
            value={stats.sessions.total}
            icon={<Activity className="w-6 h-6 text-orange-600" />}
            trend={`${stats.sessions.successRate}% success rate`}
            dailyChange={stats.sessions.dailyChange}
            bgColor="bg-orange-50"
            iconBg="bg-orange-100"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Website Views"
            value={stats.websiteViews?.total || 0}
            icon={<Eye className="w-5 h-5 text-blue-600" />}
            trend={`${stats.websiteViews?.thisMonth || 0} this month`}
            bgColor="bg-white"
            iconBg="bg-blue-100"
            size="small"
          />
          <StatCard
            title="Avg Session Score"
            value={stats.sessions.avgOverallScore}
            icon={<Target className="w-5 h-5 text-indigo-600" />}
            trend={`${stats.sessions.avgRapportScore} rapport avg`}
            dailyChange={stats.sessions.successRateDailyChange ? Math.round(stats.sessions.successRateDailyChange) : undefined}
            bgColor="bg-white"
            iconBg="bg-indigo-100"
            size="small"
          />
          <StatCard
            title="Sales Closed"
            value={stats.sessions.salesClosed}
            icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            trend={`${stats.sessions.closeRate}% close rate`}
            dailyChange={stats.sessions.salesClosedDailyChange}
            bgColor="bg-white"
            iconBg="bg-emerald-100"
            size="small"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="text-xl font-space font-semibold tracking-tight text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/organizations">
              <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-900 font-space font-medium mb-1 group-hover:text-purple-600 transition-colors">View Organizations</h3>
                    <p className="text-sm text-gray-600 font-sans">Manage all organizations</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </div>
            </Link>
            
            <Link href="/admin/sales-leads">
              <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-900 font-space font-medium mb-1 group-hover:text-purple-600 transition-colors">Sales Leads</h3>
                    <p className="text-sm text-gray-600 font-sans">View and manage leads</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </div>
            </Link>
            
            <Link href="/admin/sessions">
              <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-gray-900 font-space font-medium mb-1 group-hover:text-purple-600 transition-colors">Training Sessions</h3>
                    <p className="text-sm text-gray-600 font-sans">View all sessions</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon, 
  trend,
  dailyChange,
  bgColor = "bg-white",
  iconBg = "bg-gray-100",
  size = "normal"
}: { 
  title: string
  value: string | number
  icon: React.ReactNode
  trend: string
  dailyChange?: number
  bgColor?: string
  iconBg?: string
  size?: "normal" | "small"
}) {
  const formatChange = (change: number | undefined) => {
    if (change === undefined || change === 0) return null
    const isPositive = change > 0
    const sign = isPositive ? '+' : ''
    return { value: `${sign}${change}`, isPositive }
  }
  
  const change = formatChange(dailyChange)
  
  return (
    <div className={`${bgColor} rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-600 text-sm font-space font-medium">{title}</span>
        <div className={`${iconBg} p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <p className={`${size === "normal" ? "text-3xl" : "text-2xl"} font-space font-bold tracking-tight text-gray-900`}>{value}</p>
        {change && (
          <span className={`text-sm font-space font-semibold ${
            change.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {change.value}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-500 font-sans">
        {trend}
      </p>
    </div>
  )
}
