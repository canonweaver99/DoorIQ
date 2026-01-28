'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle email verification tokens from hash fragments before redirecting
  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null

    const handleAuthRedirect = async () => {
      try {
        // Wait for browser to be fully ready (especially important for TV browsers)
        if (typeof window === 'undefined') {
          if (mounted) {
            try {
              router.replace('/landing')
            } catch {
              // Fallback to window.location if router fails
              window.location.href = '/landing'
            }
            setLoading(false)
          }
          return
        }

        // Set a timeout to prevent infinite loading (10 seconds)
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('⚠️ Auth redirect timeout, redirecting to landing')
            setError('Loading is taking longer than expected. Redirecting...')
            setTimeout(() => {
              if (mounted) {
                try {
                  router.replace('/landing')
                } catch {
                  // Fallback to window.location if router fails
                  window.location.href = '/landing'
                }
                setLoading(false)
              }
            }, 1000)
          }
        }, 10000)

        // Wait a bit for browser APIs to be ready (especially for TV browsers)
        await new Promise(resolve => setTimeout(resolve, 100))

        // Check if Supabase client can be created
        let supabase
        try {
          supabase = createClient()
          if (!supabase) {
            throw new Error('Supabase client could not be created')
          }
        } catch (clientError: any) {
          console.error('❌ Error creating Supabase client:', clientError)
          if (mounted) {
            clearTimeout(timeoutId!)
            try {
              router.replace('/landing')
            } catch {
              window.location.href = '/landing'
            }
            setLoading(false)
          }
          return
        }

        // First check if user is already authenticated
        let user
        try {
          const { data: { user: authUser }, error: getUserError } = await supabase.auth.getUser()
          
          if (getUserError) {
            console.warn('⚠️ Error getting user:', getUserError)
            // Continue to check hash fragment
          } else {
            user = authUser
          }
        } catch (getUserErr: any) {
          console.warn('⚠️ Exception getting user:', getUserErr)
          // Continue to check hash fragment
        }

        if (user && mounted) {
          // User is authenticated, redirect to home
          clearTimeout(timeoutId!)
          try {
            router.replace('/home')
          } catch {
            window.location.href = '/home'
          }
          setLoading(false)
          return
        }
        
        // Check if we have auth tokens in the hash fragment
        if (!window.location.hash) {
          // No auth tokens and not authenticated, redirect to landing
          if (mounted) {
            clearTimeout(timeoutId!)
            try {
              router.replace('/landing')
            } catch {
              window.location.href = '/landing'
            }
            setLoading(false)
          }
          return
        }

        const hash = window.location.hash.substring(1)
        const hashParams = new URLSearchParams(hash)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        // Only handle email verification (signup type)
        if (!accessToken || type !== 'signup') {
          if (mounted) {
            clearTimeout(timeoutId!)
            try {
              router.replace('/landing')
            } catch {
              window.location.href = '/landing'
            }
            setLoading(false)
          }
          return
        }

        console.log('🔐 Handling email verification from hash fragment')

        // Set the session using the tokens from the hash
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (sessionError) {
          console.error('❌ Error setting session:', sessionError)
          if (mounted) {
            clearTimeout(timeoutId!)
            try {
              router.push('/auth/login?error=Unable to sign you in. Please try signing in manually.')
            } catch {
              window.location.href = '/auth/login?error=Unable to sign you in. Please try signing in manually.'
            }
            setLoading(false)
          }
          return
        }

        if (data.session && data.user && mounted) {
          console.log('✅ Session set successfully')
          
          // Create user profile if it doesn't exist (don't block on this)
          try {
            const { data: existingUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single()

            if (!existingUser) {
              console.log('📝 Creating user profile in database...')
              const userMetadata = data.user.user_metadata
              
              // Create user profile via API (fire and forget)
              fetch('/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: data.user.id,
                  email: data.user.email,
                  full_name: userMetadata.full_name || userMetadata.name || data.user.email?.split('@')[0] || 'User',
                })
              }).catch(err => {
                console.warn('⚠️ Failed to create user profile:', err)
              })
            }
          } catch (profileError) {
            console.warn('⚠️ Error checking/creating user profile:', profileError)
            // Don't block on profile creation errors
          }
          
          // Clear the hash from URL and redirect to home
          try {
            window.history.replaceState(null, '', window.location.pathname)
          } catch (historyError) {
            console.warn('⚠️ Error updating history:', historyError)
          }
          
          if (mounted) {
            clearTimeout(timeoutId!)
            try {
              router.push('/home')
              router.refresh()
            } catch {
              window.location.href = '/home'
            }
            setLoading(false)
          }
        } else {
          if (mounted) {
            clearTimeout(timeoutId!)
            try {
              router.replace('/landing')
            } catch {
              window.location.href = '/landing'
            }
            setLoading(false)
          }
        }
      } catch (error: any) {
        console.error('❌ Error handling auth redirect:', error)
        if (mounted) {
          clearTimeout(timeoutId!)
          // Don't show error to user, just redirect to landing
          try {
            router.replace('/landing')
          } catch {
            window.location.href = '/landing'
          }
          setLoading(false)
        }
      }
    }

    handleAuthRedirect()

    return () => {
      mounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [router])

  // Show loading state while redirecting
  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="text-red-400 text-xl font-bold mb-4">Error Loading</div>
            <p className="text-slate-300 mb-6">
              There was an error loading the page. Please try refreshing.
            </p>
            <button
              onClick={() => window.location.href = '/landing'}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-medium transition-colors"
            >
              Go to Landing Page
            </button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <div className="text-white text-lg mb-2">Loading...</div>
          {error && (
            <div className="text-yellow-400 text-sm mt-2">{error}</div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}
