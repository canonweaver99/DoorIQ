'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Building2, Save, Trash2, Lock, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AvatarUpload from '@/components/ui/AvatarUpload'
import { GlowCard } from '@/components/ui/spotlight-card'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AccountSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [updatingPreferences, setUpdatingPreferences] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Not authenticated')
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
        
        // Get organization name if user belongs to one
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

      // Fetch preferences
      const { data: prefsData } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', user.id)
        .single()

      if (prefsData?.preferences) {
        const prefs = prefsData.preferences as any
        setEmailNotifications(prefs.notifications?.email !== false)
      }
    } catch (err: any) {
      console.error('Error fetching user data:', err)
      setError('Failed to load account data')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userId) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('id', userId)

      if (updateError) throw updateError

      // Update email if changed
      if (email && email !== (await supabase.auth.getUser()).data.user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email })
        if (emailError) throw emailError
      }

      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setChangingPassword(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (passwordError) throw passwordError

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess('Password changed successfully')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error changing password:', err)
      setError(err.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleUpdateEmailPreferences = async () => {
    if (!userId) return

    setUpdatingPreferences(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          preferences: {
            notifications: {
              email: emailNotifications,
            },
          },
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setSuccess('Email preferences updated')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      console.error('Error updating preferences:', err)
      setError(err.message || 'Failed to update preferences')
    } finally {
      setUpdatingPreferences(false)
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

      // Sign out and redirect
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err: any) {
      console.error('Error deleting account:', err)
      setError(err.message || 'Failed to delete account')
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

      {/* Profile Information */}
      <GlowCard glowColor="purple" customSize className="p-6 bg-card/60 dark:bg-black/60">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-space font-bold text-foreground mb-2">Profile Information</h2>
            <p className="text-sm text-foreground/60 font-sans">Update your personal information</p>
          </div>

          {/* Avatar Upload */}
          <div className="flex items-start gap-6">
            <div>
              <Label className="text-sm font-medium text-foreground mb-2 block">Profile Picture</Label>
              {userId && (
                <AvatarUpload
                  currentAvatarUrl={avatarUrl}
                  userId={userId}
                  onUploadComplete={(url) => {
                    setAvatarUrl(url)
                    setSuccess('Avatar updated successfully')
                    setTimeout(() => setSuccess(null), 3000)
                  }}
                />
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fullName" className="text-sm font-medium text-foreground mb-2 block">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 bg-background/50 border-border/40"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium text-foreground mb-2 block">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background/50 border-border/40"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="company" className="text-sm font-medium text-foreground mb-2 block">
                Company / Organization
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="pl-10 bg-background/50 border-border/40"
                  placeholder="Acme Corp"
                  disabled
                />
                <p className="text-xs text-foreground/50 mt-1 font-sans">
                  Company name is managed by your organization admin
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleSaveProfile}
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
                Save Changes
              </>
            )}
          </Button>
        </div>
      </GlowCard>

      {/* Password Change */}
      <GlowCard glowColor="blue" customSize className="p-6 bg-card/60 dark:bg-black/60">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-space font-bold text-foreground mb-2">Change Password</h2>
            <p className="text-sm text-foreground/60 font-sans">Update your password to keep your account secure</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword" className="text-sm font-medium text-foreground mb-2 block">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 bg-background/50 border-border/40"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground mb-2 block">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 bg-background/50 border-border/40"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword || !confirmPassword}
            variant="outline"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            {changingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Changing...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </>
            )}
          </Button>
        </div>
      </GlowCard>

      {/* Email Preferences */}
      <GlowCard glowColor="green" customSize className="p-6 bg-card/60 dark:bg-black/60">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-space font-bold text-foreground mb-2">Email Preferences</h2>
            <p className="text-sm text-foreground/60 font-sans">Manage how you receive notifications</p>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border/40">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-foreground/60" />
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-foreground/60 font-sans">Receive email updates about your account</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => {
                  setEmailNotifications(e.target.checked)
                  handleUpdateEmailPreferences()
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>
        </div>
      </GlowCard>

      {/* Delete Account */}
      <GlowCard glowColor="red" customSize className="p-6 bg-card/60 dark:bg-black/60 border-red-500/20">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-space font-bold text-red-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-foreground/60 font-sans">Permanently delete your account and all data</p>
          </div>

          <Button
            onClick={handleDeleteAccount}
            variant="destructive"
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </GlowCard>
    </div>
  )
}

