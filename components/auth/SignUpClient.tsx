"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import Link from 'next/link'
import { User, Hash, Mail, Lock } from 'lucide-react'

export function SignUpClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [repId, setRepId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      if (authData.user) {
        const res = await fetch('/api/users/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: authData.user.id,
            email,
            full_name: fullName,
            rep_id: repId,
          })
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to create profile')
      }

      router.push('/trainer/select-homeowner')
      router.refresh()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm bg-gradient-to-b from-slate-800/70 to-slate-900 rounded-3xl shadow-2xl p-8 flex flex-col items-center border border-slate-700 text-slate-100">
        <h1 className="text-2xl font-semibold mb-2 text-center">Create your account</h1>
        <p className="text-slate-400 text-sm mb-6 text-center">Join DoorIQ Training in seconds.</p>

        <form onSubmit={handleSignUp} className="w-full flex flex-col gap-3 mb-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-slate-800 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="Full name"
              autoComplete="name"
            />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Hash className="w-4 h-4" />
            </span>
            <input
              id="repId"
              type="text"
              value={repId}
              onChange={(e) => setRepId(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-slate-800 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="Rep ID (e.g., REP-001)"
              autoComplete="off"
            />
          </div>
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
              minLength={6}
              className="w-full pl-10 pr-10 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 bg-slate-800 text-slate-100 placeholder-slate-400 text-sm"
              placeholder="Create a password"
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-slate-400">Minimum 6 characters</p>
          </div>

          {error && (
            <div className="text-sm text-red-400">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-b from-blue-600 to-blue-700 text-white font-medium py-2 rounded-xl shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center w-full">
          <span className="text-sm text-slate-300">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}


