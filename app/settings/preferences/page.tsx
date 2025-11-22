'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Clock, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { GlowCard } from '@/components/ui/spotlight-card'

export default function PreferencesPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
      setError('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const preferences = {
        notifications: {
          email: emailNotifications,
          inApp: inAppNotifications,
        },
        sessionDefaults: {
          duration: sessionDuration,
        },
        autoSaveTranscripts,
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ preferences })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess('Preferences saved successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error saving preferences:', err)
      setError(err.message || 'Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-400">{success}</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Notification Settings */}
      <GlowCard glowColor="purple" customSize className="p-6 bg-card/60 dark:bg-black/60">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-space font-bold text-foreground mb-2">Notifications</h2>
            <p className="text-sm text-foreground/60 font-sans">
              Choose how you want to receive notifications
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border/40">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-foreground/60 font-sans">
                    Receive email updates about your account and sessions
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border/40">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-medium text-foreground">In-App Notifications</p>
                  <p className="text-sm text-foreground/60 font-sans">
                    Show notifications within the application
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={inAppNotifications}
                  onChange={(e) => setInAppNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </div>
      </GlowCard>

      {/* Session Defaults */}
      <GlowCard glowColor="emerald" customSize className="p-6 bg-card/60 dark:bg-black/60">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-space font-bold text-foreground mb-2">Session Defaults</h2>
            <p className="text-sm text-foreground/60 font-sans">
              Configure default settings for your training sessions
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-emerald-400" />
                <Label htmlFor="sessionDuration" className="font-medium text-foreground">
                  Default Session Duration (minutes)
                </Label>
              </div>
              <Input
                id="sessionDuration"
                type="number"
                min="5"
                max="120"
                step="5"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(Math.max(5, Math.min(120, parseInt(e.target.value) || 30)))}
                className="w-32 bg-background/50 border-border/40"
              />
              <p className="text-xs text-foreground/50 mt-1 font-sans">
                Recommended: 15-30 minutes for optimal practice sessions
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border/40">
              <div>
                <p className="font-medium text-foreground">Auto-Save Transcripts</p>
                <p className="text-sm text-foreground/60 font-sans">
                  Automatically save session transcripts for later review
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSaveTranscripts}
                  onChange={(e) => setAutoSaveTranscripts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>
      </GlowCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

