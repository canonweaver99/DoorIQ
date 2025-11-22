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
      <div className="min-h-screen batcave-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 neon-glow"></div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen batcave-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4 font-mono">ORGANIZATION NOT FOUND</p>
          <Button 
            onClick={() => router.push('/admin/organizations')}
            className="neon-border bg-black text-cyan-neon hover:neon-border-glow border-cyan-500 font-mono uppercase"
          >
            BACK TO ORGANIZATIONS
          </Button>
        </div>
      </div>
    )
  }

  const monthlyCost = organization.seat_limit * 69

  return (
    <div className="min-h-screen batcave-bg p-6 relative scanlines">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/organizations')}
            className="mb-4 neon-border bg-black text-gray-400 hover:text-cyan-neon hover:border-cyan-500 font-mono uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK TO ORGANIZATIONS
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-cyan-500/20 neon-border rounded-lg">
                  <Building2 className="w-6 h-6 text-cyan-neon neon-text" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-cyan-neon neon-text font-mono tracking-wider">
                    {organization.name.toUpperCase()}
                  </h1>
                  <p className="text-gray-500 font-mono uppercase">{organization.plan_tier || 'No plan'} PLAN</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {organization.stripe_customer_id && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://dashboard.stripe.com/customers/${organization.stripe_customer_id}`, '_blank')}
                  className="neon-border bg-black text-gray-400 hover:text-cyan-neon hover:border-cyan-500 font-mono uppercase tracking-wider"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  VIEW IN STRIPE
                </Button>
              )}
              <Button 
                onClick={() => setSeatModalOpen(true)}
                className="neon-border-glow bg-black text-cyan-neon border-cyan-500 hover:neon-glow font-mono uppercase tracking-wider"
              >
                <Settings className="w-4 h-4 mr-2" />
                MANAGE SEATS
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="holographic-card neon-border rounded-lg p-6 hover:neon-border-glow transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-mono uppercase tracking-wider">MEMBERS</p>
              <Users className="w-5 h-5 text-blue-neon neon-text" />
            </div>
            <p className="text-3xl font-bold text-blue-neon neon-text data-display">{members.length}</p>
          </div>
          
          <div className="holographic-card neon-border rounded-lg p-6 hover:neon-border-glow transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-mono uppercase tracking-wider">SEATS USED</p>
              <Users className="w-5 h-5 text-cyan-neon neon-text" />
            </div>
            <p className="text-3xl font-bold text-cyan-neon neon-text data-display">
              {organization.seats_used}/{organization.seat_limit}
            </p>
          </div>
          
          <div className="holographic-card neon-border rounded-lg p-6 hover:neon-border-glow transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-mono uppercase tracking-wider">MONTHLY BILLING</p>
              <CreditCard className="w-5 h-5 text-cyan-neon neon-text" />
            </div>
            <p className="text-3xl font-bold text-cyan-neon neon-text data-display">${monthlyCost.toLocaleString()}</p>
          </div>
          
          <div className="holographic-card neon-border rounded-lg p-6 hover:neon-border-glow transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-xs font-mono uppercase tracking-wider">CREATED</p>
              <Calendar className="w-5 h-5 text-cyan-neon neon-text" />
            </div>
            <p className="text-lg font-bold text-white font-mono">
              {format(new Date(organization.created_at), 'MMM d, yyyy').toUpperCase()}
            </p>
          </div>
        </div>

        {/* Seat Manager */}
        <div className="mb-8">
          <SeatManager organization={organization} />
        </div>

        {/* Members Section */}
        <div className="holographic-card neon-border rounded-lg mb-8">
          <div className="p-6 border-b neon-border">
            <h2 className="text-xl font-semibold text-cyan-neon neon-text font-mono uppercase tracking-wider">
              MEMBERS ({members.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b neon-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono tracking-wider">NAME</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono tracking-wider">EMAIL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono tracking-wider">ROLE</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono tracking-wider">JOINED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-black/30 transition-colors border-b neon-border">
                    <td className="px-6 py-4 text-sm text-white font-mono">{member.full_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-neon border border-cyan-500/50 uppercase font-mono neon-border">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                      {format(new Date(member.created_at), 'MMM d, yyyy').toUpperCase()}
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-mono">
                      NO MEMBERS FOUND
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div className="holographic-card neon-border rounded-lg">
            <div className="p-6 border-b neon-border">
              <h2 className="text-xl font-semibold text-cyan-neon neon-text font-mono uppercase tracking-wider">
                PENDING INVITATIONS ({invitations.length})
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {invitations.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-4 batcave-bg-tertiary neon-border rounded-lg hover:neon-border-glow transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-white font-mono">{invite.email}</span>
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 uppercase font-mono neon-border">
                          {invite.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 font-mono">
                        EXPIRES {format(new Date(invite.expires_at), 'MMM d, yyyy').toUpperCase()}
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

