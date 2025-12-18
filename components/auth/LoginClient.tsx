"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { LogIn, Mail, Lock } from 'lucide-react'

export function LoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Navigate to home
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
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
      
      const callbackUrl = `${origin}/auth/callback`
      console.log('🔐 OAuth callback URL:', callbackUrl)
      console.log('🌐 Origin:', origin)
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      // Check if the OAuth URL contains localhost (indicates Supabase config issue)
      if (data?.url && (data.url.includes('localhost:3000') || data.url.includes('localhost')) && !origin.includes('localhost')) {
        console.error('❌ CRITICAL: Supabase is redirecting to localhost despite origin being:', origin)
        console.error('❌ OAuth URL from Supabase:', data.url)
        console.error('❌ Please add this URL to Supabase Auth > URL Configuration > Redirect URLs:', callbackUrl)
        setError(`Configuration error: Your domain (${origin}) needs to be added to Supabase redirect URLs. Please add ${callbackUrl} to your Supabase dashboard under Authentication > URL Configuration.`)
        setLoading(false)
        return
      }

      if (error) {
        console.error('Google OAuth error:', error)
        throw error
      }
      
      if (data?.url) {
        console.log('✅ Redirecting to OAuth URL:', data.url)
        window.location.replace(data.url)
        return
      }
      
      console.log('Google OAuth initiated:', data)
    } catch (error: any) {
      console.error('handleGoogleSignIn error:', error)
      setError(error.message || 'Failed to initiate Google sign-in')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#07030f] via-[#0e0b1f] to-[#150c28]">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400 mb-2">ACCOUNT</p>
          <h1 className="text-3xl font-semibold text-white mb-3">DoorIQ Control Center</h1>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] backdrop-blur-xl p-8 shadow-[0_30px_120px_rgba(109,40,217,0.35)]">
          <p className="text-sm font-semibold text-white mb-3">Get Started with DoorIQ</p>
          <p className="text-xs text-slate-300 leading-relaxed mb-6">Sign in to track your progress, compete on the leaderboard, and unlock all features.</p>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              type="button"
              className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>Loading...</>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign In with Google
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white/[0.06] px-2 text-slate-400 tracking-[0.2em]">Or</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-3 mt-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/40 bg-white/5 text-white placeholder-slate-400 text-sm transition"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/40 bg-white/5 text-white placeholder-slate-400 text-sm transition"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In with Email'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-xs text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium text-purple-400 hover:text-purple-300 transition">
                Sign Up
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}


