'use client'

import { useState } from 'react'
import { Upload, User, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userId: string
  onUploadComplete?: (url: string) => void
}

export default function AvatarUpload({ currentAvatarUrl, userId, onUploadComplete }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setUploadSuccess(false)

      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const supabase = createClient()

      // Upload file to Supabase storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      setAvatarUrl(publicUrl)
      setUploadSuccess(true)
      
      if (onUploadComplete) {
        onUploadComplete(publicUrl)
      }

      // Reset success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Error uploading avatar. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* Avatar Preview */}
        <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-800 border-4 border-slate-700 flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-16 h-16 text-slate-500" />
          )}
        </div>

        {/* Upload Button Overlay */}
        <label
          htmlFor="avatar-upload"
          className="absolute bottom-0 right-0 p-2 bg-purple-600 hover:bg-purple-500 rounded-full cursor-pointer transition-all shadow-lg border-2 border-slate-900"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : uploadSuccess ? (
            <CheckCircle2 className="w-5 h-5 text-white" />
          ) : (
            <Upload className="w-5 h-5 text-white" />
          )}
        </label>

        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="hidden"
        />
      </div>

      <div className="text-center">
        <p className="text-sm text-slate-300 font-medium">Profile Picture</p>
        <p className="text-xs text-slate-500 mt-1">Click the icon to upload</p>
      </div>

      {uploadSuccess && (
        <div className="text-xs text-green-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Avatar updated successfully!
        </div>
      )}
    </div>
  )
}

