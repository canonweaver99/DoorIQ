'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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

function InviteAcceptPageContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [autoSigningIn, setAutoSigningIn] = useState(false)

  useEffect(() => {
    // Check for error messages from callback
    const errorParam = searchParams.get('error')
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        email_mismatch: 'The email you signed in with does not match the invited email address.',
        invalid_invite: 'This invite is no longer valid or has expired.',
        no_seats: 'No seats available in this organization. Please contact the organization admin.',
        update_failed: 'Failed to join the team. Please try again.',
      }
      setError(errorMessages[errorParam] || 'An error occurred while processing your invite.')
      setLoading(false)
      return
    }
    
    checkAuthAndValidateInvite()
  }, [token, searchParams])

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

      // If user is not authenticated, automatically trigger Google OAuth
      if (!currentUser && data.invite) {
        await autoSignInWithGoogle()
      }
    } catch (err: any) {
      console.error('Error validating invite:', err)
      setError(err.message || 'Failed to validate invite')
    } finally {
      setLoading(false)
    }
  }

  const autoSignInWithGoogle = async () => {
    try {
      setAutoSigningIn(true)
      const supabase = createClient()
      
      if (typeof window === 'undefined') {
        return
      }

      const origin = window.location.origin
      
      // Build callback URL with invite token
      const callbackUrl = `${origin}/auth/callback?invite=${token}&next=${encodeURIComponent(`/invite/${token}`)}`

      console.log('🔐 Auto-initiating Google OAuth for invite')
      console.log('📍 Callback URL:', callbackUrl)

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: false,
        },
      })

      if (signInError) {
        console.error('❌ OAuth error:', signInError)
        setError('Failed to sign in with Google. Please try manually.')
        setAutoSigningIn(false)
        return
      }

      // Redirect to OAuth URL
      if (data?.url) {
        console.log('✅ Redirecting to OAuth URL:', data.url)
        window.location.replace(data.url)
        return // Don't reset loading - redirect is happening
      }

      setAutoSigningIn(false)
    } catch (err: any) {
      console.error('❌ Auto sign-in error:', err)
      setError('Failed to automatically sign in. Please use the button below.')
      setAutoSigningIn(false)
    }
  }

  const handleAcceptInvite = async () => {
    if (!user) {
      // Redirect to signup with invite token
      router.push(`/auth/signup?invite=${token}`)
      return
    }

    // Check if the logged-in user's email matches the invited email
    if (user.email !== invite?.email) {
      setError(`This invite is for ${invite?.email}. Please log out and sign up with that email, or log in if you already have an account with that email.`)
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

      // Check if user needs onboarding
      const supabase = createClient()
      const { data: userProfile } = await supabase
        .from('users')
        .select('onboarding_completed, role')
        .eq('id', user.id)
        .single()

      // If user has a role but hasn't completed onboarding, send them to onboarding
      // Otherwise, send them to dashboard/home
      if (userProfile?.role && !userProfile.onboarding_completed) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Error accepting invite:', err)
      setError(err.message || 'Failed to accept invite')
    } finally {
      setAccepting(false)
    }
  }

  if (loading || autoSigningIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-slate-400">
            {autoSigningIn ? 'Signing you in with Google...' : 'Validating invite...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-slate-800/50 border border-slate-700 text-center rounded-lg">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Invite</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  if (!invite) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-slate-800/50 border border-slate-700 rounded-lg">
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

        {user && user.email !== invite?.email && (
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400 mb-2">
              You're logged in as {user.email}
            </p>
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                router.push(`/auth/signup?invite=${token}`)
              }}
              className="text-sm text-purple-400 hover:text-purple-300 underline"
            >
              Sign out and create new account
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <InviteAcceptPageContent />
    </Suspense>
  )
}

