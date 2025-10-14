'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Copy, Mail, UserPlus, Loader2 } from 'lucide-react'

export default function InviteTeammatePage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'rep' | 'manager'>('rep')
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInviteUrl(null)

    try {
      const response = await fetch('/api/invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invite')
      }

      setInviteUrl(data.inviteUrl)
      setEmail('')
    } catch (err: any) {
      console.error('Error creating invite:', err)
      setError(err.message || 'Failed to create invite')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleEmailInvite = () => {
    if (inviteUrl) {
      const subject = encodeURIComponent('Join our DoorIQ team!')
      const body = encodeURIComponent(
        `You've been invited to join our team on DoorIQ!\n\nClick the link below to accept the invitation:\n${inviteUrl}\n\nThis link will expire in 7 days.`
      )
      window.location.href = `mailto:?subject=${subject}&body=${body}`
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Invite Teammates</h1>
        <p className="mt-2 text-slate-400">
          Send an invite link to add new members to your team
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Invite Form */}
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
          <form onSubmit={handleCreateInvite} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@example.com"
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'rep' | 'manager')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="rep">Sales Rep</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Invite...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Invite Link
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Invite Link Display */}
        <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
          {inviteUrl ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-400 mb-4">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Invite Link Created!</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Share this link
                </label>
                <div className="flex gap-2">
                  <input
                    value={inviteUrl}
                    readOnly
                    className="bg-slate-900 border border-slate-700 text-white flex-1 rounded-md px-3 py-2"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="border-slate-700 hover:bg-slate-700"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleEmailInvite}
                  variant="outline"
                  className="w-full border-slate-700 hover:bg-slate-700"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send via Email
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400">
                  This link will expire in 7 days. The recipient will need to sign up or log in to accept the invitation.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <UserPlus className="h-12 w-12 text-slate-600 mb-3" />
              <p className="text-slate-400">
                Create an invite link to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-6 bg-slate-800/50 border border-slate-700 rounded-lg">
        <h2 className="text-lg font-semibold text-white mb-3">How it works</h2>
        <ol className="space-y-2 text-sm text-slate-400">
          <li className="flex gap-2">
            <span className="font-semibold text-purple-400">1.</span>
            <span>Enter the email address of the person you want to invite</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-purple-400">2.</span>
            <span>Select their role (Sales Rep or Manager)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-purple-400">3.</span>
            <span>Share the generated link via email or copy it to share directly</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-purple-400">4.</span>
            <span>The recipient will be added to your team when they sign up or log in</span>
          </li>
        </ol>
      </div>
    </div>
  )
}

