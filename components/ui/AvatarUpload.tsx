'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, User, Loader2, CheckCircle2, Crop, RotateCcw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Cropper from 'react-easy-crop'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'

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
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Sync internal state when prop changes (important for when parent updates avatar)
  useEffect(() => {
    if (currentAvatarUrl !== avatarUrl) {
      console.log('🔄 Avatar URL prop changed, updating internal state')
      setAvatarUrl(currentAvatarUrl)
      setImageError(false)
    }
  }, [currentAvatarUrl])

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

  const generateCroppedImage = useCallback(async (): Promise<Blob | null> => {
    if (!previewUrl) return null
    const image = await createImage(previewUrl)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx || !croppedAreaPixels) return null
    const size = Math.max(croppedAreaPixels.width, croppedAreaPixels.height)
    canvas.width = size
    canvas.height = size
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      size,
      size
    )
    return await new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    })
  }, [previewUrl, croppedAreaPixels])

  const uploadAvatar = async () => {
    try {
      if (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) return
      setUploading(true)
      setUploadSuccess(false)
      let file = fileInputRef.current.files[0]
      let fileExt = file.name.split('.').pop()
      if (previewUrl) {
        const croppedBlob = await generateCroppedImage()
        if (croppedBlob) {
          file = new File([croppedBlob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', { type: 'image/jpeg' })
          fileExt = 'jpg'
        }
      }
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

      // Get public URL with cache buster
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Add timestamp to prevent caching issues
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      console.log('✅ Avatar uploaded successfully!')
      console.log('📷 Public URL:', publicUrl)
      console.log('📷 URL with cache buster:', urlWithCacheBuster)
      
      // Set avatar URL with cache buster for immediate display
      setAvatarUrl(urlWithCacheBuster)
      setPreviewUrl(null)
      setCropDialogOpen(false)
      setUploadSuccess(true)
      
      // Force re-render
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      console.log('📢 Calling onUploadComplete callback')
      if (onUploadComplete) {
        onUploadComplete(publicUrl)
      }
      
      console.log('🔄 Avatar state updated, should now display')

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
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
              onError={() => {
                console.error('❌ Preview image failed to load')
                setPreviewUrl(null)
              }}
            />
          ) : avatarUrl && !imageError ? (
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-full h-full object-cover"
              onError={() => {
                console.error('❌ Avatar image failed to load:', avatarUrl)
                setImageError(true)
              }}
              onLoad={() => {
                console.log('✅ Avatar image loaded successfully')
                setImageError(false)
              }}
              key={avatarUrl} // Force re-render when URL changes
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
          onChange={(e) => {
            onFileSelected(e)
            setCropDialogOpen(true)
          }}
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
        {previewUrl && !uploading && (
          <button
            onClick={() => setCropDialogOpen(true)}
            className="px-3 py-1.5 text-xs rounded-md bg-white/10 border border-white/15 hover:bg-white/15 text-white inline-flex items-center gap-1"
          >
            <Crop className="w-3 h-3" /> Crop
          </button>
        )}
      </div>

      {uploadSuccess && (
        <div className="text-xs text-green-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Avatar updated successfully!
        </div>
      )}

      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjust your avatar</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-64 bg-black/60 rounded-lg overflow-hidden">
            {previewUrl && (
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
              />
            )}
          </div>
          <div className="mt-4">
            <label className="text-xs text-slate-400 uppercase tracking-wide">Zoom</label>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(val) => setZoom(val[0])}
            />
          </div>
          <DialogFooter className="flex justify-between">
            <button
              onClick={() => {
                setPreviewUrl(null)
                setCropDialogOpen(false)
                setZoom(1)
                setCrop({ x: 0, y: 0 })
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-white/10 border border-white/15 hover:bg-white/15 text-white"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setCropDialogOpen(false)}
                className="px-3 py-1.5 text-xs rounded-md bg-white/10 border border-white/15 hover:bg-white/15 text-white"
              >
                Close
              </button>
              <button
                onClick={uploadAvatar}
                disabled={uploading}
                className="px-3 py-1.5 text-xs rounded-md bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white border border-white/10"
              >
                {uploading ? 'Uploading...' : 'Save Avatar'}
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

async function createImage(url: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

