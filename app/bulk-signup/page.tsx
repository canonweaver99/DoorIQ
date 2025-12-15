'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AnimatedBackground } from '@/components/ui/animated-background'
import { User, Eye, EyeOff, Loader2, CheckCircle2, XCircle, Building2, Users } from 'lucide-react'

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-200 focus-within:border-purple-400/70 focus-within:bg-purple-500/10 focus-within:shadow-[0_0_20px_rgba(168,85,247,0.15)]">
    {children}
  </div>
)

function BulkSignupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'rep' as 'rep' | 'manager',
    organizationName: '',
    teamName: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Check for invite token on mount
  useEffect(() => {
    if (!inviteToken) {
      setError('Signups are invite-only. Please use a valid invite link.')
    }
  }, [inviteToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.role || !formData.organizationName || !formData.teamName) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (!inviteToken) {
      setError('Signups are invite-only. Please use a valid invite link.')
      setLoading(false)
      return
    }

    try {
      // Create account via API
      const response = await fetch('/api/auth/bulk-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          role: formData.role,
          organization_name: formData.organizationName,
          team_name: formData.teamName,
          invite_token: inviteToken
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      // Sign in the user immediately
      const supabase = createClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (authError) {
        throw new Error(authError.message || 'Failed to sign in')
      }

      setSuccess(true)
      
      // Redirect to home after a brief delay
      setTimeout(() => {
        router.push('/home')
      }, 1500)

    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[100dvh] w-[100dvw] bg-black relative flex items-start md:items-center justify-center p-4 pt-8 md:pt-4 overflow-y-auto">
      <AnimatedBackground />
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-space font-light tracking-tight leading-tight text-white">
            Join <span className="font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">DoorIQ</span>
          </h1>
          <p className="text-white/80 text-base leading-relaxed font-sans">Create your account and start practicing</p>

          {success ? (
            <div className="bg-white/[0.02] border-2 border-white/20 rounded-lg p-8 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
              <p className="text-white/80 mb-4">Redirecting you to the app...</p>
              <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto" />
            </div>
          ) : (
            <form className="space-y-3.5" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Full Name</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="John Doe"
                      className="w-full bg-transparent text-sm py-3 px-3 pl-11 rounded-2xl focus:outline-none text-white placeholder-slate-500"
                      required
                    />
                  </div>
                </GlassInputWrapper>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Email Address</label>
                <GlassInputWrapper>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@company.com"
                    className="w-full bg-transparent text-sm py-3 px-3 rounded-2xl focus:outline-none text-white placeholder-slate-500"
                    required
                  />
                </GlassInputWrapper>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Create a password"
                      className="w-full bg-transparent text-sm py-3 px-3 pr-11 rounded-2xl focus:outline-none text-white placeholder-slate-500"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
                <p className="mt-2 text-xs text-slate-400">Minimum 6 characters</p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Confirm Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm your password"
                      className="w-full bg-transparent text-sm py-3 px-3 pr-11 rounded-2xl focus:outline-none text-white placeholder-slate-500"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Role</label>
                <GlassInputWrapper>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'rep' | 'manager' })}
                    className="w-full bg-transparent text-sm py-3 px-3 rounded-2xl focus:outline-none text-white"
                    required
                  >
                    <option value="" className="bg-slate-900">Select role...</option>
                    <option value="rep" className="bg-slate-900">Rep</option>
                    <option value="manager" className="bg-slate-900">Manager</option>
                  </select>
                </GlassInputWrapper>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Organization Name</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      placeholder="e.g. Legion"
                      className="w-full bg-transparent text-sm py-3 px-3 pl-11 rounded-2xl focus:outline-none text-white placeholder-slate-500"
                      required
                    />
                  </div>
                </GlassInputWrapper>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Team Name</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.teamName}
                      onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                      placeholder="e.g. Sales Team A"
                      className="w-full bg-transparent text-sm py-3 px-3 pl-11 rounded-2xl focus:outline-none text-white placeholder-slate-500"
                      required
                    />
                  </div>
                </GlassInputWrapper>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-gray-200 text-gray-900 py-3.5 text-base font-bold tracking-tight hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-400">
            Already have an account?{' '}
            <a
              href="/auth/login"
              className="text-purple-400 hover:text-purple-300 hover:underline transition-colors font-medium"
            >
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function BulkSignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <BulkSignupPageContent />
    </Suspense>
  )
}
