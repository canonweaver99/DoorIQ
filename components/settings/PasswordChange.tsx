'use client'

import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'

export function PasswordChange() {
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      showToast({ 
        type: 'error', 
        title: 'Passwords do not match',
        message: 'Please make sure both password fields match'
      })
      return
    }

    if (newPassword.length < 6) {
      showToast({ 
        type: 'error', 
        title: 'Password too short',
        message: 'Password must be at least 6 characters'
      })
      return
    }

    setChangingPassword(true)
    try {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (passwordError) throw passwordError

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast({ 
        type: 'success', 
        title: 'Password changed successfully' 
      })
    } catch (err: any) {
      console.error('Error changing password:', err)
      showToast({ 
        type: 'error', 
        title: 'Failed to change password',
        message: err.message || 'An error occurred while updating your password'
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const canSave = newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 6

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2 font-space">Change Password</h2>
        <p className="text-sm text-[#a0a0a0] font-sans">Update your password to keep your account secure</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="newPassword" className="text-sm font-medium text-[#a0a0a0] mb-2 block font-sans">
            New Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00d4aa] focus:ring-[#00d4aa]/20"
              placeholder="Enter new password"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#a0a0a0] mb-2 block font-sans">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00d4aa] focus:ring-[#00d4aa]/20"
              placeholder="Confirm new password"
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button
          onClick={handleChangePassword}
          disabled={changingPassword || !canSave}
          className="bg-white hover:bg-gray-100 text-black font-medium px-6 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {changingPassword ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Changing...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Update Password
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

