'use client'

import Link from 'next/link'
import { Building2, Users, CreditCard, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface OrganizationCardProps {
  organization: {
    id: string
    name: string
    plan_tier: string | null
    seat_limit: number
    seats_used: number
    member_count?: number
    stripe_subscription_id: string | null
    created_at: string
  }
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  const utilizationPct = organization.seat_limit > 0 
    ? (organization.seats_used / organization.seat_limit) * 100 
    : 0
  
  const monthlyCost = organization.seat_limit * 69

  return (
    <Link href={`/admin/organizations/${organization.id}`}>
      <div className="holographic-card neon-border rounded-lg p-6 hover:neon-border-glow transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 neon-border rounded-lg group-hover:neon-border-glow transition-all">
              <Building2 className="w-5 h-5 text-cyan-neon" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white font-mono group-hover:text-cyan-neon transition-colors">
                {organization.name.toUpperCase()}
              </h3>
              <p className="text-sm text-gray-500 font-mono capitalize">
                {organization.plan_tier || 'No plan'} Plan
              </p>
            </div>
          </div>
          {organization.stripe_subscription_id && (
            <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/50 rounded-full font-mono uppercase neon-border">
              Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1 font-mono">
              <Users className="w-4 h-4" />
              <span>MEMBERS</span>
            </div>
            <p className="text-lg font-semibold text-cyan-neon data-display">
              {organization.member_count || organization.seats_used}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1 font-mono">
              <CreditCard className="w-4 h-4" />
              <span>MONTHLY</span>
            </div>
            <p className="text-lg font-semibold text-cyan-neon data-display">
              ${monthlyCost.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1 font-mono">
            <span className="text-gray-500">SEAT USAGE</span>
            <span className="text-white font-medium">
              {organization.seats_used}/{organization.seat_limit}
            </span>
          </div>
          <div className="w-full bg-gray-800 neon-border rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                utilizationPct > 90 ? 'bg-red-500' : 
                utilizationPct > 80 ? 'bg-yellow-500' : 
                'bg-cyan-500'
              }`}
              style={{ width: `${Math.min(utilizationPct, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
          <Calendar className="w-3 h-3" />
          <span>CREATED {format(new Date(organization.created_at), 'MMM d, yyyy').toUpperCase()}</span>
        </div>
      </div>
    </Link>
  )
}

