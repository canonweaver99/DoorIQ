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
      <div className="py-4 border-b border-[#2a2a2a] last:border-0">
        <Label className="text-sm font-semibold text-white mb-2 block font-space">
          {label}
        </Label>
        {isEditing ? (
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1">
              <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
              <Input
                type={type}
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="pl-10 bg-[#0a0a0a] border-[#2a2a2a] text-white focus:border-[#00d4aa] focus:ring-[#00d4aa]/20"
                autoFocus
              />
            </div>
            <button
              onClick={() => saveField(field)}
              disabled={saving}
              className="px-4 py-2 text-sm text-[#00d4aa] hover:bg-[#1a1a1a] rounded transition-colors disabled:opacity-50 font-sans"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Save'
              )}
            </button>
            <button
              onClick={cancelEditing}
              disabled={saving}
              className="px-4 py-2 text-sm text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a] rounded transition-colors disabled:opacity-50 font-sans"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mt-1">
            <p className="text-white text-sm font-sans">{value || 'Not set'}</p>
            {!disabled && (
              <button
                onClick={() => startEditing(field, value)}
                className="px-4 py-1.5 text-sm text-[#a0a0a0] hover:text-white border border-[#2a2a2a] hover:border-[#2a2a2a] rounded transition-colors font-sans"
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
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
      {/* Profile Photo Section */}
      <div className="mb-8 pb-8 border-b border-[#2a2a2a]">
        <Label className="text-sm font-semibold text-white mb-4 block font-space">
          Profile Photo
        </Label>
        <div className="flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#2a2a2a] border border-[#2a2a2a]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-10 h-10 text-[#666]" />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
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
        <div className="mt-8 pt-6 border-t border-[#2a2a2a]">
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-[#00d4aa] hover:bg-[#00c19a] text-black font-medium px-6 font-sans"
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
