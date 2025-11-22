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
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Organization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Seats Used
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Monthly Billing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {organizations.map((org) => {
              const utilizationPct = org.seat_limit > 0 
                ? (org.seats_used / org.seat_limit) * 100 
                : 0
              const monthlyCost = org.seat_limit * 69

              return (
                <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-3">
                        <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {org.name}
                        </div>
                        {org.stripe_subscription_id && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Active Subscription
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 capitalize">
                      {org.plan_tier || 'None'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                      <Users className="w-4 h-4 mr-1 text-gray-400" />
                      {org.member_count || org.seats_used}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            utilizationPct > 90 ? 'bg-red-500' : 
                            utilizationPct > 80 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {org.seats_used}/{org.seat_limit}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900 dark:text-white">
                      <CreditCard className="w-4 h-4 mr-1 text-gray-400" />
                      ${monthlyCost.toLocaleString()}/mo
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {format(new Date(org.created_at), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center gap-1"
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
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No organizations found</p>
          </div>
        )}
      </div>
    </div>
  )
}

