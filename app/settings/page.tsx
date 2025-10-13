'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { Bell, Globe, Moon, Volume2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

type UserData = Database['public']['Tables']['users']['Row']

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    sessionReminders: true,
    weeklyReports: true,
    darkMode: true,
    soundEffects: true,
    language: 'en',
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setUserData(data)
      // Load preferences from localStorage or database
      const savedSettings = localStorage.getItem('userSettings')
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    }
    
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    // Save to localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings))
    
    // Could also save to database in a preferences column
    setMessage({ type: 'success', text: 'Settings saved successfully' })
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">Settings</h1>
          <p className="text-slate-400">Manage your app preferences</p>
        </div>

        {/* Notifications Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6 mb-6">
          <div className="flex items-center mb-6">
            <Bell className="w-5 h-5 text-purple-400 mr-2" />
            <h2 className="text-xl font-semibold text-white">Notifications</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-300">Email Notifications</p>
                <p className="text-sm text-slate-400 mt-1">
                  Receive updates about your training progress
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="w-5 h-5 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-300">Session Reminders</p>
                <p className="text-sm text-slate-400 mt-1">
                  Get reminded to practice daily
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.sessionReminders}
                onChange={(e) => setSettings({ ...settings, sessionReminders: e.target.checked })}
                className="w-5 h-5 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-300">Weekly Reports</p>
                <p className="text-sm text-slate-400 mt-1">
                  Receive weekly performance summaries
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.weeklyReports}
                onChange={(e) => setSettings({ ...settings, weeklyReports: e.target.checked })}
                className="w-5 h-5 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
              />
            </label>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6 mb-6">
          <div className="flex items-center mb-6">
            <Moon className="w-5 h-5 text-indigo-400 mr-2" />
            <h2 className="text-xl font-semibold text-white">Appearance</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-300">Sound Effects</p>
                <p className="text-sm text-slate-400 mt-1">
                  Play sounds during training sessions
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => setSettings({ ...settings, soundEffects: e.target.checked })}
                className="w-5 h-5 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
              />
            </label>
          </div>
        </div>

        {/* Language Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6 mb-6">
          <div className="flex items-center mb-6">
            <Globe className="w-5 h-5 text-cyan-400 mr-2" />
            <h2 className="text-xl font-semibold text-white">Language & Region</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-600/20 text-green-400 border border-green-600/50'
                : 'bg-red-600/20 text-red-400 border border-red-600/50'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  )
}
