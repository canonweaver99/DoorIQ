'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Video, Play, Trash2, Sparkles } from 'lucide-react'
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

export default function LearningPage() {
  const supabase = createClient()
  const [instructionalVideos, setInstructionalVideos] = useState<InstructionalVideo[]>([])
  const [teamVideos, setTeamVideos] = useState<TeamVideo[]>([])
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; type: 'instructional' | 'team' } | null>(null)
  const [userRole, setUserRole] = useState<'manager' | 'rep' | 'admin' | null>(null)

  useEffect(() => {
    fetchData()
    fetchUserRole()
  }, [])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1800px] mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Learning Center</h1>
          <p className="text-slate-400">Learn how to get the most out of DoorIQ</p>
        </motion.div>

        {/* Instructional Videos Section */}
        {instructionalVideos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">How to Use DoorIQ</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      <h4 className="text-base font-bold text-white mb-2 line-clamp-2">
                        {video.title}
                      </h4>
                      {video.description && (
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                      {video.file_size && (
                        <p className="text-xs text-slate-500">
                          {formatFileSize(video.file_size)}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )
              })}
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
            <h2 className="text-2xl font-bold text-white">
              {isManager ? 'Team Training Videos' : 'Training Videos'}
            </h2>
          </div>
          
          {teamVideos.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-12 text-center">
              <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">
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
                      <h4 className="text-base font-bold text-white mb-2 line-clamp-2">
                        {video.title}
                      </h4>
                      {video.description && (
                        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span>{formatDate(video.created_at)}</span>
                        {video.file_size && (
                          <span>{formatFileSize(video.file_size)}</span>
                        )}
                      </div>
                      {video.uploaded_by_name && (
                        <p className="text-xs text-slate-500 mb-2">
                          Uploaded by {video.uploaded_by_name}
                        </p>
                      )}
                      
                      {/* Delete button for managers */}
                      {isManager && (
                        <button
                          onClick={() => handleDeleteTeamVideo(video.id)}
                          className="mt-2 px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-2"
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

