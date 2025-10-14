'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Bell, Zap, Shield, Plus, Trash, Key, UserPlus, Target } from 'lucide-react'
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

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch('/api/team/members')
        if (response.ok) {
          const data = await response.json()
          setTeamMembers(data.members || [])
        }
      } catch (error) {
        console.error('Error fetching team members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamMembers()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Manager Settings</h2>
        <p className="text-slate-400">Configure team settings, permissions, and integrations</p>
      </div>

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
              <h3 className="text-lg font-semibold text-white">Team Members</h3>
              <p className="text-xs text-slate-400">Manage roles and permissions</p>
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
                  <div key={member.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{member.full_name}</p>
                      <p className="text-xs text-slate-400 truncate">{member.email}</p>
                      <p className="text-xs text-green-400 mt-1">${member.virtual_earnings.toLocaleString()} earned</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs font-medium text-purple-300 capitalize">
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/team/invite"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-purple-600/30"
              >
                <UserPlus className="w-4 h-4" />
                Invite Team Member
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
                Invite Your First Team Member
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
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <p className="text-xs text-slate-400">Alert preferences</p>
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

        {/* Training Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Training Settings</h3>
              <p className="text-xs text-slate-400">Configure requirements</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Minimum Passing Score</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="90"
                  defaultValue="70"
                  className="flex-1"
                />
                <span className="text-sm font-semibold text-white w-12 text-center">70%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Required Sessions Per Week</label>
              <input
                type="number"
                min="1"
                max="20"
                defaultValue="5"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Certification Renewal</label>
              <select className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40">
                <option>Every 3 months</option>
                <option>Every 6 months</option>
                <option>Annually</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Integration Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Integrations</h3>
              <p className="text-xs text-slate-400">Connect external services</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Salesforce CRM', status: 'Not Connected', color: 'slate' },
              { name: 'Google Calendar', status: 'Not Connected', color: 'slate' },
              { name: 'Slack', status: 'Not Connected', color: 'slate' },
              { name: 'Zapier', status: 'Not Connected', color: 'slate' },
            ].map((integration, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-white">{integration.name}</p>
                  <p className="text-xs text-slate-400">
                    {integration.status}
                  </p>
                </div>
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30">
                  Connect
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white mb-1">API Access</p>
                <p className="text-xs text-slate-300 mb-3">Configure webhooks and API keys for custom integrations</p>
                <button className="text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors">
                  Manage API Keys →
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
