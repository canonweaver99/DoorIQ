'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()

  // Handle email verification tokens from hash fragments before redirecting
  useEffect(() => {
    const handleAuthRedirect = async () => {
      const supabase = createClient()
      
      // First check if user is already authenticated
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // User is authenticated, redirect to dashboard (homepage)
        router.replace('/dashboard')
        return
      }
      
      // Check if we have auth tokens in the hash fragment
      if (typeof window === 'undefined' || !window.location.hash) {
        // No auth tokens and not authenticated, redirect to landing
        router.replace('/landing')
        return
      }

      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      // Only handle email verification (signup type)
      if (!accessToken || type !== 'signup') {
        router.replace('/landing')
        return
      }

      try {
        console.log('🔐 Handling email verification from hash fragment')
        const supabase = createClient()

        // Set the session using the tokens from the hash
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (error) {
          console.error('❌ Error setting session:', error)
          router.push('/auth/login?error=Unable to sign you in. Please try signing in manually.')
          return
        }

        if (data.session && data.user) {
          console.log('✅ Session set successfully')
          
          // Create user profile if it doesn't exist
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (!existingUser) {
            console.log('📝 Creating user profile in database...')
            const userMetadata = data.user.user_metadata
            
            // Create user profile via API
            const createResponse = await fetch('/api/users/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                full_name: userMetadata.full_name || userMetadata.name || data.user.email?.split('@')[0] || 'User',
              })
            })
            
            if (createResponse.ok) {
              console.log('✅ User profile created')
            } else {
              console.warn('⚠️ Failed to create user profile, but continuing...')
            }
          }
          
          // Clear the hash from URL and redirect to home
          window.history.replaceState(null, '', window.location.pathname)
          router.push('/dashboard')
          router.refresh()
        } else {
          router.replace('/landing')
        }
      } catch (error: any) {
        console.error('❌ Error handling auth redirect:', error)
        router.push('/auth/login?error=Authentication failed. Please try signing in.')
      }
    }

    handleAuthRedirect()
  }, [router])

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-lg">Loading...</div>
    </div>
  )
}
