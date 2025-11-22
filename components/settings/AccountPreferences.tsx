'use client'

import { useState, useEffect } from 'react'
import { Globe, Target, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'

interface AccountPreferencesProps {
  userId: string
}

export function AccountPreferences({ userId }: AccountPreferencesProps) {
  const supabase = createClient()
  const { showToast } = useToast()
  const [language, setLanguage] = useState('en')
  const [usage, setUsage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
        setLanguage(prefs.language || 'en')
        setUsage(prefs.usage || '')
      }
    } catch (err) {
      console.error('Error fetching preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          preferences: {
            language,
            usage,
          },
        })
        .eq('id', userId)

      if (error) throw error

      showToast({ 
        type: 'success', 
        title: 'Preferences updated' 
      })
    } catch (err: any) {
      console.error('Error updating preferences:', err)
      showToast({ 
        type: 'error', 
        title: 'Update failed',
        message: err.message || 'Failed to update preferences'
      })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = language !== 'en' || usage !== ''

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
        <h2 className="text-xl font-semibold text-white mb-2 font-space">Account Preferences</h2>
        <p className="text-sm text-[#a0a0a0] font-sans">Customize your account settings</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium text-[#a0a0a0] mb-2 flex items-center gap-2 font-sans">
            <Globe className="w-4 h-4" />
            Language
          </Label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa]/20 font-sans"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
          </select>
        </div>

        <div>
          <Label className="text-sm font-medium text-[#a0a0a0] mb-2 flex items-center gap-2 font-sans">
            <Target className="w-4 h-4" />
            What will you be using DoorIQ for?
          </Label>
          <select
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md text-white text-sm focus:outline-none focus:border-[#00d4aa] focus:ring-1 focus:ring-[#00d4aa]/20 font-sans"
          >
            <option value="">Select an option</option>
            <option value="sales-training">Sales Training</option>
            <option value="coaching">Coaching</option>
            <option value="practice">Practice Sessions</option>
            <option value="assessment">Assessment & Evaluation</option>
            <option value="team-development">Team Development</option>
            <option value="other">Other</option>
          </select>
        </div>

        {hasChanges && (
          <div className="pt-4 border-t border-[#2a2a2a]">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#00d4aa] hover:bg-[#00c19a] text-black font-medium px-6 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

