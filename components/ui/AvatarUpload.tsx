'use client'

import { useState, useRef } from 'react'
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return
      }
      const file = event.target.files[0]
      // Show local preview first with basic square crop hint
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
    } catch {}
  }

  const uploadAvatar = async () => {
    try {
      if (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) return
      setUploading(true)
      setUploadSuccess(false)
      const file = fileInputRef.current.files[0]
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
      setPreviewUrl(null)
      setUploadSuccess(true)
      
      if (onUploadComplete) {
        onUploadComplete(publicUrl)
      }

      // Reset success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      
      // Show specific error message
      const errorMessage = error.message || 'Unknown error'
      if (errorMessage.includes('Bucket not found') || errorMessage.includes('bucket')) {
        alert('Avatar storage not configured yet. Please contact support or create the "avatars" bucket in Supabase Storage.')
      } else {
        alert(`Error uploading avatar: ${errorMessage}`)
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* Avatar Preview */}
        <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-800 border-4 border-slate-700 flex items-center justify-center">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
          onChange={onFileSelected}
          disabled={uploading}
          className="hidden"
          ref={fileInputRef}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-3 py-1.5 text-xs rounded-md bg-white/10 border border-white/15 hover:bg-white/15 text-white"
        >
          Choose File
        </button>
        <button
          onClick={uploadAvatar}
          disabled={uploading || !previewUrl}
          className="px-3 py-1.5 text-xs rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-50 border border-white/10"
        >
          {uploading ? 'Uploading...' : previewUrl ? 'Save Avatar' : 'Upload'}
        </button>
        {previewUrl && !uploading && (
          <button
            onClick={() => setPreviewUrl(null)}
            className="px-3 py-1.5 text-xs rounded-md bg-white/10 border border-white/15 hover:bg-white/15 text-white"
          >
            Cancel
          </button>
        )}
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

