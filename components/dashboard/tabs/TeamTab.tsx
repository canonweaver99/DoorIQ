'use client'

import { motion } from 'framer-motion'
import { Users, Building2, Mail, Calendar, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface TeamMember {
  id: string
  full_name: string | null
  email: string
  role: string | null
  created_at: string
  avatar_url?: string | null
  isCurrentUser?: boolean
}

interface Organization {
  id: string
  name: string | null
  seat_limit: number | null
  seats_used: number | null
}

interface TeamTabProps {
  leaderboard?: any[]
  userRank?: number
  teamStats?: {
    teamSize: number
    avgTeamScore: number
    yourScore: number
  }
}

export default function TeamTab({}: TeamTabProps) {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchTeamData()
  }, [])
  
  const fetchTeamData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setLoading(false)
      return
    }
    
    try {
      // Get user's organization
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()
      
      if (!userData?.organization_id) {
        setError('You are not part of an organization')
        setLoading(false)
        return
      }
      
      // Fetch organization details
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name, seat_limit, seats_used')
        .eq('id', userData.organization_id)
        .single()
      
      if (orgData) {
        setOrganization({
          id: orgData.id,
          name: orgData.name,
          seat_limit: orgData.seat_limit,
          seats_used: orgData.seats_used
        })
      }
      
      // Fetch team members
      const { data: membersData } = await supabase
        .from('users')
        .select('id, full_name, email, role, created_at, avatar_url')
        .eq('organization_id', userData.organization_id)
        .order('created_at', { ascending: false })
      
      if (membersData) {
        const formattedMembers = membersData.map(member => ({
          id: member.id,
          full_name: member.full_name,
          email: member.email,
          role: member.role,
          created_at: member.created_at,
          avatar_url: member.avatar_url,
          isCurrentUser: member.id === user.id
        }))
        setMembers(formattedMembers)
      }
    } catch (err: any) {
      console.error('Error fetching team data:', err)
      setError('Failed to load team data')
    } finally {
      setLoading(false)
    }
  }
  
  const getRoleBadgeColor = (role: string | null) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-500/20 border-red-500/30 text-red-400'
      case 'manager':
        return 'bg-purple-500/20 border-purple-500/30 text-purple-400'
      case 'member':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
      default:
        return 'bg-slate-500/20 border-slate-500/30 text-slate-400'
    }
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-700 rounded w-1/2" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1e1e30] border border-white/10 rounded-xl p-4 animate-pulse">
              <div className="h-12 bg-slate-700 rounded" />
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center"
      >
        <p className="text-red-400 mb-4">{error}</p>
        <Link
          href="/settings/organization"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
        >
          Manage Organization
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Organization Overview */}
      {organization && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <Building2 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {organization.name || 'Organization'}
                </h2>
                <div className="flex items-center gap-4 text-sm text-slate-300">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {members.length} {members.length === 1 ? 'member' : 'members'}
                  </span>
                  {organization.seat_limit && (
                    <span className="flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      {organization.seats_used || 0} / {organization.seat_limit} seats
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href="/settings/organization"
              className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm font-medium transition-all"
            >
              Manage
            </Link>
          </div>
        </motion.div>
      )}

      {/* Team Members List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Team Members</h3>
              <p className="text-xs text-slate-400">{members.length} {members.length === 1 ? 'member' : 'members'}</p>
            </div>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No team members found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, index) => {
              const avatarUrl = member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name || member.email)}&background=6366f1&color=fff`
              const displayName = member.full_name || member.email.split('@')[0] || 'User'
              const joinDate = new Date(member.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`group relative ${
                    member.isCurrentUser ? 'ring-2 ring-purple-500/50' : ''
                  }`}
                >
                  {member.isCurrentUser && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-indigo-600/20 rounded-xl blur-lg" />
                  )}
                  
                  <div className={`relative bg-white/5 hover:bg-white/10 border ${
                    member.isCurrentUser ? 'border-purple-500/50' : 'border-white/5'
                  } rounded-xl p-4 transition-all duration-300`}>
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                      />

                      {/* Member Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold ${
                            member.isCurrentUser ? 'text-purple-300' : 'text-white'
                          }`}>
                            {displayName}
                          </p>
                          {member.isCurrentUser && (
                            <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Joined {joinDate}
                          </span>
                        </div>
                      </div>

                      {/* Role Badge */}
                      {member.role && (
                        <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                          getRoleBadgeColor(member.role)
                        }`}>
                          {member.role}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
