'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignUpComponent, Testimonial } from '@/components/ui/sign-up'

const testimonials: Testimonial[] = [
  {
    avatarSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    name: 'Marcus Johnson',
    handle: '@marcustops',
    text: 'DoorIQ helped me increase my close rate by 40% in just 2 weeks. The AI training is incredible!',
  },
  {
    avatarSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    name: 'Sarah Chen',
    handle: '@sarahsells',
    text: 'Best sales training platform I\'ve used. The real-time feedback changed how I approach every door.',
  },
  {
    avatarSrc: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    name: 'David Martinez',
    handle: '@davidclosing',
    text: 'The leaderboard keeps me motivated. I went from struggling to top performer in my team!',
  },
]

function SignUpForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const nextUrl = searchParams.get('next')
  const checkoutIntent = searchParams.get('checkout')

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
      
      // Step 1: Create user via server (requires email confirmation)
      const adminResp = await fetch('/api/auth/fast-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName })
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

      const { error: signUpError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      })

      if (signUpError) throw signUpError
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google')
      setLoading(false)
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

