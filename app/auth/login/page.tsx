'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignInComponent, Testimonial } from '@/components/ui/sign-in'
import PasswordResetModal from '@/components/auth/PasswordResetModal'

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
  {
    avatarSrc: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    name: 'James Wilson',
    handle: '@jamessells',
    text: 'The AI homeowners feel so real. My objection handling skills have improved dramatically!',
  },
]

function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const nextUrl = searchParams.get('next')
  const checkoutIntent = searchParams.get('checkout')

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
        router.push(redirectUrl)
      } else {
        router.push('/dashboard')
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
      const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'https://dooriq.ai'

      // Preserve redirect params in OAuth callback
      let callbackUrl = `${origin}/auth/callback`
      if (nextUrl || checkoutIntent) {
        const params = new URLSearchParams()
        if (nextUrl) params.set('next', nextUrl)
        if (checkoutIntent) params.set('checkout', checkoutIntent)
        callbackUrl += `?${params.toString()}`
      }

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      })

      if (signInError) throw signInError
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  const handleResetPassword = () => {
    setShowResetModal(true)
  }

  const handleCreateAccount = () => {
    // Preserve redirect params when switching to signup
    let signupUrl = '/auth/signup'
    if (nextUrl || checkoutIntent) {
      const params = new URLSearchParams()
      if (nextUrl) params.set('next', nextUrl)
      if (checkoutIntent) params.set('checkout', checkoutIntent)
      signupUrl += `?${params.toString()}`
    }
    router.push(signupUrl)
  }

  return (
    <>
      <SignInComponent
        title={
          <span className="font-light text-white tracking-tight">
            Welcome to <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">DoorIQ</span>
          </span>
        }
        description="Access your training sessions, compete on leaderboards, and master door-to-door sales"
        heroImageSrc="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=2160&q=80"
        testimonials={testimonials}
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

