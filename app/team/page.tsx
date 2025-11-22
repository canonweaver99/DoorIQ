'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Settings, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SeatManager } from '@/components/team/SeatManager'
import { MemberList } from '@/components/team/MemberList'
import { PendingInvites } from '@/components/team/PendingInvites'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Member {
  id: string
  email: string
  full_name: string | null
  role: 'rep' | 'manager' | 'admin'
  is_active: boolean
  created_at: string
}

interface Organization {
  seat_limit: number
  seats_used: number
}

export default function TeamPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  
  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'rep' | 'manager'>('rep')

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get user's organization ID
      const orgResponse = await fetch('/api/organizations/current')
      if (!orgResponse.ok) {
        // User might not be in an organization
        setError('You are not part of an organization. Please sign up for a team plan.')
        setLoading(false)
        return
      }

      const orgData = await orgResponse.json()
      const currentOrgId = orgData.organization?.id

      if (!currentOrgId) {
        setError('Organization not found')
        setLoading(false)
        return
      }

      setOrgId(currentOrgId)

      // Fetch members
      const membersResponse = await fetch(`/api/organizations/${currentOrgId}/members`)
      if (!membersResponse.ok) {
        throw new Error('Failed to fetch members')
      }

      const membersData = await membersResponse.json()
      setMembers(membersData.members || [])
      setOrganization(membersData.organization)
      
      // Fetch pending invites (would need a separate endpoint or include in members response)
      // For now, we'll use a placeholder
      setPendingInvites([])
    } catch (err: any) {
      console.error('Error fetching team data:', err)
      setError(err.message || 'Failed to load team data')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    try {
      setActionLoading(true)
      const response = await fetch('/api/invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite')
      }

      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('rep')
      await fetchTeamData() // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to send invite')
    } finally {
      setActionLoading(false)
    }
  }


  const handleDeactivate = async (memberId: string) => {
    if (!orgId) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/organizations/${orgId}/deactivate-member`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to deactivate member')
      }

      await fetchTeamData() // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate member')
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivate = async (memberId: string) => {
    if (!orgId) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/organizations/${orgId}/activate-member`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to activate member')
      }

      await fetchTeamData() // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to activate member')
    } finally {
      setActionLoading(false)
    }
  }

  const monthlyCost = organization ? organization.seat_limit * 69 : 0

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  if (error && !organization) {
    return (
      <div className="min-h-screen pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-red-200">Error</h2>
            </div>
            <p className="text-red-300 mb-4">{error}</p>
            <Button
              onClick={() => router.push('/team/signup')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Sign Up for Team Plan
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-32 pb-16 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="w-10 h-10 text-purple-500" />
              Team Management
            </h1>
            <p className="text-gray-400">Manage your team members and seats</p>
          </div>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Invite Rep
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Seat Manager */}
        {organization && (
          <div className="mb-8">
            <SeatManager
              seatsUsed={organization.seats_used}
              seatLimit={organization.seat_limit}
              monthlyCost={monthlyCost}
              onInviteClick={() => setShowInviteModal(true)}
              onUpgradeClick={() => router.push('/pricing')}
            />
          </div>
        )}

        {/* Members and Invites */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <MemberList
              members={members}
              onDeactivate={handleDeactivate}
              onActivate={handleActivate}
              loading={actionLoading}
            />
          </div>
          <div>
            <PendingInvites
              invites={pendingInvites}
              loading={actionLoading}
            />
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">Invite Team Member</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="mt-2 bg-gray-700 border-gray-600 text-white"
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="text-gray-300">
                    Role
                  </Label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'rep' | 'manager')}
                    className="mt-2 w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  >
                    <option value="rep">Sales Rep</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteEmail('')
                  }}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={actionLoading || !inviteEmail.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Invite'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
