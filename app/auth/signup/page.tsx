'use client'

import { useState, useEffect } from 'react'
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

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

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
      
      // Step 1: Create user via server (auto-confirm)
      const adminResp = await fetch('/api/auth/fast-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName })
      })
      const adminJson = await adminResp.json()
      if (!adminResp.ok) {
        throw new Error(adminJson.error || 'Failed to create account')
      }

      // Mirror in auth client by signing in immediately
      const { data: authData, error: signUpError } = await supabase.auth.signInWithPassword({ email, password })

      if (signUpError) throw signUpError

      console.log('📝 Signup response:', {
        user: !!authData.user,
        session: !!authData.session,
        userId: authData.user?.id
      })

      // Step 2: Create user profile in users table
      if (authData.user) {
        const res = await fetch('/api/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: authData.user.id,
            email: authData.user.email,
            full_name: fullName,
          })
        })
        
        const json = await res.json()
        if (!res.ok && res.status !== 200) {
          // If user already exists (duplicate), that's okay - might be re-signup
          if (json.message !== 'User already exists') {
            throw new Error(json.error || 'Failed to create user profile')
          }
        }

        // Step 3: Auto sign-in regardless of email confirmation
        console.log('✅ Account created, auto-signing in...')
        
        // Immediately sign in with the credentials
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (signInError) {
          console.warn('⚠️ Auto sign-in failed:', signInError.message)
          setError('Account created! Please sign in with your credentials.')
          setLoading(false)
          return
        }
        
        if (signInData.session) {
          console.log('✅ Signed in successfully, redirecting...')
          
          // If there's an invite token, accept it
          if (inviteToken) {
            try {
              const inviteResponse = await fetch('/api/invites/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: inviteToken })
              })
              
              if (!inviteResponse.ok) {
                console.warn('Failed to accept invite:', await inviteResponse.json())
              }
            } catch (inviteError) {
              console.warn('Error accepting invite:', inviteError)
            }
          }
          
          // Wait for session to be established
          await new Promise(resolve => setTimeout(resolve, 800))
          
          // Redirect to dashboard
          window.location.href = '/dashboard'
        } else {
          setError('Account created! Please sign in with your credentials.')
          setLoading(false)
        }
      } else {
        setError('Account creation failed. Please try again.')
        setLoading(false)
      }
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
      const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'https://door-iq.vercel.app'

      const { error: signUpError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      })

      if (signUpError) throw signUpError
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google')
      setLoading(false)
    }
  }

  const handleSignIn = () => {
    router.push('/auth/login')
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

