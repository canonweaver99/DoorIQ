'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignInComponent, Testimonial } from '@/components/ui/sign-in'
import PasswordResetModal from '@/components/auth/PasswordResetModal'
import dynamic from 'next/dynamic'

// Lazy load testimonials data to reduce initial bundle
const testimonialsDataPromise = import('@/components/ui/testimonials-columns-1').then(mod => mod.testimonialsData)

// Map landing page testimonials to component format, keeping old images
const oldImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
]

// Lazy load testimonials - will be loaded when component mounts
let testimonials: Testimonial[] = []

function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [testimonialsLoaded, setTestimonialsLoaded] = useState<Testimonial[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const nextUrl = searchParams.get('next')
  const checkoutIntent = searchParams.get('checkout')

  // Lazy load testimonials on mount
  useEffect(() => {
    testimonialsDataPromise.then(testimonialsData => {
      const mapped: Testimonial[] = testimonialsData.slice(0, 4).map((t, index) => ({
        avatarSrc: oldImages[index] || '',
        name: t.name,
        handle: t.role,
        text: t.text,
      }))
      setTestimonialsLoaded(mapped)
    })
  }, [])

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      // If user came via invite link, accept it now
      if (inviteToken) {
        try {
          const inviteResponse = await fetch('/api/invites/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteToken })
          })
          if (!inviteResponse.ok) {
            console.warn('Failed to accept invite from login:', await inviteResponse.json())
          }
        } catch (e) {
          console.warn('Error accepting invite from login:', e)
        }
      }

      // Redirect to the intended destination with checkout parameter if present
      if (nextUrl) {
        let redirectUrl = nextUrl
        if (checkoutIntent) {
          redirectUrl += `${nextUrl.includes('?') ? '&' : '?'}checkout=${checkoutIntent}`
        }
        router.replace(redirectUrl)
      } else {
        router.replace('/home')
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      if (!supabase) {
        throw new Error('Supabase client not initialized. Please check your environment variables.')
      }

      // Use current origin - this ensures redirects go back to the same domain
      if (typeof window === 'undefined') {
        throw new Error('OAuth sign-in must be initiated from browser')
      }
      
      const origin = window.location.origin
      
      // Safety check: Warn if using localhost in production (shouldn't happen)
      if (origin.includes('localhost') && process.env.NODE_ENV === 'production') {
        console.error('⚠️ Warning: Using localhost origin in production:', origin)
        console.error('⚠️ This suggests a configuration issue. Check Supabase Site URL setting.')
      }

      // Preserve redirect params in OAuth callback
      let callbackUrl = `${origin}/auth/callback`
      if (nextUrl || checkoutIntent) {
        const params = new URLSearchParams()
        if (nextUrl) params.set('next', nextUrl)
        if (checkoutIntent) params.set('checkout', checkoutIntent)
        callbackUrl += `?${params.toString()}`
      }

      console.log('🔐 Initiating Google OAuth')
      console.log('📍 Callback URL:', callbackUrl)
      console.log('🌐 Origin:', origin)
      console.log('🌍 Full URL:', window.location.href)
      console.log('🌍 Hostname:', window.location.hostname)
      console.log('🌍 Protocol:', window.location.protocol)
      console.log('🔧 NODE_ENV:', process.env.NODE_ENV)
      console.log('🔧 NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)
      console.log('🔧 NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL)

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          // Force Supabase to use our redirect URL
          skipBrowserRedirect: false,
        },
      })

      console.log('📦 OAuth response:', { 
        hasData: !!data, 
        hasUrl: !!data?.url, 
        url: data?.url,
        error: signInError 
      })
      
      // Check if the OAuth URL contains localhost (indicates Supabase config issue)
      if (data?.url && (data.url.includes('localhost:3000') || data.url.includes('localhost')) && !origin.includes('localhost')) {
        console.error('❌ CRITICAL: Supabase is redirecting to localhost despite origin being:', origin)
        console.error('❌ OAuth URL from Supabase:', data.url)
        console.error('❌ This means your production domain is not configured in Supabase dashboard')
        console.error('❌ Please add this URL to Supabase Auth > URL Configuration > Redirect URLs:', callbackUrl)
        setError(`Configuration error: Your domain (${origin}) needs to be added to Supabase redirect URLs. Please add ${callbackUrl} to your Supabase dashboard under Authentication > URL Configuration.`)
        setLoading(false)
        return
      }

      if (signInError) {
        console.error('❌ OAuth error:', signInError)
        throw signInError
      }

      // Check if we got a URL to redirect to
      if (data?.url) {
        console.log('✅ Redirecting to OAuth URL:', data.url)
        // Use window.location.replace to ensure redirect happens
        window.location.replace(data.url)
        return // Don't reset loading - redirect is happening
      }

      // If no URL was returned, this is unexpected
      console.error('❌ No URL returned from OAuth')
      setLoading(false)
      setError('Failed to get OAuth URL. Please ensure your redirect URL is configured in Supabase dashboard and try again.')
    } catch (err: any) {
      console.error('❌ Google sign-in error:', err)
      setError(err.message || 'Failed to sign in with Google. Please try again.')
      setLoading(false)
    }
  }

  const handleResetPassword = () => {
    setShowResetModal(true)
  }

  const handleCreateAccount = () => {
    // Redirect to pricing page instead of signup
    router.push('/landing/pricing')
  }

  return (
    <>
      <SignInComponent
        title={
          <span className="font-light text-white tracking-tight">
            Welcome to <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">DoorIQ</span>
          </span>
        }
        description="Access your training sessions, compete on leaderboards, and master door-to-door sales."
        heroImageSrc="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=75"
        testimonials={testimonialsLoaded}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
        loading={loading}
        error={error}
      />
      <PasswordResetModal 
        isOpen={showResetModal} 
        onClose={() => setShowResetModal(false)} 
      />
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  )
}

