'use client'

import { useState, useEffect } from 'react'
import { Users, UserPlus, Loader2, CheckSquare, Square, ArrowRight, Building2, ChevronDown, X } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

interface TeamManagementProps {
  organizationId: string
}

export function TeamManagement({ organizationId }: TeamManagementProps) {
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [reps, setReps] = useState<Rep[]>([])
  const [selectedReps, setSelectedReps] = useState<Set<string>>(new Set())
  const [createTeamOpen, setCreateTeamOpen] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [movingReps, setMovingReps] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [targetTeamId, setTargetTeamId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [organizationId])

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

      // Fetch all users in organization with their team info
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select('id, email, full_name, role, team_id')
        .eq('organization_id', organizationId)
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
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
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
          className="bg-white hover:bg-gray-100 text-black font-medium font-sans border border-gray-300"
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
              {teams.map((team) => {
                const teamReps = reps.filter(r => r.team_id === team.id)
                const isSelected = selectedTeamId === team.id
                
                return (
                  <div
                    key={team.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      isSelected 
                        ? 'bg-[#0a0a0a] border-purple-500' 
                        : 'bg-[#0a0a0a] border-[#2a2a2a] hover:border-[#3a3a3a]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => setSelectedTeamId(isSelected ? null : team.id)}>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white font-sans">{team.name}</h4>
                          {isSelected && (
                            <span className="text-xs text-purple-400 font-sans">Selected</span>
                          )}
                        </div>
                        <p className="text-sm text-[#a0a0a0] font-sans">
                          {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                        </p>
                        {isSelected && teamReps.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
                            <p className="text-xs text-[#a0a0a0] font-sans mb-1">Members:</p>
                            <div className="space-y-1">
                              {teamReps.slice(0, 3).map((rep) => (
                                <p key={rep.id} className="text-xs text-[#888] font-sans truncate">
                                  {rep.full_name || rep.email}
                                </p>
                              ))}
                              {teamReps.length > 3 && (
                                <p className="text-xs text-[#666] font-sans">
                                  +{teamReps.length - 3} more
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="ml-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => e.stopPropagation()}
                              className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a] min-w-[32px]"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTeamId(isSelected ? null : team.id)
                              }}
                              className="text-white hover:bg-[#2a2a2a] cursor-pointer"
                            >
                              {isSelected ? 'Collapse' : 'Expand'}
                            </DropdownMenuItem>
                            {selectedReps.size > 0 && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setTargetTeamId(team.id)
                                  setShowMoveModal(true)
                                }}
                                disabled={movingReps}
                                className="text-white hover:bg-[#2a2a2a] cursor-pointer"
                              >
                                Move Selected Reps Here
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                )
              })}
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
                {selectedTeamId 
                  ? `${reps.filter(r => r.team_id === selectedTeamId).length} rep${reps.filter(r => r.team_id === selectedTeamId).length !== 1 ? 's' : ''} in ${teams.find(t => t.id === selectedTeamId)?.name || 'team'}`
                  : `${reps.length} rep${reps.length !== 1 ? 's' : ''} total`
                } • {selectedReps.size} selected
              </p>
            </div>
            {reps.length > 0 && (
              <div className="flex gap-2">
                {selectedTeamId && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedTeamId(null)}
                    className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                  >
                    <X className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const visibleReps = selectedTeamId 
                      ? reps.filter(r => r.team_id === selectedTeamId)
                      : reps
                    if (selectedReps.size === visibleReps.length) {
                      setSelectedReps(new Set())
                    } else {
                      setSelectedReps(new Set(visibleReps.map(r => r.id)))
                    }
                  }}
                  className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
                >
                  {(selectedTeamId 
                    ? reps.filter(r => r.team_id === selectedTeamId)
                    : reps
                  ).every(r => selectedReps.has(r.id)) ? (
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
                {selectedReps.size > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={movingReps}
                        className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Move ({selectedReps.size})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
                      <DropdownMenuItem
                        onClick={() => {
                          setTargetTeamId(null)
                          setShowMoveModal(true)
                        }}
                        className="text-white hover:bg-[#2a2a2a] cursor-pointer"
                      >
                        Unassign
                      </DropdownMenuItem>
                      {teams.map((team) => {
                        // Get the current team of selected reps (if they're all in the same team)
                        const selectedRepsArray = Array.from(selectedReps)
                        const selectedRepsData = reps.filter(r => selectedRepsArray.includes(r.id))
                        const currentTeamId = selectedRepsData.length > 0 && selectedRepsData.every(r => r.team_id === team.id) 
                          ? team.id 
                          : null
                        
                        // Don't show the current team as an option
                        if (currentTeamId === team.id) return null
                        
                        return (
                          <DropdownMenuItem
                            key={team.id}
                            onClick={() => {
                              setTargetTeamId(team.id)
                              setShowMoveModal(true)
                            }}
                            className="text-white hover:bg-[#2a2a2a] cursor-pointer"
                          >
                            {team.name}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (selectedReps.size > 0) {
                      setTargetTeamId(null)
                      setShowMoveModal(true)
                    } else {
                      showToast({ 
                        type: 'error', 
                        title: 'No reps selected', 
                        message: 'Please select reps to move first' 
                      })
                    }
                  }}
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
              {(selectedTeamId 
                ? reps.filter(r => r.team_id === selectedTeamId)
                : reps
              ).map((rep) => (
                <div
                  key={rep.id}
                  className={`
                    p-4 rounded-lg border transition-colors cursor-pointer
                    ${selectedReps.has(rep.id) ? 'bg-[#0a0a0a] border-purple-500' : 'bg-[#0a0a0a] border-[#2a2a2a] hover:border-[#3a3a3a]'}
                  `}
                  onClick={() => toggleRepSelection(rep.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {selectedReps.has(rep.id) ? (
                        <CheckSquare className="w-5 h-5 text-purple-500" />
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
              {selectedTeamId && reps.filter(r => r.team_id === selectedTeamId).length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-[#666] mx-auto mb-2" />
                  <p className="text-[#a0a0a0] font-sans">No members in this team</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Move Reps Confirmation Dialog */}
      <Dialog
        open={showMoveModal}
        onOpenChange={(open) => {
          setShowMoveModal(open)
          if (!open) {
            setTargetTeamId(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Reps</DialogTitle>
            <DialogDescription>
              {targetTeamId 
                ? `Move ${selectedReps.size} selected rep${selectedReps.size !== 1 ? 's' : ''} to ${teams.find(t => t.id === targetTeamId)?.name || 'this team'}?`
                : `Unassign ${selectedReps.size} selected rep${selectedReps.size !== 1 ? 's' : ''} from their current team?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowMoveModal(false)
                setTargetTeamId(null)
              }}
              disabled={movingReps}
              className="border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await handleMoveReps(targetTeamId)
                setShowMoveModal(false)
                setTargetTeamId(null)
              }}
              disabled={movingReps}
              className="bg-white hover:bg-gray-100 text-black font-medium font-sans border border-gray-300"
            >
              {movingReps ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Moving...
                </>
              ) : (
                'Confirm Move'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                className="mt-2 bg-[#0a0a0a] border-[#2a2a2a] text-white focus:border-purple-500 focus:ring-purple-500/20"
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
              className="bg-white hover:bg-gray-100 text-black font-medium font-sans border border-gray-300"
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

