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
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-space font-semibold tracking-tight text-gray-900">
                {organization.name}
              </h3>
              <p className="text-sm text-gray-600 font-sans capitalize">
                {organization.plan_tier || 'No plan'} Plan
              </p>
            </div>
          </div>
          {organization.stripe_subscription_id && (
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-space font-medium">
              Active
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1 font-sans">
              <Users className="w-4 h-4" />
              <span>Members</span>
            </div>
            <p className="text-lg font-space font-semibold tracking-tight text-gray-900">
              {organization.member_count || organization.seats_used}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1 font-sans">
              <CreditCard className="w-4 h-4" />
              <span>Monthly</span>
            </div>
            <p className="text-lg font-space font-semibold tracking-tight text-gray-900">
              ${monthlyCost.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 font-sans">Seat Usage</span>
            <span className="text-gray-900 font-space font-medium">
              {organization.seats_used}/{organization.seat_limit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                utilizationPct > 90 ? 'bg-red-500' : 
                utilizationPct > 80 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(utilizationPct, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-600 font-sans">
          <Calendar className="w-3 h-3" />
          <span>Created {format(new Date(organization.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>
    </Link>
  )
}

