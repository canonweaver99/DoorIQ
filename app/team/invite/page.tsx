'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CheckCircle2, Copy, Mail, UserPlus, Loader2, MessageSquare, Share2, X } from 'lucide-react'

export default function InviteFriendPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'rep' | 'manager'>('rep')
  const [loading, setLoading] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [invitedEmail, setInvitedEmail] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

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
      setInvitedEmail(email) // Store the email for later use
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
      const subject = encodeURIComponent('Join DoorIQ!')
      const body = encodeURIComponent(
        `I'd love for you to try DoorIQ with me! It's an amazing AI-powered sales training platform.\n\nJoin me here: ${inviteUrl}\n\nThis link will expire in 7 days.`
      )
      // Open Gmail compose window
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank')
    }
  }

  const handleShareViaIMessage = () => {
    if (inviteUrl) {
      const text = `I'd love for you to try DoorIQ with me! It's an amazing AI-powered sales training platform. Join me here: ${inviteUrl}`
      window.open(`sms:?body=${encodeURIComponent(text)}`, '_blank')
    }
  }

  const handleNativeShare = async () => {
    if (inviteUrl && navigator.share) {
      try {
        await navigator.share({
          title: 'Join DoorIQ!',
          text: `I'd love for you to try DoorIQ with me! It's an amazing AI-powered sales training platform.`,
          url: inviteUrl,
        })
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', err)
      }
    } else {
      // Fallback to share modal
      setShowShareModal(true)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Invite a Friend</h1>
        <p className="mt-2 text-slate-400">
          Share DoorIQ with your friends and grow your network
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
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {navigator.share ? (
                  <Button
                    onClick={handleNativeShare}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowShareModal(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                )}
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

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Share DoorIQ</DialogTitle>
            <DialogDescription>
              Choose how you'd like to share DoorIQ with your friend
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            <Button
              onClick={handleEmailInvite}
              variant="outline"
              className="w-full justify-start border-slate-700 hover:bg-slate-700"
            >
              <Mail className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Gmail</div>
                <div className="text-xs text-slate-400">Share via email</div>
              </div>
            </Button>

            <Button
              onClick={handleShareViaIMessage}
              variant="outline"
              className="w-full justify-start border-slate-700 hover:bg-slate-700"
            >
              <MessageSquare className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">iMessage</div>
                <div className="text-xs text-slate-400">Share via text message</div>
              </div>
            </Button>

            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-full justify-start border-slate-700 hover:bg-slate-700"
            >
              <Copy className="mr-3 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Copy Link</div>
                <div className="text-xs text-slate-400">Copy link to share anywhere</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

