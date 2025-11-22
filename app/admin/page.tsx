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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Overview of all organizations and system metrics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Organizations"
            value={stats.total_organizations}
            icon={<Building2 className="w-6 h-6 text-purple-400" />}
            trend="Active organizations"
          />
          <StatCard
            title="Total Members"
            value={stats.total_members}
            icon={<Users className="w-6 h-6 text-blue-400" />}
            trend="Across all organizations"
          />
          <StatCard
            title="Active Subscriptions"
            value={stats.active_subscriptions}
            icon={<CreditCard className="w-6 h-6 text-green-400" />}
            trend="With Stripe billing"
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${stats.monthly_revenue.toLocaleString()}`}
            icon={<Activity className="w-6 h-6 text-yellow-400" />}
            trend="Recurring revenue"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/organizations">
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-purple-500 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1">View Organizations</h3>
                    <p className="text-sm text-slate-400">Manage all organizations</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </Link>
            
            <Link href="/admin/sales-leads">
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-purple-500 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1">Sales Leads</h3>
                    <p className="text-sm text-slate-400">View and manage leads</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </Link>
            
            <Link href="/admin/sessions">
              <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-purple-500 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1">Training Sessions</h3>
                    <p className="text-sm text-slate-400">View all sessions</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </Link>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
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
    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{title}</span>
        {icon}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm mt-1 text-slate-400">
        {trend}
      </p>
    </div>
  )
}
