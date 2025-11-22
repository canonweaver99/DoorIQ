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
    <div className="min-h-screen batcave-bg p-6 relative scanlines">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-neon mb-2 font-mono tracking-wider">
            ORGANIZATIONS
          </h1>
          <p className="text-gray-500 font-mono text-sm">MANAGE ALL ORGANIZATIONS USING DOORIQ</p>
          <div className="mt-4 h-px w-32 bg-gradient-to-r from-cyan-500 to-transparent" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="holographic-card neon-border rounded-lg p-6 hover:neon-border-glow transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-mono uppercase tracking-wider">Total Organizations</p>
              <Building2 className="w-5 h-5 text-cyan-neon" />
            </div>
            <p className="text-3xl font-bold text-cyan-neon data-display">{organizations.length}</p>
          </div>
          
          <div className="holographic-card neon-border rounded-lg p-6 hover:neon-border-glow transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-mono uppercase tracking-wider">Total Members</p>
              <Users className="w-5 h-5 text-blue-neon" />
            </div>
            <p className="text-3xl font-bold text-blue-neon data-display">{totalMembers}</p>
          </div>
          
          <div className="holographic-card neon-border rounded-lg p-6 hover:neon-border-glow transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-mono uppercase tracking-wider">Active Subscriptions</p>
              <CreditCard className="w-5 h-5 text-cyan-neon" />
            </div>
            <p className="text-3xl font-bold text-cyan-neon data-display">{activeSubscriptions}</p>
          </div>
          
          <div className="holographic-card neon-border rounded-lg p-6 hover:neon-border-glow transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-mono uppercase tracking-wider">Monthly Revenue</p>
              <CreditCard className="w-5 h-5 text-cyan-neon" />
            </div>
            <p className="text-3xl font-bold text-cyan-neon data-display">${totalMonthlyRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 batcave-bg-tertiary neon-border rounded-lg text-white placeholder-gray-600 font-mono text-sm focus:outline-none focus:neon-border-glow transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="batcave-bg-tertiary neon-border text-white rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:neon-border-glow transition-all"
            >
              <option value="all">ALL PLANS</option>
              <option value="starter">STARTER</option>
              <option value="team">TEAM</option>
              <option value="enterprise">ENTERPRISE</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              onClick={() => setViewMode('table')}
              size="sm"
              className={viewMode === 'table' ? 'neon-border-glow bg-black text-cyan-neon border-cyan-500' : 'neon-border bg-black text-gray-400 border-gray-700 hover:text-cyan-neon hover:border-cyan-500'}
            >
              TABLE
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              size="sm"
              className={viewMode === 'grid' ? 'neon-border-glow bg-black text-cyan-neon border-cyan-500' : 'neon-border bg-black text-gray-400 border-gray-700 hover:text-cyan-neon hover:border-cyan-500'}
            >
              GRID
            </Button>
          </div>
        </div>

        {/* Organizations List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500/50"></div>
          </div>
        ) : viewMode === 'table' ? (
          <OrganizationTable organizations={filteredOrganizations} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((org) => (
              <OrganizationCard key={org.id} organization={org} />
            ))}
            {filteredOrganizations.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 font-mono">NO ORGANIZATIONS FOUND</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

