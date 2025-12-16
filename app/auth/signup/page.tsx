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
  
  // Check if signup is allowed (invite or checkout required)
  const hasValidAccess = !!inviteToken || !!checkoutIntent

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
      
      // Validate invite/checkout before proceeding
      if (!inviteToken && !checkoutIntent) {
        throw new Error('Signups are invite-only. Please use a valid invite link or complete checkout first.')
      }

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

    // Block Google OAuth if no invite/checkout
    if (!inviteToken && !checkoutIntent) {
      setError('Signups are invite-only. Please use a valid invite link.')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'https://dooriq.ai'

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

      const { data, error: signUpError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      })

      console.log('📦 OAuth response:', { 
        hasData: !!data, 
        hasUrl: !!data?.url, 
        url: data?.url,
        error: signUpError 
      })

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

  // Show invite-only message if no valid access
  if (!hasValidAccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Signups Are Invite-Only
          </h1>
          <p className="text-slate-300 mb-6">
            To create an account, you need either:
          </p>
          <ul className="text-left text-slate-400 mb-6 space-y-2">
            <li>• A valid invite link from an admin</li>
            <li>• Complete checkout to purchase a subscription</li>
          </ul>
          
          <div className="mb-6">
            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <input
                type="text"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="Enter invite token"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition"
              >
                Use Invite Token
              </button>
            </form>
          </div>
          
          <div className="space-y-3">
            <a
              href="/pricing"
              className="block w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
            >
              View Pricing
            </a>
            <a
              href="/auth/login"
              className="block text-slate-400 hover:text-white transition"
            >
              Already have an account? Sign in
            </a>
          </div>
        </div>
      </div>
    )
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

