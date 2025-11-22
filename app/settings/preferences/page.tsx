'use client'

import { useState, useEffect } from 'react'
import { Bell, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

export default function PreferencesPage() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [inAppNotifications, setInAppNotifications] = useState(true)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', user.id)
        .single()

      if (userData?.preferences) {
        const prefs = userData.preferences as any
        setEmailNotifications(prefs.notifications?.email !== false)
        setInAppNotifications(prefs.notifications?.inApp !== false)
      }
    } catch (err: any) {
      console.error('Error fetching preferences:', err)
      showToast({ type: 'error', title: 'Failed to load preferences' })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEmailNotifications = async (checked: boolean) => {
    setEmailNotifications(checked)
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('users')
        .update({
          preferences: {
            notifications: {
              email: checked,
              inApp: inAppNotifications,
            },
          },
        })
        .eq('id', user.id)

      if (error) throw error
      showToast({ type: 'success', title: 'Email notifications updated' })
    } catch (err: any) {
      setEmailNotifications(!checked)
      showToast({ type: 'error', title: 'Update failed', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleInAppNotifications = async (checked: boolean) => {
    setInAppNotifications(checked)
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('users')
        .update({
          preferences: {
            notifications: {
              email: emailNotifications,
              inApp: checked,
            },
          },
        })
        .eq('id', user.id)

      if (error) throw error
      showToast({ type: 'success', title: 'In-app notifications updated' })
    } catch (err: any) {
      setInAppNotifications(!checked)
      showToast({ type: 'error', title: 'Update failed', message: err.message })
    } finally {
      setSaving(false)
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
      {/* Notification Settings */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2 font-space">Notifications</h2>
          <p className="text-sm text-[#a0a0a0] font-sans">
            Choose how you want to receive notifications
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#a0a0a0]" />
              <div>
                <p className="font-medium text-white text-sm font-sans">Email Notifications</p>
                <p className="text-xs text-[#a0a0a0] font-sans mt-0.5">
                  Receive email updates about your account and sessions
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => handleToggleEmailNotifications(e.target.checked)}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#2a2a2a] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00d4aa]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00d4aa] disabled:opacity-50"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#a0a0a0]" />
              <div>
                <p className="font-medium text-white text-sm font-sans">In-App Notifications</p>
                <p className="text-xs text-[#a0a0a0] font-sans mt-0.5">
                  Show notifications within the application
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={inAppNotifications}
                onChange={(e) => handleToggleInAppNotifications(e.target.checked)}
                disabled={saving}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#2a2a2a] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00d4aa]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00d4aa] disabled:opacity-50"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
