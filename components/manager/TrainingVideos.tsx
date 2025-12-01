'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Video, Play, Trash2, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface InstructionalVideo {
  id: string
  team_id: string | null
  title: string
  description: string | null
  video_url: string
  file_name: string
  file_size: number | null
  display_order: number
  created_at: string
}

interface TeamVideo {
  id: string
  team_id: string
  uploaded_by: string
  uploaded_by_name?: string
  title: string
  description: string | null
  video_url: string
  file_name: string
  file_size: number | null
  created_at: string
}

export default function TrainingVideos() {
  const supabase = createClient()
  const [instructionalVideos, setInstructionalVideos] = useState<InstructionalVideo[]>([])
  const [teamVideos, setTeamVideos] = useState<TeamVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'instructional' | 'team'>('instructional')
  
  // Upload form state
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [isThumbnail, setIsThumbnail] = useState(false)
  const [displayOrder, setDisplayOrder] = useState(1)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // Cleanup video preview URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview)
      }
    }
  }, [videoPreview])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [instructionalRes, teamRes] = await Promise.all([
        fetch('/api/learning/instructional-videos'),
        fetch('/api/team/learning-videos')
      ])

      if (instructionalRes.ok) {
        const instructionalData = await instructionalRes.json()
        setInstructionalVideos(instructionalData.videos || [])
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeamVideos(teamData.videos || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const seekTime = Math.min(1, video.duration * 0.25)
        video.currentTime = seekTime
      }
      
      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          canvas.toBlob((blob) => {
            if (blob) {
              const thumbnailUrl = URL.createObjectURL(blob)
              resolve(thumbnailUrl)
            } else {
              reject(new Error('Failed to generate thumbnail'))
            }
          }, 'image/jpeg', 0.8)
        } else {
          reject(new Error('Canvas context not available'))
        }
      }
      
      video.onerror = () => {
        reject(new Error('Failed to load video'))
      }
      
      video.src = URL.createObjectURL(file)
    })
  }

  const handleFileSelect = async (file: File) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a video file (MP4, WebM, MOV, or AVI)')
      return
    }
    
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
      setVideoPreview(null)
      setIsThumbnail(false)
    }
    
    setUploadFile(file)
    
    try {
      const thumbnailUrl = await generateThumbnail(file)
      setVideoPreview(thumbnailUrl)
      setIsThumbnail(true)
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
      const videoUrl = URL.createObjectURL(file)
      setVideoPreview(videoUrl)
      setIsThumbnail(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      alert('Please select a video file and enter a title')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('title', uploadTitle.trim())
      if (uploadDescription.trim()) {
        formData.append('description', uploadDescription.trim())
      }

      const endpoint = activeTab === 'instructional'
        ? '/api/learning/instructional-videos'
        : '/api/team/learning-videos/upload'

      if (activeTab === 'instructional') {
        formData.append('display_order', displayOrder.toString())
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        if (videoPreview) {
          URL.revokeObjectURL(videoPreview)
        }
        setUploadTitle('')
        setUploadDescription('')
        setUploadFile(null)
        setVideoPreview(null)
        setIsThumbnail(false)
        setDisplayOrder(1)
        setShowUploadForm(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        await fetchData()
        alert('Video uploaded successfully!')
      } else {
        const errorData = await response.json()
        alert(`Upload failed: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Failed to upload video: ${error?.message || 'Network error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteTeamVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return
    }

    try {
      const response = await fetch(`/api/team/learning-videos?id=${videoId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchData()
      } else {
        const error = await response.json()
        alert(`Delete failed: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete video. Please try again.')
    }
  }

  const resetUploadForm = () => {
    setUploadTitle('')
    setUploadDescription('')
    setUploadFile(null)
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
    }
    setVideoPreview(null)
    setIsThumbnail(false)
    setDisplayOrder(1)
    setShowUploadForm(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  const videos = activeTab === 'instructional' ? instructionalVideos : teamVideos

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-[#2a2a2a]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setActiveTab('instructional')
              resetUploadForm()
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors font-space ${
              activeTab === 'instructional'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Instructional Videos
          </button>
          <button
            onClick={() => {
              setActiveTab('team')
              resetUploadForm()
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors font-space ${
              activeTab === 'team'
                ? 'text-white border-b-2 border-purple-500'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Team Videos
          </button>
        </div>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 font-space"
        >
          <Upload className="w-4 h-4" />
          Upload Video
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white font-space">Upload {activeTab === 'instructional' ? 'Instructional' : 'Team'} Video</h3>
            <button
              onClick={resetUploadForm}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg transition-all ${
              isDragging ? 'border-[#a855f7] bg-[#a855f7]/10' : 'border-[#2a2a2a]'
            } ${videoPreview ? 'p-0' : 'p-8 text-center'}`}
          >
            {videoPreview ? (
              <div className="relative">
                <div className="relative bg-black aspect-video rounded-t-lg overflow-hidden">
                  {isThumbnail ? (
                    <img
                      src={videoPreview}
                      alt="Video preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      ref={videoPreviewRef}
                      src={videoPreview}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end">
                    <div className="w-full p-4">
                      <p className="text-white text-sm font-medium truncate font-sans">
                        {uploadFile?.name}
                      </p>
                      {uploadFile && (
                        <p className="text-xs text-slate-300 mt-1 font-sans">
                          {formatFileSize(uploadFile.size)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-[#0a0a0a] rounded-b-lg border-t border-[#2a2a2a]">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileSelect(file)
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors text-sm font-space"
                  >
                    Change Video
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Video className="w-12 h-12 text-[#a855f7] mx-auto mb-4" />
                <p className="text-white mb-2 font-sans">Drag & drop a video file here</p>
                <p className="text-sm text-slate-400 mb-4 font-sans">
                  or click to browse (MP4, WebM, MOV, AVI)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#a855f7] text-white rounded-lg hover:bg-[#9333ea] transition-colors font-space"
                >
                  Choose File
                </button>
              </>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2 font-space">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Enter video title"
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#a855f7] font-sans"
              />
            </div>
            {activeTab === 'instructional' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2 font-space">
                  Display Order (1-4) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#a855f7] font-sans"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-white mb-2 font-space">
                Description (optional)
              </label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="Enter video description"
                rows={3}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#a855f7] resize-none font-sans"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || !uploadFile || !uploadTitle.trim()}
              className="w-full px-6 py-3 bg-[#a855f7] text-white font-medium rounded-lg hover:bg-[#9333ea] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-space"
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Videos Grid */}
      {videos.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center">
          <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-sans">
            No {activeTab === 'instructional' ? 'instructional' : 'team'} videos uploaded yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video, idx) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden hover:border-[#a855f7]/50 transition-colors relative"
            >
              <div className="relative bg-black aspect-video">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-indigo-900/20">
                  <Play className="w-12 h-12 text-white/50" />
                </div>
              </div>
              
              <div className="p-4">
                <h4 className="text-base font-bold text-white mb-2 line-clamp-2 font-space">
                  {video.title}
                </h4>
                {video.description && (
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2 font-sans">
                    {video.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-sans">
                  <span>{formatDate(video.created_at)}</span>
                  {video.file_size && (
                    <span>{formatFileSize(video.file_size)}</span>
                  )}
                </div>
                {'uploaded_by_name' in video && video.uploaded_by_name && (
                  <p className="text-xs text-slate-500 mb-2 font-sans">
                    Uploaded by {video.uploaded_by_name}
                  </p>
                )}
                {activeTab === 'team' && (
                  <button
                    onClick={() => handleDeleteTeamVideo(video.id)}
                    className="mt-2 px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2 font-space"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

