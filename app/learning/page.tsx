'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Video, Play, Trash2, Sparkles, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useFeatureAccess } from '@/hooks/useSubscription'
import { FEATURES } from '@/lib/subscription/feature-access'
import { useRouter } from 'next/navigation'

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

export default function LearningPage() {
  const supabase = createClient()
  const router = useRouter()
  const { hasAccess, loading: accessLoading } = useFeatureAccess(FEATURES.LEARNING_PAGE)
  const [instructionalVideos, setInstructionalVideos] = useState<InstructionalVideo[]>([])
  const [teamVideos, setTeamVideos] = useState<TeamVideo[]>([])
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; type: 'instructional' | 'team' } | null>(null)
  const [userRole, setUserRole] = useState<'manager' | 'rep' | 'admin' | null>(null)
  
  // Upload form state
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [isThumbnail, setIsThumbnail] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    fetchData()
    fetchUserRole()
  }, [])

  // Cleanup video preview URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview)
      }
    }
  }, [videoPreview])

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile) {
      setUserRole(userProfile.role as 'manager' | 'rep' | 'admin')
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch instructional videos and team videos in parallel
      const [instructionalRes, teamRes, watchedRes] = await Promise.all([
        fetch('/api/learning/instructional-videos'),
        fetch('/api/team/learning-videos'),
        fetch('/api/learning/watched')
      ])

      if (instructionalRes.ok) {
        const instructionalData = await instructionalRes.json()
        setInstructionalVideos(instructionalData.videos || [])
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json()
        setTeamVideos(teamData.videos || [])
      }

      if (watchedRes.ok) {
        const watchedData = await watchedRes.json()
        setWatchedIds(new Set(watchedData.watched_ids || []))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsWatched = async (videoId: string, videoType: 'instructional' | 'team') => {
    const watchKey = `${videoType}:${videoId}`
    
    // Optimistically update UI
    setWatchedIds(prev => new Set([...prev, watchKey]))

    try {
      await fetch('/api/learning/watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, video_type: videoType })
      })
    } catch (error) {
      console.error('Error marking video as watched:', error)
      // Revert optimistic update on error
      setWatchedIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(watchKey)
        return newSet
      })
    }
  }

  const handleVideoPlay = (videoId: string, videoType: 'instructional' | 'team') => {
    setSelectedVideo({ id: videoId, type: videoType })
    markAsWatched(videoId, videoType)
  }

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>, videoId: string, videoType: 'instructional' | 'team') => {
    const video = e.currentTarget
    // Mark as watched if user watches more than 50% of the video
    if (video.currentTime / video.duration > 0.5) {
      const watchKey = `${videoType}:${videoId}`
      if (!watchedIds.has(watchKey)) {
        markAsWatched(videoId, videoType)
      }
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

  const isWatched = (videoId: string, videoType: 'instructional' | 'team') => {
    return watchedIds.has(`${videoType}:${videoId}`)
  }

  const isManager = userRole === 'manager' || userRole === 'admin'

  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        // Set canvas size to video dimensions
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        // Seek to 1 second or 25% of video duration (whichever is smaller)
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
    
    // Clean up previous preview if exists
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
      setVideoPreview(null)
      setIsThumbnail(false)
    }
    
    setUploadFile(file)
    
    // Generate thumbnail preview
    try {
      const thumbnailUrl = await generateThumbnail(file)
      setVideoPreview(thumbnailUrl)
      setIsThumbnail(true)
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
      // Create a simple video preview URL as fallback
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

      console.log('📤 Starting upload request...')
      console.log('📦 File:', {
        name: uploadFile.name,
        size: uploadFile.size,
        type: uploadFile.type
      })
      
      const response = await fetch('/api/team/learning-videos/upload', {
        method: 'POST',
        body: formData
      })
      
      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        // Clean up preview URL
        if (videoPreview) {
          URL.revokeObjectURL(videoPreview)
        }
        // Reset form
        setUploadTitle('')
        setUploadDescription('')
        setUploadFile(null)
        setVideoPreview(null)
        setIsThumbnail(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        // Refresh videos list
        await fetchData()
        alert('Video uploaded successfully!')
      } else {
        // Try to get error details from response
        let errorData: any = { error: 'Unknown error occurred' }
        const contentType = response.headers.get('content-type')
        
        try {
          // Clone the response so we can read it multiple times
          const responseClone = response.clone()
          const responseText = await responseClone.text()
          console.error('📄 Raw error response text:', responseText)
          
          if (contentType && contentType.includes('application/json')) {
            try {
              errorData = JSON.parse(responseText)
            } catch (jsonError) {
              console.error('❌ Failed to parse JSON:', jsonError)
              errorData = {
                error: `Server error (${response.status})`,
                details: responseText || `HTTP ${response.status} ${response.statusText}`
              }
            }
          } else {
            console.error('⚠️ Non-JSON error response')
            errorData = { 
              error: `Server error (${response.status})`,
              details: responseText || `HTTP ${response.status} ${response.statusText}`
            }
          }
        } catch (parseError: any) {
          console.error('❌ Failed to read error response:', parseError)
          console.error('Parse error details:', {
            message: parseError?.message,
            stack: parseError?.stack,
            name: parseError?.name
          })
          errorData = {
            error: `Server error (${response.status})`,
            details: `Failed to read response: ${parseError?.message || 'Unknown error'}`
          }
        }
        
        const errorMessage = errorData.details 
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || `Upload failed with status ${response.status}`
        
        console.error('Upload failed - Status:', response.status)
        console.error('Upload failed - Error data:', errorData)
        console.error('Upload failed - Response headers:', Object.fromEntries(response.headers.entries()))
        
        alert(`Upload failed: ${errorMessage}`)
      }
    } catch (error: any) {
      console.error('Upload error (catch block):', error)
      console.error('Error stack:', error?.stack)
      const errorMessage = error?.message || 'Network error. Please check your connection and try again.'
      alert(`Failed to upload video: ${errorMessage}`)
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

  if (loading || accessLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836] py-8 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    )
  }

  // Check if user has access to Learning page
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836] py-8 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <Lock className="w-16 h-16 text-purple-400 mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4 font-space">Custom Sales Playbook Unavailable</h2>
            <p className="text-slate-400 text-center max-w-md mb-8 font-sans">
              The Learning page with Custom Sales Playbook is only available for Team and Enterprise plans. 
              Upgrade to Team plan to access this feature.
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors font-sans"
            >
              View Plans
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836] py-8 px-4 sm:px-6 lg:px-8 pt-32">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-space">Learning Center</h1>
          <p className="text-slate-400 font-sans">Learn how to get the most out of DoorIQ</p>
        </motion.div>

        {/* Instructional Videos Section */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-2xl font-bold text-white font-space">How to Use DoorIQ</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Demo Video - Hardcoded */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden hover:border-[#a855f7]/50 transition-colors relative"
                style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
              >
                {/* Demo Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full">
                    Demo
                  </span>
                </div>
                
                {/* Video Player */}
                <div className="relative bg-black aspect-video">
                  <video
                    src="https://fzhtqmbaxznikmxdglyl.supabase.co/storage/v1/object/public/Demo-Assets/public/demo-video-home.mp4"
                    controls
                    className="w-full h-full"
                    playsInline
                  />
                </div>
                
                {/* Video Info */}
                <div className="p-4">
                  <h4 className="text-base font-bold text-white mb-2 line-clamp-2 font-space">
                    DoorIQ Demo Video
                  </h4>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2 font-sans">
                    See DoorIQ in action - watch how reps practice with AI homeowners
                  </p>
                </div>
              </motion.div>
              
              {instructionalVideos.map((video, idx) => {
                const watched = isWatched(video.id, 'instructional')
                const isSelected = selectedVideo?.id === video.id && selectedVideo?.type === 'instructional'
                
                return (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 + idx * 0.1 }}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden hover:border-[#a855f7]/50 transition-colors relative"
                    style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
                  >
                    {/* New Badge */}
                    {!watched && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="px-2 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                          New
                        </span>
                      </div>
                    )}
                    
                    {/* Video Player */}
                    <div className="relative bg-black aspect-video">
                      {isSelected ? (
                        <video
                          src={video.video_url}
                          controls
                          className="w-full h-full"
                          onTimeUpdate={(e) => handleVideoTimeUpdate(e, video.id, 'instructional')}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-indigo-900/20">
                          <button
                            onClick={() => handleVideoPlay(video.id, 'instructional')}
                            className="p-4 bg-[#a855f7]/80 hover:bg-[#a855f7] rounded-full transition-colors shadow-lg"
                          >
                            <Play className="w-8 h-8 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Video Info */}
                    <div className="p-4">
                      <h4 className="text-base font-bold text-white mb-2 line-clamp-2 font-space">
                        {video.title}
                      </h4>
                      {video.description && (
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2 font-sans">
                          {video.description}
                        </p>
                      )}
                      {video.file_size && (
                        <p className="text-xs text-slate-500 font-sans">
                          {formatFileSize(video.file_size)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

        {/* Upload Section for Managers */}
        {isManager && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="mb-12"
          >
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6"
              style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
            >
              <h3 className="text-lg font-bold text-white mb-4 font-space">Upload Training Video</h3>
              
              {/* File Upload Area */}
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
                    {/* Video Preview Thumbnail */}
                    <div className="relative bg-black aspect-video rounded-t-lg overflow-hidden">
                      {isThumbnail ? (
                        // Thumbnail image
                        <img
                          src={videoPreview}
                          alt="Video preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        // Video preview fallback
                        <video
                          ref={videoPreviewRef}
                          src={videoPreview}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      )}
                      {/* Overlay with file info */}
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
                    {/* Change file button */}
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
                    <p className="text-white mb-2 font-sans">
                      Drag & drop a video file here
                    </p>
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

              {/* Title and Description */}
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
            </div>
          </motion.div>
        )}

        {/* Team Videos Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Video className="w-5 h-5 text-purple-400" />
            <h2 className="text-2xl font-bold text-white font-space">
              {isManager ? 'Team Training Videos' : 'Training Videos'}
            </h2>
          </div>
          
          {teamVideos.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center">
              <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 font-sans">
                {isManager ? 'No videos uploaded yet.' : 'No training videos available yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamVideos.map((video, idx) => {
                const watched = isWatched(video.id, 'team')
                const isSelected = selectedVideo?.id === video.id && selectedVideo?.type === 'team'
                
                return (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + idx * 0.05 }}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden hover:border-[#a855f7]/50 transition-colors relative"
                    style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
                  >
                    {/* New Badge */}
                    {!watched && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="px-2 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                          New
                        </span>
                      </div>
                    )}
                    
                    {/* Video Player */}
                    <div className="relative bg-black aspect-video">
                      {isSelected ? (
                        <video
                          src={video.video_url}
                          controls
                          className="w-full h-full"
                          onTimeUpdate={(e) => handleVideoTimeUpdate(e, video.id, 'team')}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-indigo-900/20">
                          <button
                            onClick={() => handleVideoPlay(video.id, 'team')}
                            className="p-4 bg-[#a855f7]/80 hover:bg-[#a855f7] rounded-full transition-colors shadow-lg"
                          >
                            <Play className="w-8 h-8 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Video Info */}
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
                      {video.uploaded_by_name && (
                        <p className="text-xs text-slate-500 mb-2 font-sans">
                          Uploaded by {video.uploaded_by_name}
                        </p>
                      )}
                      
                      {/* Delete button for managers */}
                      {isManager && (
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
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

