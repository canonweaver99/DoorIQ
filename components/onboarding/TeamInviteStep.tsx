'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowRight,
  ArrowLeft,
  UserPlus,
  Mail,
  X,
  Loader2,
  CheckCircle2,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamInviteStepProps {
  onContinue: () => void
  onBack: () => void
  onSkip: () => void
}

interface InviteEntry {
  email: string
  status: 'pending' | 'sending' | 'sent' | 'error'
  error?: string
}

export function TeamInviteStep({ onContinue, onBack, onSkip }: TeamInviteStepProps) {
  const [emailInput, setEmailInput] = useState('')
  const [invites, setInvites] = useState<InviteEntry[]>([])
  const [isSending, setIsSending] = useState(false)

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase()
    if (!email) return

    if (!isValidEmail(email)) {
      return
    }

    if (invites.some((inv) => inv.email === email)) {
      return
    }

    setInvites([...invites, { email, status: 'pending' }])
    setEmailInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addEmail()
    }
  }

  const removeInvite = (email: string) => {
    setInvites(invites.filter((inv) => inv.email !== email))
  }

  const sendInvites = async () => {
    if (invites.length === 0) {
      onContinue()
      return
    }

    setIsSending(true)

    // Send invites one by one
    for (const invite of invites) {
      if (invite.status !== 'pending') continue

      setInvites((prev) =>
        prev.map((inv) =>
          inv.email === invite.email ? { ...inv, status: 'sending' } : inv
        )
      )

      try {
        const response = await fetch('/api/invites/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: invite.email }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to send invite')
        }

        setInvites((prev) =>
          prev.map((inv) =>
            inv.email === invite.email ? { ...inv, status: 'sent' } : inv
          )
        )
      } catch (err: any) {
        setInvites((prev) =>
          prev.map((inv) =>
            inv.email === invite.email
              ? { ...inv, status: 'error', error: err.message }
              : inv
          )
        )
      }
    }

    setIsSending(false)

    // Wait a moment then continue
    setTimeout(() => {
      onContinue()
    }, 1000)
  }

  const pendingCount = invites.filter((i) => i.status === 'pending').length
  const sentCount = invites.filter((i) => i.status === 'sent').length

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8 text-purple-400" />
        </div>
        <h1 className="font-space text-3xl md:text-4xl font-bold text-white mb-4">
          Invite Your Team
        </h1>
        <p className="text-white/70 text-lg">
          Add your sales reps so they can start training right away.
          <br />
          <span className="text-white/50 text-sm">
            You can always add more team members later.
          </span>
        </p>
      </div>

      {/* Email input */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            type="email"
            placeholder="teammate@company.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-12 pl-12 bg-white/5 border-white/20 text-white placeholder:text-white/40"
          />
        </div>
        <Button
          onClick={addEmail}
          disabled={!emailInput || !isValidEmail(emailInput)}
          className="h-12 px-6 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
        >
          <UserPlus className="w-5 h-5" />
        </Button>
      </div>

      {/* Invite list */}
      {invites.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-sm">
              {invites.length} team member{invites.length !== 1 ? 's' : ''} to invite
            </span>
            {sentCount > 0 && (
              <span className="text-green-400 text-sm">
                {sentCount} sent
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {invites.map((invite) => (
              <div
                key={invite.email}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg',
                  invite.status === 'sent'
                    ? 'bg-green-500/10'
                    : invite.status === 'error'
                    ? 'bg-red-500/10'
                    : 'bg-white/5'
                )}
              >
                <div className="flex items-center gap-3">
                  {invite.status === 'sending' && (
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  )}
                  {invite.status === 'sent' && (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  )}
                  {invite.status === 'pending' && (
                    <Mail className="w-4 h-4 text-white/40" />
                  )}
                  {invite.status === 'error' && (
                    <X className="w-4 h-4 text-red-400" />
                  )}
                  <span
                    className={cn(
                      'text-sm',
                      invite.status === 'sent'
                        ? 'text-green-400'
                        : invite.status === 'error'
                        ? 'text-red-400'
                        : 'text-white'
                    )}
                  >
                    {invite.email}
                  </span>
                </div>

                {invite.status === 'pending' && (
                  <button
                    onClick={() => removeInvite(invite.email)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <X className="w-4 h-4 text-white/40 hover:text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {invites.length === 0 && (
        <div className="bg-white/5 border border-dashed border-white/20 rounded-xl p-8 mb-6 text-center">
          <UserPlus className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">
            Enter email addresses above to invite your team
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSending}
          className="h-12 px-6 bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onSkip}
            disabled={isSending}
            className="h-12 px-6 text-white/60 hover:text-white hover:bg-white/5"
          >
            Skip for now
          </Button>

          <Button
            onClick={sendInvites}
            disabled={isSending}
            className="h-12 px-8 bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Sending...
              </>
            ) : invites.length > 0 ? (
              <>
                Send {pendingCount} Invite{pendingCount !== 1 ? 's' : ''}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

