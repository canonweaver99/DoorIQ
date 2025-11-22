'use client'

import Link from 'next/link'
import { Building2, Users, CreditCard, Calendar, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

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
  return (
    <div className="holographic-card neon-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b neon-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">
                Organization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">
                Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">
                Seats Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">
                Monthly Billing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {organizations.map((org) => {
              const utilizationPct = org.seat_limit > 0 
                ? (org.seats_used / org.seat_limit) * 100 
                : 0
              const monthlyCost = org.seat_limit * 69

              return (
                <tr key={org.id} className="hover:bg-black/30 transition-colors border-b neon-border">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-cyan-500/20 neon-border rounded-lg mr-3">
                        <Building2 className="w-4 h-4 text-cyan-neon" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white font-mono">
                          {org.name}
                        </div>
                        {org.stripe_subscription_id && (
                          <span className="text-xs text-green-400 font-mono">
                            ACTIVE SUBSCRIPTION
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-neon border border-cyan-500/50 font-mono uppercase neon-border">
                      {(org.plan_tier || 'None').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-white font-mono">
                      <Users className="w-4 h-4 mr-1 text-gray-500" />
                      {org.member_count || org.seats_used}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-800 neon-border rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            utilizationPct > 90 ? 'bg-red-500' : 
                            utilizationPct > 80 ? 'bg-yellow-500' : 
                            'bg-cyan-500'
                          }`}
                          style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-white font-mono">
                        {org.seats_used}/{org.seat_limit}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-white font-mono">
                      <CreditCard className="w-4 h-4 mr-1 text-gray-500" />
                      ${monthlyCost.toLocaleString()}/mo
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(org.created_at), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="text-cyan-neon hover:text-cyan-400 flex items-center gap-1 font-mono transition-colors"
                    >
                      VIEW DETAILS
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
            <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 font-mono">NO ORGANIZATIONS FOUND</p>
          </div>
        )}
      </div>
    </div>
  )
}

