'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProfileInformation } from '@/components/settings/ProfileInformation'
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
        showToast({ type: 'error', title: 'Not authenticated' })
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
        return
      }

      if (userData) {
        setFullName(userData.full_name || '')
        setAvatarUrl(userData.avatar_url)
        setRole(userData.role || 'rep')
        
        if (userData.organization_id) {
          const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', userData.organization_id)
            .single()
          
          if (orgData) {
            setCompany(orgData.name)
            setTeamName(orgData.name) // Use organization name as team name
          }
        } else if (userData.team_id) {
          // Fallback to team name if no organization
          const { data: teamData } = await supabase
            .from('teams')
            .select('name')
            .eq('id', userData.team_id)
            .single()
          
          if (teamData) {
            setTeamName(teamData.name)
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
