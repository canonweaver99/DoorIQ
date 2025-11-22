'use client'

import { useState } from 'react'
import { User, UserX, UserCheck, Mail, Shield, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Member {
  id: string
  email: string
  full_name: string | null
  role: 'rep' | 'manager' | 'admin'
  is_active: boolean
  created_at: string
}

interface MemberListProps {
  members: Member[]
  onDeactivate: (memberId: string) => Promise<void>
  onActivate: (memberId: string) => Promise<void>
  loading?: boolean
}

export function MemberList({
  members,
  onDeactivate,
  onActivate,
  loading = false,
}: MemberListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const filteredMembers = members.filter((member) => {
    if (filter === 'active') return member.is_active
    if (filter === 'inactive') return !member.is_active
    return true
  })

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'manager':
        return <Shield className="w-4 h-4 text-purple-500" />
      default:
        return <User className="w-4 h-4 text-gray-400" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700">Admin</Badge>
      case 'manager':
        return <Badge className="bg-purple-900/50 text-purple-300 border-purple-700">Manager</Badge>
      default:
        return <Badge className="bg-gray-700 text-gray-300">Rep</Badge>
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Team Members</h3>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            All ({members.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
            className={filter === 'active' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            Active ({members.filter(m => m.is_active).length})
          </Button>
          <Button
            variant={filter === 'inactive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('inactive')}
            className={filter === 'inactive' ? 'bg-purple-600 hover:bg-purple-700' : ''}
          >
            Inactive ({members.filter(m => !m.is_active).length})
          </Button>
        </div>
      </div>

      <div className="divide-y divide-gray-700">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No members found
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className="p-4 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    member.is_active ? 'bg-green-900/30' : 'bg-gray-700'
                  }`}>
                    {member.is_active ? (
                      <UserCheck className="w-5 h-5 text-green-400" />
                    ) : (
                      <UserX className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">
                        {member.full_name || 'Unnamed User'}
                      </span>
                      {getRoleIcon(member.role)}
                      {getRoleBadge(member.role)}
                      {member.is_active ? (
                        <Badge className="bg-green-900/50 text-green-300 border-green-700">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-700 text-gray-400">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                      <Mail className="w-3 h-3" />
                      {member.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.is_active ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeactivate(member.id)}
                      disabled={loading}
                      className="border-red-700 text-red-400 hover:bg-red-900/30"
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onActivate(member.id)}
                      disabled={loading}
                      className="border-green-700 text-green-400 hover:bg-green-900/30"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

