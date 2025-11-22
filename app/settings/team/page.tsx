'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, UserPlus, Mail, Trash2, Shield, User, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GlowCard } from '@/components/ui/spotlight-card'

interface TeamMember {
  id: string
  email: string
  full_name: string
  role: string
  joined_at: string
}

export default function TeamSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [seatUsage, setSeatUsage] = useState({ used: 0, limit: 0 })
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)

  useEffect(() => {
    fetchTeamData()
    fetchPendingInvites()
  }, [])

  const fetchPendingInvites = async () => {
    try {
      setInvitesLoading(true)
      const response = await fetch('/api/settings/team/pending-invites')
      if (response.ok) {
        const data = await response.json()
        setPendingInvites(data.invites || [])
      }
    } catch (err) {
      console.error('Error fetching pending invites:', err)
    } finally {
      setInvitesLoading(false)
    }
  }

  const fetchTeamData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

      if (!userData?.organization_id) {
        setError('You are not part of an organization')
        return
      }

      setUserRole(userData.role)
      setOrganizationId(userData.organization_id)

      // Get organization seat info
      const { data: org } = await supabase
        .from('organizations')
        .select('seat_limit, seats_used')
        .eq('id', userData.organization_id)
        .single()

      if (org) {
        setSeatUsage({ used: org.seats_used, limit: org.seat_limit })
      }

      // Get team members
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at')
        .eq('organization_id', userData.organization_id)
        .order('created_at', { ascending: false })

      if (teamMembers) {
        setMembers(teamMembers.map(m => ({
          ...m,
          joined_at: m.created_at,
        })))
      }
    } catch (err: any) {
      console.error('Error fetching team data:', err)
      setError(err.message || 'Failed to load team data')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setInviting(true)
    setError(null)

    try {
      const response = await fetch('/api/settings/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite')
      }

      setSuccess(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
      setTimeout(() => setSuccess(null), 3000)
      await fetchPendingInvites()
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return
    }

    try {
      const response = await fetch(`/api/settings/team/members/${memberId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member')
      }

      setSuccess(`${memberName} has been removed from the team`)
      setTimeout(() => setSuccess(null), 3000)
      await fetchTeamData()
    } catch (err: any) {
      setError(err.message || 'Failed to remove member')
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/settings/team/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role')
      }

      setSuccess('Role updated successfully')
      setTimeout(() => setSuccess(null), 3000)
      await fetchTeamData()
    } catch (err: any) {
      setError(err.message || 'Failed to update role')
    }
  }

  const isManager = userRole === 'manager' || userRole === 'admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-400">{success}</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Seat Usage */}
      <GlowCard glowColor="purple" customSize className="p-6 bg-card/60 dark:bg-black/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-space font-bold text-foreground mb-2">Team Overview</h2>
            <p className="text-sm text-foreground/60 font-sans">
              Manage your team members and seats
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-foreground font-space">
              {seatUsage.used} / {seatUsage.limit}
            </p>
            <p className="text-sm text-foreground/60 font-sans">Seats Used</p>
          </div>
        </div>
      </GlowCard>

      {/* Invite Member */}
      {isManager && (
        <GlowCard glowColor="emerald" customSize className="p-6 bg-card/60 dark:bg-black/60">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-space font-bold text-foreground mb-2">Invite Team Member</h2>
              <p className="text-sm text-foreground/60 font-sans">
                Send an invitation to join your team
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="inviteEmail" className="sr-only">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="pl-10 bg-background/50 border-border/40"
                    onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                  />
                </div>
              </div>
              <Button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {inviting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite
                  </>
                )}
              </Button>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Pending Invites */}
      {isManager && pendingInvites.length > 0 && (
        <GlowCard glowColor="yellow" customSize className="p-6 bg-card/60 dark:bg-black/60">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-space font-bold text-foreground mb-2">Pending Invites</h2>
              <p className="text-sm text-foreground/60 font-sans">
                {pendingInvites.length} invite{pendingInvites.length !== 1 ? 's' : ''} pending
              </p>
            </div>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="p-3 rounded-lg bg-background/30 border border-border/40 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">{invite.email}</p>
                    <p className="text-xs text-foreground/50 font-sans capitalize">
                      {invite.role} • Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlowCard>
      )}

      {/* Team Members */}
      <GlowCard glowColor="blue" customSize className="p-6 bg-card/60 dark:bg-black/60">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-space font-bold text-foreground mb-2">Team Members</h2>
            <p className="text-sm text-foreground/60 font-sans">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>

          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
              <p className="text-foreground/60 font-sans">No team members yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="p-4 rounded-lg bg-background/30 border border-border/40 hover:bg-background/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {member.full_name || 'No name'}
                        </p>
                        <p className="text-sm text-foreground/60 font-sans">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isManager && (
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-border/40 bg-background/50 text-foreground text-sm"
                        >
                          <option value="rep">Rep</option>
                          <option value="manager">Manager</option>
                        </select>
                      )}
                      {isManager && member.role !== 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id, member.full_name || member.email)}
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {!isManager && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                          {member.role === 'manager' || member.role === 'admin' ? (
                            <Shield className="w-4 h-4 text-purple-400" />
                          ) : (
                            <User className="w-4 h-4 text-purple-400" />
                          )}
                          <span className="text-sm font-medium text-purple-400 capitalize">
                            {member.role}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlowCard>
    </div>
  )
}

