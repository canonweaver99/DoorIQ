'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, User, Loader2, CheckCircle2, X, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  userId: string
  onUploadComplete?: (url: string) => void
}

export default function AvatarUpload({ currentAvatarUrl, userId, onUploadComplete }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(false)
    
    if (!event.target.files || event.target.files.length === 0) {
      return
    }

    const file = event.target.files[0]
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0] || !previewUrl) {
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(false)

    try {
      const file = fileInputRef.current.files[0]
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `profile-${userId}-${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      const supabase = createClient()

      // Upload file directly - let Supabase handle bucket existence check
      // If bucket doesn't exist, we'll get a clear error message
      const { error: uploadError, data } = await supabase.storage
        .from('profile pics')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '3600'
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile pics')
        .getPublicUrl(filePath)

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      // Update state
      setAvatarUrl(publicUrl)
      setPreviewUrl(null)
      setSuccess(true)

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Callback
      if (onUploadComplete) {
        onUploadComplete(publicUrl)
      }

      // Dispatch event for header refresh
      window.dispatchEvent(new CustomEvent('avatar:updated', { detail: { url: publicUrl } }))

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)

    } catch (err: any) {
      console.error('Error uploading avatar:', err)
      
      // Provide helpful error messages
      const errorMessage = err?.message || err?.toString() || 'Unknown error'
      console.error('Error details:', { message: errorMessage, error: err })
      
      if (errorMessage.includes('not found') || errorMessage.includes('does not exist') || errorMessage.includes('Bucket not found')) {
        setError('Profile pics bucket not found. Please create a bucket named "profile pics" in Supabase Storage and run the migration SQL to set up permissions.')
      } else if (errorMessage.includes('permission') || errorMessage.includes('policy') || errorMessage.includes('403')) {
        setError('Permission denied. Please run the migration SQL file (053_create_profile_pics_bucket.sql) to set up storage policies.')
      } else {
        setError(`Failed to upload: ${errorMessage}`)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayUrl = previewUrl || avatarUrl

  return (
    <div className="space-y-4">
      {/* Avatar Display */}
      <div className="flex items-start gap-6">
        <div className="relative flex-shrink-0">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border ring-2 ring-background">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={() => {
                  setAvatarUrl(null)
                  setPreviewUrl(null)
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {/* Upload Trigger Overlay */}
          {!uploading && (
            <label
              htmlFor="profile-pic-upload"
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity rounded-full cursor-pointer group"
            >
              <div className="bg-background/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5 text-foreground" />
              </div>
            </label>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-1">Profile Photo</h3>
            <p className="text-xs text-muted-foreground">
              Upload a photo to personalize your profile. JPG, PNG or GIF. Max 5MB.
            </p>
          </div>

          {/* Actions */}
          {!previewUrl && !uploading && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="profile-pic-upload"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                {avatarUrl ? 'Change Photo' : 'Upload Photo'}
              </label>
            </div>
          )}

          {/* Preview Mode Actions */}
          {previewUrl && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Photo
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile photo updated successfully!</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium mb-1">Upload failed</p>
                <p className="text-xs">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        id="profile-pic-upload"
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
