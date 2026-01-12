'use client'

import { useState, useEffect } from 'react'
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
import { createClient } from '@/lib/supabase/client'

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
  const [seatInfo, setSeatInfo] = useState<{ limit: number; used: number; available: number } | null>(null)
  const [loadingSeats, setLoadingSeats] = useState(true)

  // Fetch seat information
  useEffect(() => {
    const fetchSeatInfo = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setLoadingSeats(false)
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()

        if (!userData?.organization_id) {
          setLoadingSeats(false)
          return
        }

        const { data: org } = await supabase
          .from('organizations')
          .select('seat_limit, seats_used')
          .eq('id', userData.organization_id)
          .single()

        if (org) {
          const available = (org.seat_limit || 0) - (org.seats_used || 0)
          setSeatInfo({
            limit: org.seat_limit || 0,
            used: org.seats_used || 0,
            available,
          })
        }
      } catch (error) {
        console.error('Error fetching seat info:', error)
      } finally {
        setLoadingSeats(false)
      }
    }

    fetchSeatInfo()
  }, [])

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
        {!loadingSeats && seatInfo ? (
          <div className="mb-6">
            <div className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/[0.06] border border-white/10 rounded-full">
              <span className="text-white text-2xl md:text-3xl font-bold font-space">
                {seatInfo.used}/{seatInfo.limit}
              </span>
              <span className="text-white/70 text-base md:text-lg font-medium">
                seat{seatInfo.limit !== 1 ? 's' : ''} filled
              </span>
            </div>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
          </div>
        )}
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

      {/* Seat Information - Prominently displayed at top */}
      {!loadingSeats && seatInfo && (
        <div className="mb-8 bg-white/[0.06] border-2 border-white/12 rounded-xl p-6 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">Seats Purchased</p>
                <p className="text-white text-3xl font-bold font-space">
                  {seatInfo.limit}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">Available</p>
              <p className={cn(
                "text-3xl font-bold font-space",
                seatInfo.available > 0 ? "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" : "text-red-400"
              )}>
                {seatInfo.available}
              </p>
            </div>
          </div>
        </div>
      )}

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
            className="h-12 pl-12 bg-white/[0.06] border-2 border-white/12 text-white placeholder:text-white/40 focus:border-white/30 focus:ring-2 focus:ring-white/10"
          />
        </div>
        <Button
          onClick={addEmail}
          disabled={!emailInput || !isValidEmail(emailInput) || (seatInfo && seatInfo.available === 0)}
          className="h-12 px-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-medium shadow-lg shadow-purple-500/30"
        >
          <UserPlus className="w-5 h-5" />
        </Button>
      </div>

      {/* Invite list */}
      {invites.length > 0 && (
        <div className="bg-white/[0.06] border-2 border-white/12 rounded-xl p-4 mb-6 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/60 text-sm font-medium">
              {invites.length} team member{invites.length !== 1 ? 's' : ''} to invite
            </span>
            {sentCount > 0 && (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-sm font-medium">
                {sentCount} sent
              </span>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {invites.map((invite) => (
              <div
                key={invite.email}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-all',
                  invite.status === 'sent'
                    ? 'bg-green-500/10 border-green-500/20'
                    : invite.status === 'error'
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-white/[0.06] border-white/10'
                )}
              >
                <div className="flex items-center gap-3">
                  {invite.status === 'sending' && (
                    <Loader2 className="w-4 h-4 animate-spin text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
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
                      'text-sm font-medium',
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
                    className="p-1 hover:bg-white/10 rounded transition-colors"
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
        <div className="bg-white/[0.06] border-2 border-dashed border-white/20 rounded-xl p-8 mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6 text-white/40" />
          </div>
          <p className="text-white/50 font-medium">
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
            disabled={isSending || (seatInfo && seatInfo.available === 0)}
            className="h-12 px-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-medium shadow-lg shadow-purple-500/30 disabled:opacity-50"
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

