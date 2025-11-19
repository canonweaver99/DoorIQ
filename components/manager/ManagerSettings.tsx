'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Bell, Shield, UserPlus, CheckCircle2, X, Trash2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface TeamMember {
  id: string
  full_name: string
  email: string
  role: string
  virtual_earnings: number
  created_at: string
}

export default function ManagerSettings() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [teamName, setTeamName] = useState('')
  const [editingTeamName, setEditingTeamName] = useState(false)
  const [savingTeamName, setSavingTeamName] = useState(false)
  const [teamNameSaved, setTeamNameSaved] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)

  useEffect(() => {
    fetchTeamData()
  }, [])

  const fetchTeamData = async () => {
    try {
      // Fetch team members
      const membersResponse = await fetch('/api/team/members')
      if (membersResponse.ok) {
        const data = await membersResponse.json()
        setTeamMembers(data.members || [])
        
        // Fetch team info
        const teamResponse = await fetch('/api/team/info')
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          setTeamName(teamData.name || 'My Team')
        }
      }
    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTeamName = async () => {
    if (!teamName.trim()) return
    
    setSavingTeamName(true)
    setTeamNameSaved(false)
    try {
      const response = await fetch('/api/team/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName })
      })

      if (response.ok) {
        setEditingTeamName(false)
        setTeamNameSaved(true)
        // Hide success message after 3 seconds
        setTimeout(() => setTeamNameSaved(false), 3000)
      } else {
        console.error('Failed to update team name')
      }
    } catch (error) {
      console.error('Error updating team name:', error)
    } finally {
      setSavingTeamName(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    setRemoving(true)
    setRemoveError(null)

    try {
      const response = await fetch(`/api/team/members/${memberToRemove.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        // Remove member from local state
        setTeamMembers(prev => prev.filter(m => m.id !== memberToRemove.id))
        setMemberToRemove(null)
      } else {
        setRemoveError(data.error || 'Failed to remove team member')
      }
    } catch (error: any) {
      console.error('Error removing team member:', error)
      setRemoveError(error.message || 'Failed to remove team member')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1 font-space">Manager Settings</h2>
        <p className="text-slate-400 font-sans">Configure team settings and permissions</p>
      </div>

      {/* Team Name Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white font-space">Team Information</h3>
            <p className="text-xs text-slate-400 font-sans">Update your team name and settings</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 font-space">Team Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onFocus={() => setEditingTeamName(true)}
                placeholder="My Team"
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
              {editingTeamName && (
                <button
                  onClick={handleSaveTeamName}
                  disabled={savingTeamName}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white rounded-xl font-medium transition-colors font-space"
                >
                  {savingTeamName ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
            {teamNameSaved && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-2 flex items-center gap-2 text-sm text-green-400"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Team name updated successfully!</span>
              </motion.div>
            )}
            <p className="text-xs text-slate-500 mt-2">This name will appear in team invitations and throughout the platform</p>
          </div>
        </div>
      </motion.div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white font-space">Team Members</h3>
              <p className="text-xs text-slate-400 font-sans">Manage roles and permissions</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : teamMembers.length > 0 ? (
            <>
              <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate font-space">{member.full_name}</p>
                      <p className="text-xs text-slate-400 truncate font-sans">{member.email}</p>
                      <p className="text-xs text-green-400 mt-1">${member.virtual_earnings.toLocaleString()} earned</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs font-medium text-purple-300 capitalize font-space">
                        {member.role}
                      </span>
                      {member.role === 'rep' && (
                        <button
                          onClick={() => setMemberToRemove(member)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Remove from team"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/team/invite"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-purple-600/30 font-space"
              >
                <UserPlus className="w-4 h-4" />
                Invite a Sales Rep
              </Link>
            </>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 mb-4">No team members yet</p>
              <Link
                href="/team/invite"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-purple-600/30"
              >
                <UserPlus className="w-4 h-4" />
                Invite a Sales Rep
              </Link>
            </div>
          )}
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white font-space">Notifications</h3>
              <p className="text-xs text-slate-400 font-sans">Alert preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { id: 1, label: 'Rep scores below 60%', enabled: true },
              { id: 2, label: 'Training completion milestones', enabled: true },
              { id: 3, label: 'Daily performance summary', enabled: false },
              { id: 4, label: 'New team member joins', enabled: true },
              { id: 5, label: 'Weekly analytics report', enabled: true },
            ].map((notif) => (
              <div key={notif.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                <span className="text-sm text-white">{notif.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={notif.enabled} className="sr-only peer" />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Remove Member Confirmation Modal */}
      <AnimatePresence>
        {memberToRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !removing && setMemberToRemove(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white font-space">Remove Team Member</h3>
              </div>

              <p className="text-slate-300 mb-6">
                Are you sure you want to remove <span className="font-semibold text-white">{memberToRemove.full_name}</span> from your team? 
                They will no longer have access to team features, but their account and session history will be preserved.
              </p>

              {removeError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{removeError}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setMemberToRemove(null)
                    setRemoveError(null)
                  }}
                  disabled={removing}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed font-space"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveMember}
                  disabled={removing}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-space"
                >
                  {removing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
