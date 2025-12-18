'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignUpComponent, Testimonial } from '@/components/ui/sign-up'
import { testimonialsData } from '@/components/ui/testimonials-columns-1'

// Map landing page testimonials to component format, keeping old images
const oldImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
]

const testimonials: Testimonial[] = testimonialsData.slice(0, 3).map((t, index) => ({
  avatarSrc: oldImages[index] || '',
  name: t.name,
  handle: t.role,
  text: t.text,
}))

function SignUpForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [inviteInput, setInviteInput] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite') || inviteInput
  const nextUrl = searchParams.get('next')
  const checkoutIntent = searchParams.get('checkout')
  
  // Signups are now open to everyone
  const hasValidAccess = true

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const supabase = createClient()
      
      // Capture current page URL for redirect after email confirmation
      const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/dashboard'
      const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'https://dooriq.ai'
      const redirectUrl = `${origin}/auth/callback?next=${encodeURIComponent(currentPath)}`
      
      // Step 1: Create user via server (requires email confirmation)
      const adminResp = await fetch('/api/auth/fast-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          full_name: fullName, 
          redirectUrl,
          invite_token: inviteToken || null,
          checkout_intent: checkoutIntent || null
        })
      })
      const adminJson = await adminResp.json()
      if (!adminResp.ok) {
        throw new Error(adminJson.error || 'Failed to create account')
      }

      // Handle invite token if present
      const redirectParams = new URLSearchParams()
      redirectParams.set('email', email)
      if (inviteToken) {
        redirectParams.set('invite', inviteToken)
      }
      
      // Show success message and redirect to confirmation page
      router.push(`/auth/confirmed?${redirectParams.toString()}`)
      return
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to create account')
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Determine the correct origin for OAuth redirect
      // Priority: 1) Environment variable, 2) Production URL, 3) Current origin (for local dev)
      if (typeof window === 'undefined') {
        throw new Error('OAuth sign-up must be initiated from browser')
      }
      
      let origin = window.location.origin
      
      // Use environment variable if available (most reliable for production)
      const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
      if (envUrl && !envUrl.includes('localhost')) {
        origin = new URL(envUrl).origin
        console.log('✅ Using environment variable for redirect origin:', origin)
      } else if (process.env.NODE_ENV === 'production') {
        // In production, use production URL even if env var not set
        origin = 'https://dooriq.ai'
        console.log('✅ Using production URL for redirect origin:', origin)
      } else {
        // In development, use current origin (localhost)
        console.log('✅ Using current origin for redirect (development):', origin)
      }

      // Preserve redirect params in OAuth callback
      let callbackUrl = `${origin}/auth/callback`
      const params = new URLSearchParams()
      if (nextUrl) params.set('next', nextUrl)
      if (checkoutIntent) params.set('checkout', checkoutIntent)
      if (inviteToken) params.set('invite', inviteToken)
      if (params.toString()) {
        callbackUrl += `?${params.toString()}`
      }

      console.log('🔐 Initiating Google OAuth signup')
      console.log('📍 Callback URL:', callbackUrl)
      console.log('🌐 Origin:', origin)
      console.log('🌍 Full URL:', window.location.href)

      const { data, error: signUpError } = await supabase.auth.signInWithOAuth({
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
        error: signUpError 
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

      if (signUpError) {
        console.error('❌ OAuth error:', signUpError)
        throw signUpError
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
      setError(err.message || 'Failed to sign up with Google')
      setLoading(false)
    }
  }
  
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inviteInput.trim()) {
      router.push(`/auth/signup?invite=${inviteInput.trim()}`)
    }
  }

  const handleSignIn = () => {
    // Preserve redirect params when switching to login
    let loginUrl = '/auth/login'
    if (nextUrl || checkoutIntent) {
      const params = new URLSearchParams()
      if (nextUrl) params.set('next', nextUrl)
      if (checkoutIntent) params.set('checkout', checkoutIntent)
      loginUrl += `?${params.toString()}`
    }
    router.push(loginUrl)
  }

  return (
    <SignUpComponent
      title={
        <span className="font-light text-white tracking-tight">
          Join <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">DoorIQ</span>
        </span>
      }
      description="Create your account and start mastering door-to-door sales today"
      heroImageSrc="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=2160&q=80"
        testimonials={testimonials}
        onSignUp={handleSignUp}
        onGoogleSignUp={handleGoogleSignUp}
        onSignIn={handleSignIn}
      loading={loading}
      error={error}
    />
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <SignUpForm />
    </Suspense>
  )
}

