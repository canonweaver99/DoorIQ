'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Video, Play, Sparkles, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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

export default function GettingStartedPage() {
  const [instructionalVideos, setInstructionalVideos] = useState<InstructionalVideo[]>([])
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState<{ id: string; type: 'instructional' | 'demo' } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [instructionalRes, watchedRes] = await Promise.all([
        fetch('/api/learning/instructional-videos'),
        fetch('/api/learning/watched')
      ])

      if (instructionalRes.ok) {
        const instructionalData = await instructionalRes.json()
        setInstructionalVideos(instructionalData.videos || [])
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

  const markAsWatched = async (videoId: string, videoType: 'instructional' | 'demo') => {
    const watchKey = `${videoType}:${videoId}`
    
    setWatchedIds(prev => new Set([...prev, watchKey]))

    try {
      await fetch('/api/learning/watched', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId, video_type: videoType })
      })
    } catch (error) {
      console.error('Error marking video as watched:', error)
      setWatchedIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(watchKey)
        return newSet
      })
    }
  }

  const handleVideoPlay = (videoId: string, videoType: 'instructional' | 'demo') => {
    setSelectedVideo({ id: videoId, type: videoType })
    markAsWatched(videoId, videoType)
  }

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>, videoId: string, videoType: 'instructional' | 'demo') => {
    const video = e.currentTarget
    if (video.currentTime / video.duration > 0.5) {
      const watchKey = `${videoType}:${videoId}`
      if (!watchedIds.has(watchKey)) {
        markAsWatched(videoId, videoType)
      }
    }
  }

  const isWatched = (videoId: string, videoType: 'instructional' | 'demo') => {
    return watchedIds.has(`${videoType}:${videoId}`)
  }

  if (loading) {
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
          <Link
            href="/learning"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 hover:border-slate-600/50 rounded-lg text-white mb-4 transition-all duration-200 font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Learning Center
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-space">New to DoorIQ?</h1>
          </div>
          <p className="text-slate-400 font-sans">Learn how to get the most out of DoorIQ</p>
        </motion.div>

        {/* Videos Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* Demo Video */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden hover:border-[#a855f7]/50 transition-colors relative"
            style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)' }}
          >
            <div className="absolute top-2 right-2 z-10">
              <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full">
                Demo
              </span>
            </div>
            
            <div className="relative bg-black aspect-video">
              {selectedVideo?.id === 'demo' && selectedVideo?.type === 'demo' ? (
                <video
                  src="https://fzhtqmbaxznikmxdglyl.supabase.co/storage/v1/object/public/Demo-Assets/public/demo-video-home.mp4"
                  controls
                  className="w-full h-full"
                  playsInline
                  onTimeUpdate={(e) => handleVideoTimeUpdate(e, 'demo', 'demo')}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-indigo-900/20">
                  <button
                    onClick={() => handleVideoPlay('demo', 'demo')}
                    className="p-4 bg-[#a855f7]/80 hover:bg-[#a855f7] rounded-full transition-colors shadow-lg"
                  >
                    <Play className="w-8 h-8 text-white" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h4 className="text-base font-bold text-white mb-2 line-clamp-2 font-space">
                DoorIQ Demo Video
              </h4>
              <p className="text-sm text-slate-400 mb-3 line-clamp-2 font-sans">
                See DoorIQ in action - watch how reps practice with AI homeowners
              </p>
            </div>
          </motion.div>
          
          {/* Instructional Videos */}
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
                {!watched && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="px-2 py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                      New
                    </span>
                  </div>
                )}
                
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
                
                <div className="p-4">
                  <h4 className="text-base font-bold text-white mb-2 line-clamp-2 font-space">
                    {video.title}
                  </h4>
                  {video.description && (
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2 font-sans">
                      {video.description}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {instructionalVideos.length === 0 && (
          <div className="text-center py-20">
            <Video className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-sans">
              No tutorial videos available yet. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

