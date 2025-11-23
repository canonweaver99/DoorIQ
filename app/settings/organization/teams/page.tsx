'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, UserPlus, Loader2, CheckSquare, Square, ArrowRight, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Team {
  id: string
  name: string
  created_at: string
  member_count: number
}

interface Rep {
  id: string
  email: string
  full_name: string
  role: string
  team_id: string | null
  team_name?: string | null
}

export default function TeamManagementPage() {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [reps, setReps] = useState<Rep[]>([])
  const [selectedReps, setSelectedReps] = useState<Set<string>>(new Set())
  const [createTeamOpen, setCreateTeamOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [movingReps, setMovingReps] = useState(false)

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

      if (!userData) {
        router.push('/settings/organization')
        return
      }

      if (userData.role !== 'manager' && userData.role !== 'admin') {
        showToast({ type: 'error', title: 'Access denied', message: 'Only managers can access team management' })
        router.push('/settings/organization')
        return
      }

      if (!userData.organization_id) {
        showToast({ type: 'error', title: 'No organization', message: 'You are not part of an organization' })
        router.push('/settings/organization')
        return
      }

      setUserRole(userData.role)
      await fetchData()
    } catch (err: any) {
      console.error('Error checking access:', err)
      showToast({ type: 'error', title: 'Error', message: err.message })
      router.push('/settings/organization')
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch teams
      const teamsResponse = await fetch('/api/settings/organization/teams')
      if (!teamsResponse.ok) {
        throw new Error('Failed to fetch teams')
      }
      const teamsData = await teamsResponse.json()
      setTeams(teamsData.teams || [])

      // Fetch all members (reps) in the organization
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!userData?.organization_id) return

      // Fetch all users in organization with their team info
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select('id, email, full_name, role, team_id')
        .eq('organization_id', userData.organization_id)
        .eq('role', 'rep')
        .order('full_name', { ascending: true })

      if (membersError) {
        throw membersError
      }

      // Map team names to reps
      const repsWithTeams = (members || []).map((rep) => {
        const team = teamsData.teams?.find((t: Team) => t.id === rep.team_id)
        return {
          ...rep,
          team_name: team?.name || null,
        }
      })

      setReps(repsWithTeams)
    } catch (err: any) {
      console.error('Error fetching data:', err)
      showToast({ type: 'error', title: 'Failed to load data', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      showToast({ type: 'error', title: 'Team name required', message: 'Please enter a team name' })
      return
    }

    setCreatingTeam(true)
    try {
      const repIds = selectedReps.size > 0 ? Array.from(selectedReps) : undefined
      const response = await fetch('/api/settings/organization/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName.trim(), repIds }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create team')
      }

      const message = repIds && repIds.length > 0
        ? `${newTeamName} created with ${repIds.length} rep(s) assigned`
        : `${newTeamName} has been created`

      showToast({ type: 'success', title: 'Team created', message })
      setCreateTeamOpen(false)
      setNewTeamName('')
      setSelectedReps(new Set())
      await fetchData()
    } catch (err: any) {
      console.error('Error creating team:', err)
      showToast({ type: 'error', title: 'Failed to create team', message: err.message })
    } finally {
      setCreatingTeam(false)
    }
  }

  const handleMoveReps = async (targetTeamId: string | null) => {
    if (selectedReps.size === 0) {
      showToast({ type: 'error', title: 'No reps selected', message: 'Please select at least one rep to move' })
      return
    }

    setMovingReps(true)
    try {
      // Use the first selected rep's ID as the route param (required by route structure)
      // but send all member_ids in the body for bulk update
      const firstRepId = Array.from(selectedReps)[0]
      const response = await fetch(`/api/settings/organization/members/${firstRepId}/team`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: targetTeamId,
          member_ids: Array.from(selectedReps),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to move reps')
      }

      const teamName = targetTeamId
        ? teams.find((t) => t.id === targetTeamId)?.name || 'Unassigned'
        : 'Unassigned'

      showToast({
        type: 'success',
        title: 'Reps moved',
        message: `${selectedReps.size} rep(s) moved to ${teamName}`,
      })

      setSelectedReps(new Set())
      await fetchData()
    } catch (err: any) {
      console.error('Error moving reps:', err)
      showToast({ type: 'error', title: 'Failed to move reps', message: err.message })
    } finally {
      setMovingReps(false)
    }
  }

  const toggleRepSelection = (repId: string) => {
    const newSelected = new Set(selectedReps)
    if (newSelected.has(repId)) {
      newSelected.delete(repId)
    } else {
      newSelected.add(repId)
    }
    setSelectedReps(newSelected)
  }

  const toggleAllReps = () => {
    if (selectedReps.size === reps.length) {
      setSelectedReps(new Set())
    } else {
      setSelectedReps(new Set(reps.map((r) => r.id)))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d4aa]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2 font-space">Team Management</h2>
          <p className="text-sm text-[#a0a0a0] font-sans">
            Create teams and organize reps within your organization
          </p>
        </div>
        <Button
          onClick={() => setCreateTeamOpen(true)}
          className="bg-[#00d4aa] hover:bg-[#00c19a] text-black font-medium font-sans"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Teams List */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2 font-space">Teams</h3>
            <p className="text-sm text-[#a0a0a0] font-sans">
              {teams.length} team{teams.length !== 1 ? 's' : ''} in your organization
            </p>
          </div>

          {teams.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-[#666] mx-auto mb-4" />
              <p className="text-[#a0a0a0] font-sans">No teams yet. Create your first team to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="p-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-white font-sans mb-1">{team.name}</h4>
                      <p className="text-sm text-[#a0a0a0] font-sans">
                        {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveReps(team.id)}
                      disabled={selectedReps.size === 0 || movingReps}
                      className="ml-2 border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reps List */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2 font-space">Sales Reps</h3>
              <p className="text-sm text-[#a0a0a0] font-sans">
                {reps.length} rep{reps.length !== 1 ? 's' : ''} • {selectedReps.size} selected
              </p>
            </div>
            {reps.length > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleAllReps}
                  className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                >
                  {selectedReps.size === reps.length ? (
                    <>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Deselect All
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Select All
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMoveReps(null)}
                  disabled={selectedReps.size === 0 || movingReps}
                  className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                >
                  {movingReps ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Moving...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Unassign ({selectedReps.size})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {reps.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-[#666] mx-auto mb-4" />
              <p className="text-[#a0a0a0] font-sans">No reps in your organization yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {reps.map((rep) => (
                <div
                  key={rep.id}
                  className={`
                    p-4 rounded-lg border transition-colors cursor-pointer
                    ${selectedReps.has(rep.id) ? 'bg-[#0a0a0a] border-[#00d4aa]' : 'bg-[#0a0a0a] border-[#2a2a2a] hover:border-[#3a3a3a]'}
                  `}
                  onClick={() => toggleRepSelection(rep.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {selectedReps.has(rep.id) ? (
                        <CheckSquare className="w-5 h-5 text-[#00d4aa]" />
                      ) : (
                        <Square className="w-5 h-5 text-[#666]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white font-sans">
                        {rep.full_name || 'No name'}
                      </p>
                      <p className="text-sm text-[#a0a0a0] font-sans">{rep.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-white font-sans">
                        {rep.team_name || 'Unassigned'}
                      </p>
                      <p className="text-xs text-[#a0a0a0] font-sans">Current Team</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Team Dialog */}
      <Dialog
        open={createTeamOpen}
        onOpenChange={(open) => {
          setCreateTeamOpen(open)
          if (!open) {
            setNewTeamName('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team in your organization. {selectedReps.size > 0 && `Selected reps will be assigned to this team.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="teamName" className="text-white font-sans">
                Team Name
              </Label>
              <Input
                id="teamName"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g., Sales Team A"
                className="mt-2 bg-[#0a0a0a] border-[#2a2a2a] text-white focus:border-[#00d4aa] focus:ring-[#00d4aa]/20"
                onKeyPress={(e) => e.key === 'Enter' && !creatingTeam && newTeamName.trim() && handleCreateTeam()}
              />
            </div>
            {selectedReps.size > 0 && (
              <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
                <p className="text-sm text-[#a0a0a0] font-sans">
                  {selectedReps.size} rep{selectedReps.size !== 1 ? 's' : ''} selected. They will be assigned to this team.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateTeamOpen(false)
                setNewTeamName('')
              }}
              disabled={creatingTeam}
              className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTeam}
              disabled={creatingTeam || !newTeamName.trim()}
              className="bg-[#00d4aa] hover:bg-[#00c19a] text-black font-medium font-sans"
            >
              {creatingTeam ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Team'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

