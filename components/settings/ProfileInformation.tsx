'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Building2, Edit2, X, Check, Loader2, Shield, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SimpleAvatarUpload } from './SimpleAvatarUpload'
import { useToast } from '@/components/ui/toast'

interface ProfileInformationProps {
  userId: string
  initialFullName: string
  initialEmail: string
  initialCompany: string
  initialRole: string
  initialTeamName: string
  initialAvatarUrl: string | null
}

export function ProfileInformation({
  userId,
  initialFullName,
  initialEmail,
  initialCompany,
  initialRole,
  initialTeamName,
  initialAvatarUrl,
}: ProfileInformationProps) {
  const supabase = createClient()
  const { showToast } = useToast()
  
  const [fullName, setFullName] = useState(initialFullName)
  const [email, setEmail] = useState(initialEmail)
  const [company] = useState(initialCompany)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  
  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValue, setTempValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const hasNameChange = editingField === 'fullName' 
      ? tempValue !== initialFullName 
      : fullName !== initialFullName
    const hasEmailChange = editingField === 'email'
      ? tempValue !== initialEmail
      : email !== initialEmail
    setHasChanges(hasNameChange || hasEmailChange)
  }, [fullName, email, initialFullName, initialEmail, editingField, tempValue])

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field)
    setTempValue(currentValue)
  }

  const cancelEditing = () => {
    setEditingField(null)
    setTempValue('')
  }

  const saveField = async (field: string) => {
    setSaving(true)
    try {
      if (field === 'fullName') {
        const { error } = await supabase
          .from('users')
          .update({ full_name: tempValue.trim() })
          .eq('id', userId)

        if (error) throw error
        setFullName(tempValue.trim())
        showToast({ type: 'success', title: 'Name updated successfully' })
      } else if (field === 'email') {
        const { error } = await supabase.auth.updateUser({ email: tempValue.trim() })
        if (error) throw error
        setEmail(tempValue.trim())
        showToast({ type: 'success', title: 'Email updated successfully' })
      }
      setEditingField(null)
      setTempValue('')
    } catch (err: any) {
      console.error('Error updating field:', err)
      showToast({ 
        type: 'error', 
        title: 'Update failed', 
        message: err.message || 'Failed to update field' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      const updates: any = {}
      const currentFullName = editingField === 'fullName' ? tempValue.trim() : fullName.trim()
      const currentEmail = editingField === 'email' ? tempValue.trim() : email.trim()
      
      if (currentFullName !== initialFullName) {
        updates.full_name = currentFullName
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', userId)

        if (error) throw error
        setFullName(currentFullName)
      }

      if (currentEmail !== initialEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email: currentEmail })
        if (emailError) throw emailError
        setEmail(currentEmail)
      }

      setEditingField(null)
      setTempValue('')
      showToast({ type: 'success', title: 'Profile updated successfully' })
      setHasChanges(false)
    } catch (err: any) {
      console.error('Error updating profile:', err)
      showToast({ 
        type: 'error', 
        title: 'Update failed', 
        message: err.message || 'Failed to update profile' 
      })
    } finally {
      setSaving(false)
    }
  }

  const FieldRow = ({ 
    label, 
    value, 
    field, 
    icon: Icon, 
    type = 'text',
    disabled = false 
  }: { 
    label: string
    value: string
    field: string
    icon: any
    type?: string
    disabled?: boolean
  }) => {
    const isEditing = editingField === field
    
    return (
      <div className="py-3 sm:py-4 border-b border-[#2a2a2a] last:border-0">
        <Label className="text-sm font-semibold text-white mb-2 sm:mb-3 block font-space">
          {label}
        </Label>
        {isEditing ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 mt-2">
            <div className="relative flex-1">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#666] z-10" />
              <Input
                type={type}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="pl-10 sm:pl-12 h-12 sm:h-10 bg-[#0a0a0a] border-[#2a2a2a] text-white text-base sm:text-sm focus:border-[#00d4aa] focus:ring-[#00d4aa]/20 w-full"
                autoFocus
              />
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              <button
                onClick={() => saveField(field)}
                disabled={saving}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2 min-h-[48px] sm:min-h-0 text-sm text-[#00d4aa] hover:bg-[#1a1a1a] rounded transition-colors disabled:opacity-50 font-sans touch-manipulation active:scale-95"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto sm:mx-0" />
                ) : (
                  'Save'
                )}
              </button>
              <button
                onClick={cancelEditing}
                disabled={saving}
                className="flex-1 sm:flex-none px-4 py-3 sm:py-2 min-h-[48px] sm:min-h-0 text-sm text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a] rounded transition-colors disabled:opacity-50 font-sans touch-manipulation active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mt-1">
            <p className="text-white text-sm sm:text-base font-sans break-words flex-1">{value || 'Not set'}</p>
            {!disabled && (
              <button
                onClick={() => startEditing(field, value)}
                className="px-4 py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 text-sm text-[#a0a0a0] hover:text-white border border-[#2a2a2a] hover:border-[#2a2a2a] rounded transition-colors font-sans touch-manipulation active:scale-95 w-full sm:w-auto"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-4 sm:p-6 md:p-8">
      {/* Profile Photo Section */}
      <div className="mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-[#2a2a2a]">
        <Label className="text-sm font-semibold text-white mb-3 sm:mb-4 block font-space">
          Profile Photo
        </Label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-[#2a2a2a] border border-[#2a2a2a]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Failed to load avatar image:', avatarUrl)
                    setAvatarUrl(null)
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 sm:w-10 sm:h-10 text-[#666]" />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {userId && (
              <SimpleAvatarUpload
                currentAvatarUrl={avatarUrl}
                userId={userId}
                onUploadComplete={(url) => {
                  setAvatarUrl(url || null)
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-0">
        <FieldRow
          label="Name"
          value={fullName}
          field="fullName"
          icon={User}
        />
        <FieldRow
          label="Email address"
          value={email}
          field="email"
          icon={Mail}
          type="email"
        />
        <FieldRow
          label="Company / Organization"
          value={company}
          field="company"
          icon={Building2}
          disabled
        />
        <FieldRow
          label="Role"
          value={initialRole.charAt(0).toUpperCase() + initialRole.slice(1)}
          field="role"
          icon={Shield}
          disabled
        />
        <FieldRow
          label="Team"
          value={initialTeamName}
          field="team"
          icon={Users}
          disabled
        />
      </div>

      {/* Save Changes Button */}
      {hasChanges && (
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#2a2a2a]">
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full sm:w-auto bg-white hover:bg-gray-100 text-black font-medium px-6 py-3 sm:py-2 min-h-[48px] sm:min-h-0 font-sans border border-gray-300 touch-manipulation active:scale-95"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
