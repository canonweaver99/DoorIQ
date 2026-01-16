'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, Mail, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

interface AccountSetupProps {
  email: string
  sessionId?: string
  onComplete: () => void
}

export function AccountSetup({ email, sessionId, onComplete }: AccountSetupProps) {
  const [mode, setMode] = useState<'choose' | 'password'>('choose')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
  ]

  const allRequirementsMet = passwordRequirements.every((r) => r.met)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allRequirementsMet || !passwordsMatch) return

    setLoading(true)
    setError(null)

    try {
      // Call our API to set the password for the user created by webhook
      const response = await fetch('/api/onboarding/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          sessionId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set password')
      }

      console.log('✅ Password set successfully, waiting before sign in...')
      
      // Small delay to ensure password is propagated
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Sign in the user with the new password
      const supabase = createClient()
      console.log('🔐 Attempting sign in for:', email.toLowerCase())
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })

      if (signInError) {
        console.error('❌ Sign in error:', signInError)
        // If sign in fails, try once more after another delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password,
        })
        if (retryError) {
          throw new Error(retryError.message)
        }
      }
      
      console.log('✅ Sign in successful:', signInData?.user?.id)

      onComplete()
    } catch (err: any) {
      console.error('Password setup error:', err)
      setError(err.message || 'Failed to set up your account')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      if (typeof window === 'undefined') {
        throw new Error('OAuth must be initiated from browser')
      }

      const origin = window.location.origin

      // Store session info in sessionStorage as fallback (in case query params get lost)
      if (sessionId) {
        sessionStorage.setItem('onboarding_session_id', sessionId)
      }
      if (email) {
        sessionStorage.setItem('onboarding_email', email)
      }
      sessionStorage.setItem('onboarding_redirect', '/onboarding')

      // Build callback URL with onboarding context
      const callbackUrl = `${origin}/auth/callback?next=/onboarding&email=${encodeURIComponent(email)}&session_id=${sessionId || ''}`

      console.log('🔐 Initiating Google OAuth with callback:', callbackUrl)

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            // Hint the email to Google for faster sign-in
            login_hint: email,
          },
        },
      })

      if (oauthError) {
        throw oauthError
      }

      if (data?.url) {
        window.location.replace(data.url)
        return
      }

      throw new Error('Failed to get OAuth URL')
    } catch (err: any) {
      console.error('Google signup error:', err)
      setError(err.message || 'Failed to sign up with Google')
      setLoading(false)
    }
  }

  if (mode === 'choose') {
    return (
      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="font-space text-3xl font-bold text-white mb-3">
            Create Your Account
          </h1>
          <p className="text-white/70">
            Set up your account to access DoorIQ
          </p>
        </div>

        {/* Email display */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide mb-0.5">
                Your Email
              </p>
              <p className="text-white font-medium">{email}</p>
            </div>
          </div>
        </div>

        {/* Auth options */}
        <div className="space-y-4">
          <Button
            onClick={handleGoogleSignUp}
            disabled={loading}
            variant="outline"
            className="w-full h-14 bg-white hover:bg-gray-100 text-gray-900 border-0 font-medium text-base"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Image
                src="/google.svg"
                alt="Google"
                width={20}
                height={20}
                className="mr-3"
              />
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0A0420] text-white/50">or</span>
            </div>
          </div>

          <Button
            onClick={() => setMode('password')}
            disabled={loading}
            className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-medium text-base"
          >
            <Lock className="w-5 h-5 mr-2" />
            Create Password
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-purple-400" />
        </div>
        <h1 className="font-space text-3xl font-bold text-white mb-3">
          Create Your Password
        </h1>
        <p className="text-white/70">
          Set a secure password for your account
        </p>
      </div>

      {/* Email display */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Mail className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wide mb-0.5">
              Account Email
            </p>
            <p className="text-white font-medium">{email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-6">
        {/* Password field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-white/80">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/40 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Password requirements */}
          <div className="space-y-1.5 mt-3">
            {passwordRequirements.map((req, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    req.met
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-white/10 text-white/30'
                  }`}
                >
                  {req.met && <CheckCircle2 className="w-3 h-3" />}
                </div>
                <span
                  className={`text-sm ${
                    req.met ? 'text-green-400' : 'text-white/50'
                  }`}
                >
                  {req.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-white/80">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/40"
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-red-400 text-sm">Passwords do not match</p>
          )}
          {passwordsMatch && (
            <p className="text-green-400 text-sm flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Passwords match
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setMode('choose')}
            className="flex-1 h-12 bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={loading || !allRequirementsMet || !passwordsMatch}
            className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

