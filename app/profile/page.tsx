'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { User, Mail, Shield, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AvatarUpload from '@/components/ui/AvatarUpload'

type UserData = Database['public']['Tables']['users']['Row']

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
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
      setFormData({
        full_name: data.full_name,
        email: data.email,
      })
    }
    
    setLoading(false)
  }

  const handleSave = async () => {
    if (!userData) return

    setSaving(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({
        full_name: formData.full_name,
        email: formData.email,
      })
      .eq('id', userData.id)

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully' })
      // Update local userData
      setUserData({ ...userData, ...formData })
    }

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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">Your Profile</h1>
          <p className="text-slate-400">Manage your personal information</p>
        </div>

        {/* Avatar Upload Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6 mb-6">
          <AvatarUpload 
            currentAvatarUrl={(userData as any)?.avatar_url}
            userId={userData?.id || ''}
            onUploadComplete={(url) => {
              setUserData({ ...userData!, avatar_url: url } as any)
            }}
          />
        </div>

        {/* Profile Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6 mb-6">
          <div className="flex items-center mb-6">
            <User className="w-5 h-5 text-purple-400 mr-2" />
            <h2 className="text-xl font-semibold text-white">Profile Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
          </div>
        </div>

        {/* Account Info Section */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6 mb-6">
          <div className="flex items-center mb-6">
            <Shield className="w-5 h-5 text-emerald-400 mr-2" />
            <h2 className="text-xl font-semibold text-white">Account Information</h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-300">Role</p>
                <p className="text-sm text-slate-400 mt-1">
                  {userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : 'Rep'}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-300">Virtual Earnings</p>
                <p className="text-sm text-slate-400 mt-1">
                  ${userData?.virtual_earnings.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-300">Member Since</p>
                <p className="text-sm text-slate-400 mt-1">
                  {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
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
            {saving ? 'Saving...' : 'Save Changes'}
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
