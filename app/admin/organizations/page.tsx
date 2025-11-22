'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Search, Filter, Users, CreditCard } from 'lucide-react'
import { OrganizationTable } from '@/components/admin/OrganizationTable'
import { OrganizationCard } from '@/components/admin/OrganizationCard'
import { Button } from '@/components/ui/button'

interface Organization {
  id: string
  name: string
  plan_tier: string | null
  seat_limit: number
  seats_used: number
  member_count?: number
  stripe_subscription_id: string | null
  created_at: string
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  useEffect(() => {
    fetchOrganizations()
  }, [planFilter])

  const fetchOrganizations = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/auth/login'
        return
      }

      // Build query params
      const params = new URLSearchParams()
      if (planFilter !== 'all') {
        params.set('plan_tier', planFilter)
      }
      if (search) {
        params.set('search', search)
      }

      const response = await fetch(`/api/admin/organizations?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch organizations')
      }

      setOrganizations(data.organizations || [])
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrganizations = organizations.filter(org => {
    if (search && !org.name.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    return true
  })

  const totalSeats = organizations.reduce((sum, org) => sum + org.seat_limit, 0)
  const totalMembers = organizations.reduce((sum, org) => sum + (org.member_count || org.seats_used), 0)
  const totalMonthlyRevenue = organizations.reduce((sum, org) => sum + (org.seat_limit * 69), 0)
  const activeSubscriptions = organizations.filter(org => org.stripe_subscription_id).length

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-space font-bold tracking-tight text-white mb-2">Organizations</h1>
          <p className="text-[#a0a0a0] font-sans leading-relaxed">Manage all organizations using DoorIQ</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#a0a0a0] text-sm font-space font-medium">Total Organizations</p>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-space font-bold tracking-tight text-white">{organizations.length}</p>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#a0a0a0] text-sm font-medium">Total Members</p>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{totalMembers}</p>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#a0a0a0] text-sm font-medium">Active Subscriptions</p>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{activeSubscriptions}</p>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#2a2a2a] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#a0a0a0] text-sm font-medium">Monthly Revenue</p>
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <CreditCard className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">${totalMonthlyRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666] w-4 h-4" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#a0a0a0]" />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="team">Team</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              onClick={() => setViewMode('table')}
              size="sm"
            >
              Table
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              size="sm"
            >
              Grid
            </Button>
          </div>
        </div>

        {/* Organizations List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
          </div>
        ) : viewMode === 'table' ? (
          <OrganizationTable organizations={filteredOrganizations} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((org) => (
              <OrganizationCard key={org.id} organization={org} />
            ))}
            {filteredOrganizations.length === 0 && (
              <div className="col-span-full text-center py-12 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
                <Building2 className="w-12 h-12 text-[#666] mx-auto mb-4" />
                <p className="text-[#a0a0a0]">No organizations found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

