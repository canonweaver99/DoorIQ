'use client'

import { useState, useRef } from 'react'
import { Paperclip, X, FileText, Image, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface FileUploadProps {
  onUpload: (files: Array<{ url: string; name: string; type: string; size: number }>) => void
  disabled?: boolean
}

export function FileUpload({ onUpload, disabled }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Max 5 files at once
    if (files.length > 5) {
      alert('You can only upload up to 5 files at once')
      return
    }

    // Check file sizes (max 50MB per file)
    const maxSize = 50 * 1024 * 1024 // 50MB
    const oversizedFiles = files.filter(file => file.size > maxSize)
    if (oversizedFiles.length > 0) {
      alert(`Some files are too large. Maximum size is 50MB per file.`)
      return
    }

    setSelectedFiles(files)
    uploadFiles(files)
  }

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const fileName = `${user.id}/${Date.now()}-${file.name}`
          const { data, error } = await supabase.storage
            .from('message-attachments')
            .upload(fileName, file)

          if (error) throw error

          const { data: { publicUrl } } = supabase.storage
            .from('message-attachments')
            .getPublicUrl(fileName)

          return {
            url: publicUrl,
            name: file.name,
            type: file.type,
            size: file.size
          }
        })
      )

      onUpload(uploadedFiles)
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Failed to upload files:', err)
      alert('Failed to upload files. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image
    return FileText
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Attach files"
      >
        {isUploading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Paperclip className="w-5 h-5" />
        )}
      </button>

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="absolute bottom-full left-0 mb-2 bg-[#1e1e30] border border-white/10 rounded-lg p-2 space-y-1 min-w-[200px]">
          {selectedFiles.map((file, index) => {
            const Icon = getFileIcon(file.type)
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="flex-1 text-white truncate">{file.name}</span>
                <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
