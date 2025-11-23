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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#a0a0a0] mb-4 font-sans">Failed to load dashboard statistics</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors font-sans font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-space font-bold tracking-tight text-white mb-2">Admin Dashboard</h1>
          <p className="text-[#a0a0a0] font-sans leading-relaxed">Overview of all organizations and system metrics</p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            icon={<Users className="w-6 h-6 text-blue-400" />}
            trend={`${stats.users.active} active users`}
            dailyChange={stats.users.dailyChange}
            bgColor="bg-blue-50"
            iconBg="bg-blue-100"
          />
          <StatCard
            title="Organizations"
            value={stats.organizations.total}
            icon={<Building2 className="w-6 h-6 text-purple-400" />}
            trend={`${stats.organizations.activeSubscriptions} active subscriptions`}
            dailyChange={stats.organizations.dailyChange}
            bgColor="bg-purple-50"
            iconBg="bg-purple-100"
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${stats.revenue.monthly.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6 text-green-400" />}
            trend={`$${stats.revenue.annual.toLocaleString()} annually`}
            dailyChange={stats.revenue.dailyChange}
            bgColor="bg-green-50"
            iconBg="bg-green-100"
          />
          <StatCard
            title="Total Sessions"
            value={stats.sessions.total}
            icon={<Activity className="w-6 h-6 text-orange-400" />}
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
            icon={<Eye className="w-5 h-5 text-blue-400" />}
            trend={`${stats.websiteViews?.thisMonth || 0} this month`}
            bgColor="bg-white"
            iconBg="bg-blue-100"
            size="small"
          />
          <StatCard
            title="Avg Session Score"
            value={stats.sessions.avgOverallScore}
            icon={<Target className="w-5 h-5 text-indigo-400" />}
            trend={`${stats.sessions.avgRapportScore} rapport avg`}
            dailyChange={stats.sessions.successRateDailyChange ? Math.round(stats.sessions.successRateDailyChange) : undefined}
            bgColor="bg-white"
            iconBg="bg-indigo-100"
            size="small"
          />
          <StatCard
            title="Sales Closed"
            value={stats.sessions.salesClosed}
            icon={<TrendingUp className="w-5 h-5 text-emerald-400" />}
            trend={`${stats.sessions.closeRate}% close rate`}
            dailyChange={stats.sessions.salesClosedDailyChange}
            bgColor="bg-white"
            iconBg="bg-emerald-100"
            size="small"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] shadow-sm p-6 mb-8">
          <h2 className="text-xl font-space font-semibold tracking-tight text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/organizations">
              <div className="p-5 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-space font-medium mb-1 group-hover:text-purple-400 transition-colors">View Organizations</h3>
                    <p className="text-sm text-[#a0a0a0] font-sans">Manage all organizations</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#666] group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
            </Link>
            
            <Link href="/admin/sales-leads">
              <div className="p-5 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-space font-medium mb-1 group-hover:text-purple-400 transition-colors">Sales Leads</h3>
                    <p className="text-sm text-[#a0a0a0] font-sans">View and manage leads</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#666] group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
            </Link>
            
            <Link href="/admin/sessions">
              <div className="p-5 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-space font-medium mb-1 group-hover:text-purple-400 transition-colors">Training Sessions</h3>
                    <p className="text-sm text-[#a0a0a0] font-sans">View all sessions</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#666] group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
            </Link>

            <Link href="/pricing">
              <div className="p-5 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-space font-medium mb-1 group-hover:text-purple-400 transition-colors">Pricing</h3>
                    <p className="text-sm text-[#a0a0a0] font-sans">View pricing plans</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#666] group-hover:text-purple-400 transition-colors" />
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
    if (change === undefined || change === null || isNaN(change) || change === 0) return null
    const isPositive = change > 0
    const sign = isPositive ? '+' : ''
    return { value: `${sign}${change}`, isPositive }
  }
  
  const change = formatChange(dailyChange)
  
  // Ensure value is always a valid string or number
  const displayValue = value ?? 0
  
  // Map light colors to dark theme equivalents
  const darkBgColor = bgColor.includes('white') || bgColor.includes('gray-50') 
    ? 'bg-[#1a1a1a]' 
    : bgColor.includes('blue') 
      ? 'bg-blue-500/10' 
      : bgColor.includes('purple')
        ? 'bg-purple-500/10'
        : bgColor.includes('green')
          ? 'bg-green-500/10'
          : bgColor.includes('orange')
            ? 'bg-orange-500/10'
            : 'bg-[#1a1a1a]'
  
  const darkIconBg = iconBg.includes('blue')
    ? 'bg-blue-500/20'
    : iconBg.includes('purple')
      ? 'bg-purple-500/20'
      : iconBg.includes('green')
        ? 'bg-green-500/20'
        : iconBg.includes('orange')
          ? 'bg-orange-500/20'
          : iconBg.includes('indigo')
            ? 'bg-indigo-500/20'
            : iconBg.includes('emerald')
              ? 'bg-emerald-500/20'
              : 'bg-[#2a2a2a]'

  return (
    <div className={`${darkBgColor} rounded-xl p-6 border border-[#2a2a2a] shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#a0a0a0] text-sm font-space font-medium">{title}</span>
        <div className={`${darkIconBg} p-2 rounded-lg`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2 mb-1">
        <p className={`${size === "normal" ? "text-3xl" : "text-2xl"} font-space font-bold tracking-tight text-white`}>{displayValue}</p>
        {change && (
          <span className={`text-sm font-space font-semibold ${
            change.isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {change.value}
          </span>
        )}
      </div>
      <p className="text-sm text-[#a0a0a0] font-sans">
        {trend}
      </p>
    </div>
  )
}
