'use client'

import { useState, useEffect } from 'react'
import { Bell, Clock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'

export default function PreferencesPage() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [emailNotifications, setEmailNotifications] = useState(true)
  const [inAppNotifications, setInAppNotifications] = useState(true)
  const [sessionDuration, setSessionDuration] = useState(30)
  const [autoSaveTranscripts, setAutoSaveTranscripts] = useState(true)

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
        setSessionDuration(prefs.sessionDefaults?.duration || 30)
        setAutoSaveTranscripts(prefs.autoSaveTranscripts !== false)
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
            sessionDefaults: {
              duration: sessionDuration,
            },
            autoSaveTranscripts,
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
            sessionDefaults: {
              duration: sessionDuration,
            },
            autoSaveTranscripts,
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

  const handleSessionDurationChange = async (duration: number) => {
    setSessionDuration(duration)
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
              inApp: inAppNotifications,
            },
            sessionDefaults: {
              duration,
            },
            autoSaveTranscripts,
          },
        })
        .eq('id', user.id)

      if (error) throw error
      showToast({ type: 'success', title: 'Session duration updated' })
    } catch (err: any) {
      setSessionDuration(sessionDuration)
      showToast({ type: 'error', title: 'Update failed', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleAutoSave = async (checked: boolean) => {
    setAutoSaveTranscripts(checked)
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
              inApp: inAppNotifications,
            },
            sessionDefaults: {
              duration: sessionDuration,
            },
            autoSaveTranscripts: checked,
          },
        })
        .eq('id', user.id)

      if (error) throw error
      showToast({ type: 'success', title: 'Auto-save preference updated' })
    } catch (err: any) {
      setAutoSaveTranscripts(!checked)
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

      {/* Session Defaults */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-2 font-space">Session Defaults</h2>
          <p className="text-sm text-[#a0a0a0] font-sans">
            Configure default settings for your training sessions
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="sessionDuration" className="text-sm font-semibold text-white mb-2 block font-space">
              Default Session Duration (minutes)
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="w-4 h-4 text-[#666]" />
              <Input
                id="sessionDuration"
                type="number"
                min="5"
                max="120"
                step="5"
                value={sessionDuration}
                onChange={(e) => handleSessionDurationChange(Math.max(5, Math.min(120, parseInt(e.target.value) || 30)))}
                disabled={saving}
                className="w-32 bg-[#0a0a0a] border-[#2a2a2a] text-white focus:border-[#00d4aa] focus:ring-[#00d4aa]/20 font-sans"
              />
            </div>
            <p className="text-xs text-[#a0a0a0] mt-1 font-sans">
              Recommended: 15-30 minutes for optimal practice sessions
            </p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
            <div>
              <p className="font-medium text-white text-sm font-sans">Auto-Save Transcripts</p>
              <p className="text-xs text-[#a0a0a0] font-sans mt-0.5">
                Automatically save session transcripts for later review
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSaveTranscripts}
                onChange={(e) => handleToggleAutoSave(e.target.checked)}
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
