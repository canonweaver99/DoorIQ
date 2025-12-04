'use client'

import Link from 'next/link'
import { Building2, Users, CreditCard, Calendar, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { useIsMobile } from '@/hooks/useIsMobile'
import { OrganizationCard } from './OrganizationCard'

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

interface OrganizationTableProps {
  organizations: Organization[]
}

export function OrganizationTable({ organizations }: OrganizationTableProps) {
  const isMobile = useIsMobile()

  // On mobile, show cards instead of table
  if (isMobile) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {organizations.map((org) => (
          <OrganizationCard key={org.id} organization={org} />
        ))}
        {organizations.length === 0 && (
          <div className="text-center py-12 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
            <Building2 className="w-12 h-12 text-[#666] mx-auto mb-4" />
            <p className="text-[#a0a0a0] font-sans">No organizations found</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-space font-medium text-[#a0a0a0] uppercase tracking-wider">
                Organization
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-space font-medium text-[#a0a0a0] uppercase tracking-wider">
                Plan
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-space font-medium text-[#a0a0a0] uppercase tracking-wider">
                Members
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-space font-medium text-[#a0a0a0] uppercase tracking-wider">
                Seats Used
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-space font-medium text-[#a0a0a0] uppercase tracking-wider">
                Monthly Billing
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-space font-medium text-[#a0a0a0] uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-space font-medium text-[#a0a0a0] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2a2a]">
            {organizations.map((org) => {
              const utilizationPct = org.seat_limit > 0 
                ? (org.seats_used / org.seat_limit) * 100 
                : 0
              const monthlyCost = org.seat_limit * 69

              return (
                <tr key={org.id} className="hover:bg-[#0a0a0a] transition-colors">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                        <Building2 className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm font-space font-medium text-white">
                          {org.name}
                        </div>
                        {org.stripe_subscription_id && (
                          <span className="text-xs text-green-400 font-space font-medium">
                            Active Subscription
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-space font-medium rounded-full bg-blue-500/20 text-blue-400 capitalize">
                      {org.plan_tier || 'None'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-white font-sans">
                      <Users className="w-4 h-4 mr-1 text-[#666]" />
                      {org.member_count || org.seats_used}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-[#2a2a2a] rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            utilizationPct > 90 ? 'bg-red-500' : 
                            utilizationPct > 80 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-white font-sans">
                        {org.seats_used}/{org.seat_limit}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-white font-sans">
                      <CreditCard className="w-4 h-4 mr-1 text-[#666]" />
                      ${monthlyCost.toLocaleString()}/mo
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-[#a0a0a0]">
                    <div className="flex items-center font-sans">
                      <Calendar className="w-4 h-4 mr-1 text-[#666]" />
                      {format(new Date(org.created_at), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-space font-medium min-h-[44px] items-center"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {organizations.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 text-[#666] mx-auto mb-4" />
            <p className="text-[#a0a0a0] font-sans">No organizations found</p>
          </div>
        )}
      </div>
    </div>
  )
}

