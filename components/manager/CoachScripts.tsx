'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Trash2, Eye, X, File } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useHaptic } from '@/hooks/useHaptic'
import { PullToRefresh } from '@/components/ui/pull-to-refresh'
import { useToast } from '@/components/ui/toast'

interface CoachingScript {
  id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  content_preview: string | null
  created_at: string
  updated_at: string
}

export default function CoachScripts() {
  const { showToast } = useToast()
  const isMobile = useIsMobile()
  const { trigger } = useHaptic()
  const [scripts, setScripts] = useState<CoachingScript[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [previewScript, setPreviewScript] = useState<CoachingScript | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadScripts()
  }, [])

  const loadScripts = async () => {
    try {
      const response = await fetch('/api/coach/script')
      if (response.ok) {
        const data = await response.json()
        setScripts(data.scripts || [])
      } else {
        console.error('Failed to load scripts')
      }
    } catch (error) {
      console.error('Error loading scripts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setLoading(true)
    await loadScripts()
    setLoading(false)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    await handleUpload(files)
  }

  const handleUpload = async (files: FileList) => {
    setUploading(true)
    trigger('impact')

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        const isTXT = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')

        if (!isPDF && !isTXT) {
          showToast({
            type: 'error',
            title: 'Invalid File Type',
            message: `${file.name} is not a valid file. Only PDF and TXT files are allowed.`
          })
          continue
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          showToast({
            type: 'error',
            title: 'File Too Large',
            message: `${file.name} exceeds the 10MB limit.`
          })
          continue
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/coach/script/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || errorData.error || 'Upload failed')
        }
      }

      // Reload scripts
      await loadScripts()
      showToast({
        type: 'success',
        title: 'Script Uploaded!',
        message: `Successfully uploaded ${Array.from(files).length} script(s).`
      })
    } catch (error: any) {
      console.error('Upload error:', error)
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Failed to upload script. Please try again.'
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const deleteScript = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coaching script?')) return

    try {
      const response = await fetch(`/api/coach/script?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setScripts(scripts.filter(s => s.id !== id))
        if (previewScript?.id === id) {
          setPreviewScript(null)
        }
        showToast({
          type: 'success',
          title: 'Script Deleted',
          message: 'Coaching script has been removed successfully.'
        })
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Delete failed')
      }
    } catch (error: any) {
      console.error('Delete error:', error)
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: error.message || 'Failed to delete script. Please try again.'
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
      <div className="space-y-6">
        {/* Header */}
        <div className={`flex items-center justify-between ${isMobile ? 'flex-col gap-4' : ''}`}>
          <div>
            <h2 className={`font-bold text-white font-space ${isMobile ? 'text-xl' : 'text-2xl'}`}>
              Coach Scripts
            </h2>
            <p className="text-white/70 text-sm mt-1">
              Upload sales scripts for real-time coaching during practice sessions
            </p>
          </div>

          {/* Upload Button */}
          <label
            htmlFor="script-upload"
            className={`
              flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 
              text-white rounded-lg cursor-pointer transition-colors
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
              ${isMobile ? 'w-full justify-center' : ''}
            `}
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Script'}</span>
          </label>
          <input
            id="script-upload"
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {/* Scripts List */}
        {scripts.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.02] border border-white/10 rounded-lg">
            <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 mb-2">No coaching scripts uploaded yet</p>
            <p className="text-white/50 text-sm">Upload a PDF or TXT file to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {scripts.map((script) => (
              <motion.div
                key={script.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.02] border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <File className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <h3 className="font-semibold text-white truncate">{script.file_name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                      <span>{formatFileSize(script.file_size)}</span>
                      <span>•</span>
                      <span>{script.file_type}</span>
                      <span>•</span>
                      <span>Uploaded {formatDate(script.created_at)}</span>
                    </div>
                    {script.content_preview && (
                      <p className="text-white/50 text-sm mt-2 line-clamp-2">
                        {script.content_preview}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setPreviewScript(script)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4 text-white/70" />
                    </button>
                    <button
                      onClick={() => deleteScript(script.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {previewScript && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-white/20 rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="font-semibold text-white">{previewScript.file_name}</h3>
                <button
                  onClick={() => setPreviewScript(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {previewScript.content_preview ? (
                  <pre className="text-white/80 text-sm whitespace-pre-wrap font-mono">
                    {previewScript.content_preview}
                  </pre>
                ) : (
                  <p className="text-white/60 text-center py-8">
                    Content preview not available. Download the file to view full content.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PullToRefresh>
  )
}
