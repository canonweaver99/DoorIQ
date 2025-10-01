"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { LogIn, Mail, Lock } from 'lucide-react'
import confetti from 'canvas-confetti'

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

      // Celebrate with confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#ec4899', '#3b82f6', '#06b6d4'],
        ticks: 300,
        gravity: 1,
        decay: 0.94,
        startVelocity: 30,
      })

      // Small delay to show confetti before navigation
      setTimeout(() => {
        router.push('/trainer/select-homeowner')
        router.refresh()
      }, 500)
    } catch (error: any) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-800/70 to-slate-900 rounded-3xl shadow-2xl p-8 flex flex-col items-center border border-slate-700 text-slate-100">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 mb-6 shadow-lg border border-slate-700">
          <LogIn className="w-7 h-7 text-slate-100" />
        </div>
        <h1 className="text-2xl font-semibold mb-2 text-center">Sign in with email</h1>
        <p className="text-slate-400 text-sm mb-6 text-center">Practice smarter with DoorIQ. Join your team in seconds.</p>

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


