'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SignInComponent, Testimonial } from '@/components/ui/sign-in'

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

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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

      router.push('/trainer/select-homeowner')
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
      const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || 'https://door-iq.vercel.app'

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/trainer/select-homeowner`,
        },
      })

      if (signInError) throw signInError
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  const handleResetPassword = () => {
    // TODO: Implement password reset
    alert('Password reset coming soon!')
  }

  const handleCreateAccount = () => {
    router.push('/auth/signup')
  }

  return (
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
  )
}

