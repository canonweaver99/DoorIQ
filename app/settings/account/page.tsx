'use client'

import { useState, useEffect } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ProfileInformation } from '@/components/settings/ProfileInformation'
import { PasswordChange } from '@/components/settings/PasswordChange'
import { EmailPreferences } from '@/components/settings/EmailPreferences'
import { AccountPreferences } from '@/components/settings/AccountPreferences'
import { useToast } from '@/components/ui/toast'

export default function AccountSettingsPage() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showToast({ type: 'error', title: 'Not authenticated' })
        return
      }

      setUserId(user.id)
      setEmail(user.email || '')

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, avatar_url, organization_id')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('Error fetching user data:', userError)
        return
      }

      if (userData) {
        setFullName(userData.full_name || '')
        setAvatarUrl(userData.avatar_url)
        
        if (userData.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', userData.organization_id)
            .single()
          
          if (orgData) {
            setCompany(orgData.name)
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err)
      showToast({ type: 'error', title: 'Failed to load account data' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    if (!confirm('This will permanently delete all your data. Type DELETE to confirm.')) {
      return
    }

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
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d4aa]" />
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="text-center py-12">
        <p className="text-[#a0a0a0] font-sans">Unable to load account data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <ProfileInformation
        userId={userId}
        initialFullName={fullName}
        initialEmail={email}
        initialCompany={company}
        initialAvatarUrl={avatarUrl}
      />

      {/* Password Change */}
      <PasswordChange />

      {/* Account Preferences */}
      <AccountPreferences userId={userId} />

      {/* Email Preferences */}
      <EmailPreferences userId={userId} />

      {/* Delete Account */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-red-400 mb-2 font-space">Danger Zone</h2>
          <p className="text-sm text-[#a0a0a0] font-sans">Permanently delete your account and all data</p>
        </div>

        <Button
          onClick={handleDeleteAccount}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>
      </div>
    </div>
  )
}
