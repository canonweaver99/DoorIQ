'use client'

import { useState, useEffect } from 'react'
import { Copy, CheckCircle2, XCircle, Plus, Calendar, Mail, User, Clock } from 'lucide-react'
import Link from 'next/link'

interface AdminInvite {
  id: string
  token: string
  email: string | null
  expires_at: string
  used_at: string | null
  used_by: string | null
  created_at: string
  purpose: string | null
  created_by: {
    name: string
    email: string
  } | null
  status: 'active' | 'used' | 'expired'
  invite_url: string
}

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<AdminInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    expiresInDays: 7,
    purpose: ''
  })

  useEffect(() => {
    fetchInvites()
  }, [])

  const fetchInvites = async () => {
    try {
      const response = await fetch('/api/admin/invites/list')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch invites')
      }

      setInvites(data.invites || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load invites')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim() || null,
          expiresInDays: formData.expiresInDays,
          purpose: formData.purpose.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invite')
      }

      // Reset form
      setFormData({
        email: '',
        expiresInDays: 7,
        purpose: ''
      })

      // Refresh invites list
      await fetchInvites()
    } catch (err: any) {
      setError(err.message || 'Failed to create invite')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = async (text: string, token: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </span>
        )
      case 'used':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Used
          </span>
        )
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 sm:px-6 lg:px-8 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link 
            href="/admin"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 mb-4 text-sm font-sans"
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-space font-bold tracking-tight text-white mb-2">
            Admin Invites
          </h1>
          <p className="text-sm sm:text-base text-[#a0a0a0] font-sans leading-relaxed">
            Create and manage invite tokens for signup access
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 font-sans">
            {error}
          </div>
        )}

        {/* Create Invite Form */}
        <div className="mb-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <h2 className="text-xl font-space font-semibold text-white mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-purple-400" />
            Create New Invite
          </h2>
          
          <form onSubmit={handleCreateInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2 font-sans">
                Email (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Leave empty for open invite"
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
              />
              <p className="mt-1 text-xs text-[#666] font-sans">
                If provided, invite can only be used by this email address
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2 font-sans">
                  Expires In (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) || 7 })}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a0a0a0] mb-2 font-sans">
                  Purpose (Optional)
                </label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="e.g., testing, demo, beta"
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full md:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors font-sans flex items-center justify-center"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invite
                </>
              )}
            </button>
          </form>
        </div>

        {/* Invites List */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2a2a2a]">
            <h2 className="text-xl font-space font-semibold text-white">
              All Invites ({invites.length})
            </h2>
          </div>

          {invites.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-[#a0a0a0] font-sans">No invites created yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0a0a0a]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a0a0a0] uppercase tracking-wider font-sans">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a0a0a0] uppercase tracking-wider font-sans">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a0a0a0] uppercase tracking-wider font-sans">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a0a0a0] uppercase tracking-wider font-sans">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a0a0a0] uppercase tracking-wider font-sans">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#a0a0a0] uppercase tracking-wider font-sans">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2a2a]">
                  {invites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-[#0a0a0a] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(invite.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-white font-sans">
                          {invite.email ? (
                            <>
                              <Mail className="w-4 h-4 mr-2 text-[#666]" />
                              {invite.email}
                            </>
                          ) : (
                            <span className="text-[#666]">Open invite</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#a0a0a0] font-sans">
                        {invite.purpose || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-[#a0a0a0] font-sans">
                          <Calendar className="w-4 h-4 mr-2 text-[#666]" />
                          {new Date(invite.expires_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#a0a0a0] font-sans">
                        {new Date(invite.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => copyToClipboard(invite.invite_url, invite.token)}
                          className="inline-flex items-center px-3 py-1.5 bg-[#0a0a0a] hover:bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white transition-colors font-sans"
                        >
                          {copiedToken === invite.token ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-400" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1.5" />
                              Copy Link
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
