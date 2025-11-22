'use client'

import { useState, useEffect } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

interface EmailPreferencesProps {
  userId: string
}

export function EmailPreferences({ userId }: EmailPreferencesProps) {
  const supabase = createClient()
  const { showToast } = useToast()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [userId])

  const fetchPreferences = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', userId)
        .single()

      if (data?.preferences) {
        const prefs = data.preferences as any
        setEmailNotifications(prefs.notifications?.email !== false)
      }
    } catch (err) {
      console.error('Error fetching preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (checked: boolean) => {
    setEmailNotifications(checked)
    setUpdating(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          preferences: {
            notifications: {
              email: checked,
            },
          },
        })
        .eq('id', userId)

      if (error) throw error

      showToast({ 
        type: 'success', 
        title: 'Email preferences updated' 
      })
    } catch (err: any) {
      console.error('Error updating preferences:', err)
      setEmailNotifications(!checked) // Revert on error
      showToast({ 
        type: 'error', 
        title: 'Update failed',
        message: err.message || 'Failed to update preferences'
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-[#00d4aa]" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2 font-space">Email Preferences</h2>
        <p className="text-sm text-[#a0a0a0] font-sans">Manage how you receive notifications</p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-[#a0a0a0]" />
          <div>
            <p className="font-medium text-white text-sm font-sans">Email Notifications</p>
            <p className="text-xs text-[#a0a0a0] mt-0.5 font-sans">Receive email updates about your account</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => handleToggle(e.target.checked)}
            disabled={updating}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-[#2a2a2a] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00d4aa]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00d4aa] disabled:opacity-50"></div>
        </label>
      </div>
    </div>
  )
}

