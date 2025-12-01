'use client'

import { useState, useEffect } from 'react'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProfileInformation } from '@/components/settings/ProfileInformation'
import { EmailPreferences } from '@/components/settings/EmailPreferences'
import { AccountPreferences } from '@/components/settings/AccountPreferences'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AccountSettingsPage() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [teamName, setTeamName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)
      setEmail(user.email || '')

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name, avatar_url, organization_id, role, team_id')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('Error fetching user data:', userError)
        showToast({ 
          type: 'error', 
          title: 'Failed to load user data', 
          message: userError.message || 'Unable to fetch your profile information' 
        })
        return
      }

      if (userData) {
        setFullName(userData.full_name || '')
        setAvatarUrl(userData.avatar_url)
        setRole(userData.role || 'rep')
        
        // Fetch organization name for company field
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
        
        // Always prioritize team name over organization name
        if (userData.team_id) {
          const { data: teamData } = await supabase
            .from('teams')
            .select('name')
            .eq('id', userData.team_id)
            .single()
          
          if (teamData) {
            setTeamName(teamData.name)
          }
        } else if (userData.organization_id) {
          // Fallback to organization name only if no team exists
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', userData.organization_id)
            .single()
          
          if (orgData) {
            setTeamName(orgData.name)
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err)
      const errorMessage = err?.message || err?.toString() || 'Unknown error occurred'
      console.error('Error details:', { message: errorMessage, error: err })
      showToast({ 
        type: 'error', 
        title: 'Failed to load account data', 
        message: errorMessage 
      })
    } finally {
      setLoading(false)
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
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-[#00d4aa]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 font-space">Sign in to view your account</h3>
            <p className="text-sm text-[#a0a0a0] font-sans">
              Please sign in or create an account to access your account settings and preferences.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/auth/login" className="flex-1">
              <Button 
                variant="brand" 
                className="w-full flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup" className="flex-1">
              <Button 
                variant="default" 
                className="w-full flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
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
        initialRole={role}
        initialTeamName={teamName}
        initialAvatarUrl={avatarUrl}
      />

      {/* Account Preferences */}
      <AccountPreferences userId={userId} />

      {/* Email Preferences */}
      <EmailPreferences userId={userId} />
    </div>
  )
}
