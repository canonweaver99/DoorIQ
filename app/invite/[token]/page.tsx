'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle, UserPlus } from 'lucide-react'

interface InviteData {
  id: string
  team: {
    id: string
    name: string
  }
  inviter: {
    full_name: string
    email: string
  }
  role: string
  email: string
}

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkAuthAndValidateInvite()
  }, [token])

  const checkAuthAndValidateInvite = async () => {
    try {
      const supabase = createClient()
      
      // Check if user is authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // Validate the invite token
      const response = await fetch('/api/invites/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid invite')
      }

      setInvite(data.invite)
    } catch (err: any) {
      console.error('Error validating invite:', err)
      setError(err.message || 'Failed to validate invite')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvite = async () => {
    if (!user) {
      // Redirect to signup with invite token
      router.push(`/auth/signup?invite=${token}`)
      return
    }

    setAccepting(true)
    setError(null)

    try {
      const response = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invite')
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Error accepting invite:', err)
      setError(err.message || 'Failed to accept invite')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-slate-400">Validating invite...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-slate-800/50 border-slate-700 text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invite</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Go to Home
          </Button>
        </Card>
      </div>
    )
  }

  if (!invite) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-slate-800/50 border-slate-700">
        <div className="text-center mb-6">
          <UserPlus className="h-16 w-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Join {invite.team.name}
          </h1>
          <p className="text-slate-400">
            {invite.inviter.full_name} has invited you to join their team on DoorIQ
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400 mb-1">Team</div>
            <div className="text-white font-medium">{invite.team.name}</div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400 mb-1">Your Role</div>
            <div className="text-white font-medium capitalize">{invite.role}</div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400 mb-1">Invited By</div>
            <div className="text-white font-medium">{invite.inviter.full_name}</div>
            <div className="text-sm text-slate-400">{invite.inviter.email}</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <Button
          onClick={handleAcceptInvite}
          disabled={accepting}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {accepting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Accepting...
            </>
          ) : user ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Accept Invitation
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up to Join
            </>
          )}
        </Button>

        {!user && (
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <a
                href={`/auth/login?invite=${token}`}
                className="text-purple-400 hover:text-purple-300"
              >
                Log in
              </a>
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

