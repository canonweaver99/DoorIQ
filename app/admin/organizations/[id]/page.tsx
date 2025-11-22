'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Building2, Users, CreditCard, Calendar, Mail, 
  ArrowLeft, Settings, ExternalLink, UserPlus 
} from 'lucide-react'
import { format } from 'date-fns'
import { SeatManager } from '@/components/admin/SeatManager'
import { SeatUpgradeModal } from '@/components/admin/SeatUpgradeModal'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  plan_tier: string | null
  seat_limit: number
  seats_used: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

interface Member {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
  sessions_count?: number
}

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expires_at: string
  created_at: string
}

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [seatModalOpen, setSeatModalOpen] = useState(false)

  useEffect(() => {
    fetchOrganizationDetails()
  }, [orgId])

  const fetchOrganizationDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch organization')
      }

      setOrganization(data.organization)
      setMembers(data.members || [])
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error('Error fetching organization:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSeats = async (newSeatLimit: number) => {
    const response = await fetch(`/api/admin/organizations/${orgId}/seats`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seat_limit: newSeatLimit })
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to update seats')
    }

    const data = await response.json()
    setOrganization(data.organization)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Organization not found</p>
          <Button onClick={() => router.push('/admin/organizations')}>
            Back to Organizations
          </Button>
        </div>
      </div>
    )
  }

  const monthlyCost = organization.seat_limit * 69

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/organizations')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizations
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">{organization.name}</h1>
                  <p className="text-slate-400 capitalize">{organization.plan_tier || 'No plan'} Plan</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {organization.stripe_customer_id && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://dashboard.stripe.com/customers/${organization.stripe_customer_id}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View in Stripe
                </Button>
              )}
              <Button onClick={() => setSeatModalOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Manage Seats
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm">Members</p>
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">{members.length}</p>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm">Seats Used</p>
              <Users className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white">
              {organization.seats_used}/{organization.seat_limit}
            </p>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm">Monthly Billing</p>
              <CreditCard className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-white">${monthlyCost.toLocaleString()}</p>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm">Created</p>
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-lg font-bold text-white">
              {format(new Date(organization.created_at), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Seat Manager */}
        <div className="mb-8">
          <SeatManager organization={organization} />
        </div>

        {/* Members Section */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 mb-8">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-semibold text-white">Members ({members.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 text-sm text-white">{member.full_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 capitalize">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {format(new Date(member.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      No members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="bg-slate-900/50 rounded-xl border border-slate-800">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-semibold text-white">Pending Invitations ({invitations.length})</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {invitations.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-white">{invite.email}</span>
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 capitalize">
                          {invite.role}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        Expires {format(new Date(invite.expires_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Seat Upgrade Modal */}
        <SeatUpgradeModal
          open={seatModalOpen}
          onOpenChange={setSeatModalOpen}
          organization={organization}
          onUpdate={handleUpdateSeats}
        />
      </div>
    </div>
  )
}

