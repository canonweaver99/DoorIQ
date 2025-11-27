'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

interface SimpleAvatarUploadProps {
  currentAvatarUrl?: string | null
  userId: string
  onUploadComplete?: (url: string) => void
}

export function SimpleAvatarUpload({ currentAvatarUrl, userId, onUploadComplete }: SimpleAvatarUploadProps) {
  const supabase = createClient()
  const { showToast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setAvatarUrl(currentAvatarUrl || null)
  }, [currentAvatarUrl])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return
    }

    const file = event.target.files[0]
    
    if (!file.type.startsWith('image/')) {
      showToast({ type: 'error', title: 'Invalid file type', message: 'Please select an image file' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast({ type: 'error', title: 'File too large', message: 'Image size must be less than 5MB' })
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `profile-${userId}-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profile pics')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '3600'
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profile pics')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      window.dispatchEvent(new CustomEvent('avatar:updated', { detail: { url: publicUrl } }))
      
      if (onUploadComplete) {
        onUploadComplete(publicUrl)
      }

      showToast({ type: 'success', title: 'Profile photo updated' })
    } catch (err: any) {
      console.error('Error uploading avatar:', err)
      const errorMessage = err?.message || err?.toString() || 'Unknown error occurred'
      console.error('Error details:', { message: errorMessage, error: err })
      showToast({ 
        type: 'error', 
        title: 'Upload failed', 
        message: errorMessage 
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) {
      return
    }

    setUploading(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (error) throw error

      setAvatarUrl(null)
      window.dispatchEvent(new CustomEvent('avatar:updated', { detail: { url: null } }))
      if (onUploadComplete) {
        onUploadComplete('')
      }
      showToast({ type: 'success', title: 'Profile photo removed' })
    } catch (err: any) {
      console.error('Error removing avatar:', err)
      const errorMessage = err?.message || err?.toString() || 'Unknown error occurred'
      console.error('Error details:', { message: errorMessage, error: err })
      showToast({ 
        type: 'error', 
        title: 'Failed to remove photo', 
        message: errorMessage 
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {avatarUrl && (
        <button
          onClick={handleRemovePhoto}
          disabled={uploading}
          className="text-sm text-[#a0a0a0] hover:text-white transition-colors text-left disabled:opacity-50 font-sans"
        >
          Remove photo
        </button>
      )}
      <label
        htmlFor="avatar-upload"
        className="text-sm text-[#a0a0a0] hover:text-white cursor-pointer transition-colors inline-flex items-center gap-2 font-sans border border-[#2a2a2a] hover:border-[#2a2a2a] rounded px-4 py-1.5 w-fit"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Uploading...
          </>
        ) : (
          'Change photo'
        )}
      </label>
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
        ref={fileInputRef}
      />
    </div>
  )
}
