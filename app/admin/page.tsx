'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Building2, Users, CreditCard, Activity, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface OrganizationStats {
  total_organizations: number
  total_members: number
  total_seats: number
  active_subscriptions: number
  monthly_revenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<OrganizationStats>({
    total_organizations: 0,
    total_members: 0,
    total_seats: 0,
    active_subscriptions: 0,
    monthly_revenue: 0
  })
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/organizations')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats')
      }

      const organizations = data.organizations || []
      
      const totalSeats = organizations.reduce((sum: number, org: any) => sum + (org.seat_limit || 0), 0)
      const totalMembers = organizations.reduce((sum: number, org: any) => sum + (org.member_count || org.seats_used || 0), 0)
      const activeSubscriptions = organizations.filter((org: any) => org.stripe_subscription_id).length
      const monthlyRevenue = organizations.reduce((sum: number, org: any) => sum + ((org.seat_limit || 0) * 69), 0)

      setStats({
        total_organizations: organizations.length,
        total_members: totalMembers,
        total_seats: totalSeats,
        active_subscriptions: activeSubscriptions,
        monthly_revenue: monthlyRevenue
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen batcave-bg p-6 relative">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-neon mb-2 font-mono tracking-wider">
            SYSTEM DASHBOARD
          </h1>
          <p className="text-gray-300 font-mono text-sm">OVERVIEW OF ALL ORGANIZATIONS AND SYSTEM METRICS</p>
          <div className="mt-4 h-px w-32 bg-gradient-to-r from-cyan-500/50 to-transparent" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Organizations"
            value={stats.total_organizations}
            icon={<Building2 className="w-6 h-6 text-cyan-neon" />}
            trend="Active organizations"
          />
          <StatCard
            title="Total Members"
            value={stats.total_members}
            icon={<Users className="w-6 h-6 text-blue-neon" />}
            trend="Across all organizations"
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.active_subscriptions}
            icon={<CreditCard className="w-6 h-6 text-cyan-neon" />}
            trend="With Stripe billing"
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${stats.monthly_revenue.toLocaleString()}`}
            icon={<Activity className="w-6 h-6 text-cyan-neon" />}
            trend="Recurring revenue"
          />
        </div>

        {/* Quick Actions */}
        <div className="holographic-card neon-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-cyan-neon mb-4 font-mono tracking-wider">
            QUICK ACTIONS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/organizations">
              <div className="holographic-card neon-border p-4 rounded-lg hover:neon-border-glow transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1 group-hover:text-cyan-neon transition-colors font-mono text-sm">
                      VIEW ORGANIZATIONS
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">Manage all organizations</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-neon transition-all" />
                </div>
              </div>
            </Link>
            
            <Link href="/admin/sales-leads">
              <div className="holographic-card neon-border p-4 rounded-lg hover:neon-border-glow transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1 group-hover:text-cyan-neon transition-colors font-mono text-sm">
                      SALES LEADS
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">View and manage leads</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-neon transition-all" />
                </div>
              </div>
            </Link>
            
            <Link href="/admin/sessions">
              <div className="holographic-card neon-border p-4 rounded-lg hover:neon-border-glow transition-all cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1 group-hover:text-cyan-neon transition-colors font-mono text-sm">
                      TRAINING SESSIONS
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">View all sessions</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-neon transition-all" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500/50"></div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon, 
  trend
}: { 
  title: string
  value: string | number
  icon: React.ReactNode
  trend: string
}) {
  return (
    <div className="holographic-card neon-border rounded-lg p-6 hover:neon-border-glow transition-all group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-xs font-mono uppercase tracking-wider">{title}</span>
        <div className="transition-transform">
          {icon}
        </div>
      </div>
      <p className="text-4xl font-bold text-cyan-neon data-display mb-2">{value}</p>
      <p className="text-xs mt-1 text-gray-400 font-mono">
        {trend}
      </p>
      <div className="mt-3 h-px w-full bg-gradient-to-r from-cyan-500/30 via-transparent to-transparent" />
    </div>
  )
}
