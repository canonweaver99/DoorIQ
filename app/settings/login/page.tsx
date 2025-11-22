'use client'

import { useState, useEffect } from 'react'
import { Lock, Key, LogOut, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'

export default function LoginSettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    fetchUserEmail()
  }, [])

  const fetchUserEmail = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || null)
      }
    } catch (err) {
      console.error('Error fetching user email:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      showToast({ type: 'error', title: 'Email not found' })
      return
    }

    setResettingPassword(true)
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/reset-password`,
      })

      if (error) throw error

      showToast({ 
        type: 'success', 
        title: 'Password reset email sent',
        message: 'Check your email for a password reset link'
      })
    } catch (err: any) {
      console.error('Error sending password reset:', err)
      showToast({ 
        type: 'error', 
        title: 'Failed to send reset email',
        message: err.message || 'An error occurred'
      })
    } finally {
      setResettingPassword(false)
    }
  }

  const handleSignOutAllDevices = async () => {
    if (!confirm('Are you sure you want to sign out from all devices? You will need to sign in again.')) {
      return
    }

    setSigningOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      showToast({ type: 'success', title: 'Signed out successfully' })
      router.push('/auth/login')
    } catch (err: any) {
      console.error('Error signing out:', err)
      showToast({ 
        type: 'error', 
        title: 'Failed to sign out',
        message: err.message || 'An error occurred'
      })
      setSigningOut(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    if (!confirm('This will permanently delete all your data. Type DELETE to confirm.')) {
      return
    }

    setDeletingAccount(true)
    try {
      const response = await fetch('/api/settings/delete-account', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err: any) {
      console.error('Error deleting account:', err)
      showToast({ 
        type: 'error', 
        title: 'Failed to delete account',
        message: err.message || 'An error occurred'
      })
      setDeletingAccount(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d4aa]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Login Section */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
        <h2 className="text-xl font-semibold text-white mb-6 font-space">Login</h2>
        
        <div className="space-y-6">
          {/* Password */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <Lock className="w-5 h-5 text-[#a0a0a0]" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-1 font-space">Password</h3>
              <p className="text-sm text-[#a0a0a0] font-sans mb-3">
                To add a password to your account for the first time, you will need to use the{' '}
                <button
                  onClick={handlePasswordReset}
                  disabled={resettingPassword}
                  className="text-[#00d4aa] hover:text-[#00c19a] underline font-sans disabled:opacity-50"
                >
                  password reset page
                </button>
                {' '}so we can verify your identity.
              </p>
            </div>
          </div>

          {/* Passkey */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <Key className="w-5 h-5 text-[#a0a0a0]" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-1 font-space">Passkey</h3>
              <p className="text-sm text-[#a0a0a0] font-sans mb-3">
                Use your fingerprint, face, or screen lock to log in without needing to ever remember, reset, or use a password. Passkeys are encrypted and stored on your device and are not visible to anyone, including DoorIQ.
              </p>
              <button
                disabled
                className="px-4 py-2 text-sm text-[#a0a0a0] border border-[#2a2a2a] rounded-md hover:border-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-sans"
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
        <h2 className="text-xl font-semibold text-white mb-6 font-space">Security</h2>
        
        <div>
          <h3 className="text-sm font-semibold text-white mb-1 font-space">Sign out from all devices</h3>
          <p className="text-sm text-[#a0a0a0] font-sans mb-4">
            Logged in on a shared device but forgot to sign out? End all sessions by signing out from all devices.
          </p>
          <Button
            onClick={handleSignOutAllDevices}
            disabled={signingOut}
            className="bg-[#00d4aa] hover:bg-[#00c19a] text-black font-medium px-6 font-sans disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingOut ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out from all devices
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
        <h2 className="text-xl font-semibold text-red-400 mb-6 font-space">Delete your account</h2>
        
        <div>
          <p className="text-sm text-[#a0a0a0] font-sans mb-4">
            By deleting your account, you'll no longer be able to access any of your designs or log in to DoorIQ.{' '}
            {email && (
              <span className="text-white">
                Your DoorIQ account was created with {email}.
              </span>
            )}
          </p>
          <Button
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-sans disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deletingAccount ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete account
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

