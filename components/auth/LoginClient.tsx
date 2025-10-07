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

      // Navigate to trainer
      router.push('/trainer/select-homeowner')
      router.refresh()
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-800/70 to-slate-900 rounded-3xl shadow-2xl p-8 flex flex-col items-center border border-slate-700 text-slate-100">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 mb-6 shadow-lg border border-slate-700">
          <LogIn className="w-7 h-7 text-slate-100" />
        </div>
        <h1 className="text-2xl font-semibold mb-2 text-center">Sign in</h1>
        <p className="text-slate-400 text-sm mb-6 text-center">Practice smarter with DoorIQ. Join your team in seconds.</p>

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="w-full bg-white text-slate-900 font-medium py-2.5 px-4 rounded-xl shadow hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 transition flex items-center justify-center gap-3 mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="w-full flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-slate-700"></div>
          <span className="text-slate-400 text-sm">or</span>
          <div className="flex-1 h-px bg-slate-700"></div>
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-3 mb-2">
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
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-slate-800 text-slate-100 placeholder-slate-400 text-sm"
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
              className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-slate-800 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-b from-blue-600 to-blue-700 text-white font-medium py-2 rounded-xl shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Signing in...' : 'Get Started'}
          </button>
        </form>

        <div className="mt-4 text-center w-full">
          <span className="text-sm text-slate-300">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-blue-400 hover:text-blue-300">
              Sign up
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}


