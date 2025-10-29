'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Play, 
  Pause, 
  MessageSquare, 
  Volume2,
  VolumeX,
  Sparkles, 
  ChevronRight,
  Mic,
  Activity,
  SkipForward,
  Rewind,
  Zap,
  Video,
  Maximize2,
  Minimize2,
  Camera
} from 'lucide-react'

interface KeyMoment {
  id: string
  timestamp: number // in seconds
  title: string
  type: 'rapport' | 'discovery' | 'objection' | 'closing' | 'critical'
  description?: string
  quote?: string
}

interface SessionTimelineWithVideoProps {
  duration: number
  videoUrl?: string
  audioUrl?: string
  keyMoments?: KeyMoment[]
  customerName?: string
  salesRepName?: string
  dealOutcome?: {
    closed: boolean
    amount: number
    product: string
  }
}

export default function SessionTimelineWithVideo({ 
  duration, 
  videoUrl,
  audioUrl,
  keyMoments = [],
  customerName = 'Customer',
  salesRepName = 'Sales Rep',
  dealOutcome
}: SessionTimelineWithVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hoveredMoment, setHoveredMoment] = useState<string | null>(null)
  const [showVideo, setShowVideo] = useState(true)
  const [videoLoading, setVideoLoading] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Default key moments if none provided
  const defaultKeyMoments: KeyMoment[] = [
    {
      id: '1',
      timestamp: duration * 0.15,
      title: 'Opening & Rapport',
      type: 'rapport',
      description: 'Building initial connection',
      quote: "Hi there! Beautiful day, isn't it?"
    },
    {
      id: '2',
      timestamp: duration * 0.35,
      title: 'Discovery Questions',
      type: 'discovery',
      description: 'Understanding customer needs',
      quote: "What brought you to consider our services?"
    },
    {
      id: '3',
      timestamp: duration * 0.6,
      title: 'Handling Objections',
      type: 'objection',
      description: 'Addressing concerns',
      quote: "I understand your concern about the price..."
    },
    {
      id: '4',
      timestamp: duration * 0.85,
      title: 'Closing Attempt',
      type: 'closing',
      description: dealOutcome?.closed ? 'Successful close!' : 'Close attempt',
      quote: "So, shall we get you started today?"
    }
  ]

  const moments = keyMoments.length > 0 ? keyMoments : defaultKeyMoments

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getMomentColor = (type: KeyMoment['type']) => {
    const colors = {
      rapport: 'from-blue-500 to-cyan-500',
      discovery: 'from-purple-500 to-pink-500',
      objection: 'from-amber-500 to-orange-500',
      closing: dealOutcome?.closed ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500',
      critical: 'from-red-500 to-pink-500'
    }
    return colors[type] || 'from-slate-500 to-slate-400'
  }

  const getMomentIcon = (type: KeyMoment['type']) => {
    const icons = {
      rapport: MessageSquare,
      discovery: Mic,
      objection: Sparkles,
      closing: Zap,
      critical: Activity
    }
    return icons[type] || MessageSquare
  }

  const seekToMoment = async (moment: KeyMoment) => {
    if (videoRef.current) {
      videoRef.current.currentTime = moment.timestamp
      if (!isPlaying) {
        await videoRef.current.play()
        setIsPlaying(true)
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = moment.timestamp
      if (!isPlaying) {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const togglePlayPause = async () => {
    const media = videoRef.current || audioRef.current
    if (!media) return

    if (isPlaying) {
      media.pause()
    } else {
      await media.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    const media = videoRef.current || audioRef.current
    if (media) {
      media.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.() ||
      (containerRef.current as any).webkitRequestFullscreen?.() ||
      (containerRef.current as any).mozRequestFullScreen?.()
    } else {
      document.exitFullscreen?.() ||
      (document as any).webkitExitFullscreen?.() ||
      (document as any).mozCancelFullScreen?.()
    }
    setIsFullscreen(!isFullscreen)
  }

  const seekByOffset = (offset: number) => {
    const media = videoRef.current || audioRef.current
    if (media) {
      media.currentTime = Math.max(0, Math.min(duration, media.currentTime + offset))
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration
    
    const media = videoRef.current || audioRef.current
    if (media) {
      media.currentTime = newTime
    }
  }

  // Update current time
  useEffect(() => {
    const media = videoRef.current || audioRef.current
    if (!media) return

    const updateTime = () => {
      setCurrentTime(media.currentTime)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleLoadStart = () => setVideoLoading(true)
    const handleLoadedData = () => setVideoLoading(false)

    media.addEventListener('timeupdate', updateTime)
    media.addEventListener('play', handlePlay)
    media.addEventListener('pause', handlePause)
    media.addEventListener('loadstart', handleLoadStart)
    media.addEventListener('loadeddata', handleLoadedData)

    return () => {
      media.removeEventListener('timeupdate', updateTime)
      media.removeEventListener('play', handlePlay)
      media.removeEventListener('pause', handlePause)
      media.removeEventListener('loadstart', handleLoadStart)
      media.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [videoUrl, audioUrl])

  const progress = (currentTime / duration) * 100

  return (
    <div 
      ref={containerRef}
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}
    >
      {/* Video/Audio Player Section */}
      <div className={`${isFullscreen ? 'h-full' : 'mb-6'}`}>
        {videoUrl ? (
          <div className={`relative ${isFullscreen ? 'h-full' : 'aspect-video'} rounded-2xl overflow-hidden bg-slate-900`}>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              preload="metadata"
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {/* Progress Bar */}
                <div 
                  ref={progressBarRef}
                  className="relative h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer group"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="absolute h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  {/* Key Moment Markers */}
                  {moments.map((moment) => (
                    <div
                      key={moment.id}
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full cursor-pointer hover:scale-150 transition-transform"
                      style={{ left: `${(moment.timestamp / duration) * 100}%` }}
                      onClick={(e) => {
                        e.stopPropagation()
                        seekToMoment(moment)
                      }}
                      title={moment.title}
                    />
                  ))}
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Play/Pause */}
                    <button
                      onClick={togglePlayPause}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      disabled={videoLoading}
                    >
                      {videoLoading ? (
                        <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white" />
                      )}
                    </button>

                    {/* Seek Backward */}
                    <button
                      onClick={() => seekByOffset(-10)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <Rewind className="w-5 h-5 text-white" />
                    </button>

                    {/* Seek Forward */}
                    <button
                      onClick={() => seekByOffset(10)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <SkipForward className="w-5 h-5 text-white" />
                    </button>

                    {/* Mute/Unmute */}
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>

                    {/* Time Display */}
                    <div className="text-sm text-white font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-5 h-5 text-white" />
                    ) : (
                      <Maximize2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : audioUrl ? (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-purple-500/20">
                <Volume2 className="w-8 h-8 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Audio Recording</h3>
                <p className="text-sm text-slate-400">No video available for this session</p>
              </div>
              <button
                onClick={togglePlayPause}
                className="p-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
                disabled={videoLoading}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-purple-400" />
                ) : (
                  <Play className="w-6 h-6 text-purple-400" />
                )}
              </button>
            </div>
            <audio ref={audioRef} src={audioUrl} preload="metadata" />
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 text-center">
            <Camera className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No recording available for this session</p>
          </div>
        )}
      </div>

      {/* Key Moments Timeline */}
      {!isFullscreen && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm uppercase tracking-[0.25em] text-slate-500">Key Moments</h3>
          </div>

          <div className="grid gap-3">
            {moments.map((moment, index) => {
              const Icon = getMomentIcon(moment.type)
              const color = getMomentColor(moment.type)
              const isActive = currentTime >= moment.timestamp && 
                (index === moments.length - 1 || currentTime < moments[index + 1]?.timestamp)

              return (
                <motion.div
                  key={moment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredMoment(moment.id)}
                  onMouseLeave={() => setHoveredMoment(null)}
                  className={`
                    relative rounded-xl border transition-all duration-300 cursor-pointer
                    ${isActive 
                      ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/50' 
                      : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50'
                    }
                  `}
                  onClick={() => seekToMoment(moment)}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Icon and Timeline */}
                      <div className="flex-shrink-0">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        {index < moments.length - 1 && (
                          <div className="w-0.5 h-16 bg-slate-700/50 mx-auto mt-2" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-base font-semibold text-white">{moment.title}</h4>
                          <span className="text-sm font-mono text-slate-400">
                            {formatTime(moment.timestamp)}
                          </span>
                        </div>

                        {moment.description && (
                          <p className="text-sm text-slate-400 mb-2">{moment.description}</p>
                        )}

                        {moment.quote && (
                          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <p className="text-sm text-slate-300 italic">"{moment.quote}"</p>
                          </div>
                        )}

                        {/* Hover Play Button */}
                        <AnimatePresence>
                          {hoveredMoment === moment.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="mt-3"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  seekToMoment(moment)
                                }}
                                className={`
                                  px-4 py-2 rounded-lg text-sm font-medium
                                  bg-gradient-to-r ${color} text-white
                                  hover:shadow-lg transition-all duration-300
                                  flex items-center gap-2
                                `}
                              >
                                <Play className="w-4 h-4" />
                                Play from here
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500 rounded-l-xl" />
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
