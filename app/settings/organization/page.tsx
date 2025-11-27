'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Users, UserPlus, Mail, Trash2, Shield, User, Loader2, UserCog } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { TeamManagement } from '@/components/settings/TeamManagement'
import { TeamManagementWalkthrough } from '@/components/onboarding/TeamManagementWalkthrough'
import { cn } from '@/lib/utils'

type Tab = 'overview' | 'teams'

interface TeamMember {
  id: string
  email: string
  full_name: string
  role: string
  joined_at: string
}

const tabs = [
  { id: 'overview' as Tab, name: 'Overview', icon: Users },
  { id: 'teams' as Tab, name: 'Team Management', icon: UserCog },
]

function OrganizationSettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  
  const [members, setMembers] = useState<TeamMember[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [seatUsage, setSeatUsage] = useState({ used: 0, limit: 0 })
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [showWalkthrough, setShowWalkthrough] = useState(false)

  // Initialize activeTab from URL parameter
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tabParam = searchParams.get('tab') as Tab | null
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      return tabParam
    }
    return 'overview'
  })

  // Check if walkthrough should be shown
  useEffect(() => {
    const walkthroughParam = searchParams.get('walkthrough')
    if (walkthroughParam === 'true' && isManager && !loading) {
      // Delay to ensure page is fully rendered and all elements are available
      const timer = setTimeout(() => {
        setShowWalkthrough(true)
      }, 1000) // Increased delay to ensure page is fully loaded
      
      return () => clearTimeout(timer)
    }
  }, [searchParams, isManager, loading])

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tabParam = searchParams.get('tab') as Tab | null
    if (tabParam && tabs.some(tab => tab.id === tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam)
    }
  }, [searchParams, activeTab])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    router.push(`/settings/organization?tab=${tab}`, { scroll: false })
  }

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
        showToast({ type: 'error', title: 'You are not part of an organization' })
        return
      }

      setUserRole(userData.role)
      setOrganizationId(userData.organization_id)

      const { data: org } = await supabase
        .from('organizations')
        .select('seat_limit, seats_used')
        .eq('id', userData.organization_id)
        .single()

      if (org) {
        setSeatUsage({ used: org.seats_used, limit: org.seat_limit })
      }

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
      showToast({ type: 'error', title: 'Failed to load organization data', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      showToast({ type: 'error', title: 'Please enter a valid email address' })
      return
    }

    setInviting(true)
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

      showToast({ type: 'success', title: `Invitation sent to ${inviteEmail}` })
      setInviteEmail('')
      await fetchPendingInvites()
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to send invitation', message: err.message })
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the organization?`)) {
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

      showToast({ type: 'success', title: `${memberName} has been removed from the organization` })
      await fetchTeamData()
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to remove member', message: err.message })
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

      showToast({ type: 'success', title: 'Role updated successfully' })
      await fetchTeamData()
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to update role', message: err.message })
    }
  }

  const isManager = userRole === 'manager' || userRole === 'admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d4aa]" />
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'teams':
        if (!isManager) {
          return (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-[#666] mx-auto mb-4" />
              <p className="text-[#a0a0a0] font-sans">Only managers can access team management</p>
            </div>
          )
        }
        if (!organizationId) {
          return (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[#666] mx-auto mb-4" />
              <p className="text-[#a0a0a0] font-sans">You are not part of an organization</p>
            </div>
          )
        }
        return <TeamManagement organizationId={organizationId} />
      case 'overview':
      default:
        return (
          <>
            {/* Seat Usage */}
            <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2 font-space">Organization Overview</h2>
                  <p className="text-sm text-[#a0a0a0] font-sans">
                    Manage your organization members and seats
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white font-space">
                    {seatUsage.used} / {seatUsage.limit}
                  </p>
                  <p className="text-sm text-[#a0a0a0] font-sans">Seats Used</p>
                </div>
              </div>
            </div>

            {/* Invite Member */}
            {isManager && (
              <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8" data-walkthrough="invite-section">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2 font-space">Invite Team Member</h2>
                    <p className="text-sm text-[#a0a0a0] font-sans">
                      Send an invitation to join your organization
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label htmlFor="inviteEmail" className="sr-only">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
                        <Input
                          id="inviteEmail"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="email@example.com"
                          className="pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-white focus:border-[#00d4aa] focus:ring-[#00d4aa]/20"
                          onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleInvite}
                      disabled={inviting || !inviteEmail.trim()}
                      className="bg-[#00d4aa] hover:bg-[#00c19a] text-black font-medium font-sans"
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
              </div>
            )}

            {/* Pending Invites */}
            {isManager && pendingInvites.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2 font-space">Pending Invites</h2>
                    <p className="text-sm text-[#a0a0a0] font-sans">
                      {pendingInvites.length} invite{pendingInvites.length !== 1 ? 's' : ''} pending
                    </p>
                  </div>
                  <div className="space-y-2">
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-white font-sans">{invite.email}</p>
                          <p className="text-xs text-[#a0a0a0] font-sans capitalize">
                            {invite.role} • Expires {new Date(invite.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Team Members */}
            <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8" data-walkthrough="members-section">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2 font-space">Team Members</h2>
                  <p className="text-sm text-[#a0a0a0] font-sans">
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {members.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-[#666] mx-auto mb-4" />
                    <p className="text-[#a0a0a0] font-sans">No team members yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member, index) => (
                      <div
                        key={member.id}
                        className="p-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] hover:border-[#2a2a2a] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                              <User className="w-5 h-5 text-[#a0a0a0]" />
                            </div>
                            <div>
                              <p className="font-medium text-white font-sans">
                                {member.full_name || 'No name'}
                              </p>
                              <p className="text-sm text-[#a0a0a0] font-sans">{member.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {isManager && (
                              <select
                                value={member.role}
                                onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                                className="px-3 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] text-white text-sm font-sans"
                                {...(index === 0 ? { 'data-walkthrough': 'roles-section' } : {})}
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
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2a2a2a] border border-[#2a2a2a]">
                                {member.role === 'manager' || member.role === 'admin' ? (
                                  <Shield className="w-4 h-4 text-[#00d4aa]" />
                                ) : (
                                  <User className="w-4 h-4 text-[#00d4aa]" />
                                )}
                                <span className="text-sm font-medium text-[#00d4aa] capitalize font-sans">
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
            </div>
          </>
        )
    }
  }

  const handleWalkthroughComplete = () => {
    setShowWalkthrough(false)
    // Remove walkthrough parameter from URL
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('walkthrough')
    router.push(`/settings/organization?${newSearchParams.toString()}`, { scroll: false })
  }

  const handleWalkthroughSkip = () => {
    setShowWalkthrough(false)
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('walkthrough')
    router.push(`/settings/organization?${newSearchParams.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6 relative">
      {/* Walkthrough overlay */}
      {showWalkthrough && isManager && (
        <TeamManagementWalkthrough
          onComplete={handleWalkthroughComplete}
          onSkip={handleWalkthroughSkip}
        />
      )}

      {/* Tab Navigation */}
      <div className="border-b border-[#2a2a2a]" data-walkthrough="tabs">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            const isDisabled = tab.id === 'teams' && !isManager

            return (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => !isDisabled && handleTabChange(tab.id)}
                disabled={isDisabled}
                className={cn(
                  'relative flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 font-space',
                  isDisabled
                    ? 'text-[#666] cursor-not-allowed'
                    : isActive
                    ? 'text-white bg-[#1a1a1a]'
                    : 'text-[#888888] hover:text-[#bbbbbb]'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
                
                {isActive && (
                  <motion.div
                    layoutId="activeTabBorder"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#a855f7]"
                    style={{ boxShadow: '0 2px 8px rgba(168, 85, 247, 0.3)' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function OrganizationSettingsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d4aa]" />
      </div>
    }>
      <OrganizationSettingsPage />
    </Suspense>
  )
}

export default OrganizationSettingsPageWrapper
