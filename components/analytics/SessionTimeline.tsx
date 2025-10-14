'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Clock, Play, Pause, MessageSquare } from 'lucide-react'

interface SessionTimelineProps {
  duration: number // in seconds
  events: any[]
  lineRatings?: any[]
  fullTranscript?: Array<{ speaker: string, text: string, timestamp?: string }>
  onEventClick?: (event: any) => void
  customerName?: string
  salesRepName?: string
  dealOutcome?: {
    closed: boolean
    amount: number
    product: string
  }
  failurePoint?: number
  audioUrl?: string
}

export default function SessionTimeline({ 
  duration, 
  events, 
  lineRatings = [],
  fullTranscript = [],
  customerName = 'Customer',
  salesRepName = 'Sales Rep',
  dealOutcome,
  audioUrl
}: SessionTimelineProps) {
  const [playingDot, setPlayingDot] = useState<number | null>(null)
  const [selectedDot, setSelectedDot] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Create 4 evenly spaced dots (25%, 50%, 75%, 100%)
  const timelineDots = [
    { 
      position: 25, 
      timestamp: formatTime(duration * 0.25),
      title: 'Opening',
      description: 'Introduction & rapport building',
      feedback: 'Focus on building connection and setting a positive tone'
    },
    { 
      position: 50, 
      timestamp: formatTime(duration * 0.5),
      title: 'Discovery',
      description: 'Needs assessment & questions',
      feedback: 'Ask quality questions to understand customer needs'
    },
    { 
      position: 75, 
      timestamp: formatTime(duration * 0.75),
      title: 'Objection Handling',
      description: 'Addressing concerns',
      feedback: 'Listen carefully and address objections with empathy'
    },
    { 
      position: 100, 
      timestamp: formatTime(duration),
      title: 'Close',
      description: 'Final pitch & commitment',
      feedback: 'Use assumptive language and ask for the sale'
    }
  ]

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const playAudioFrom = (timestamp: string, dotIndex: number) => {
    if (!audioUrl || !audioRef.current) return

    const [mins, secs] = timestamp.split(':').map(Number)
    const timeInSeconds = (mins * 60) + secs

    audioRef.current.currentTime = timeInSeconds
    audioRef.current.play()
    setPlayingDot(dotIndex)

    audioRef.current.onended = () => setPlayingDot(null)
    audioRef.current.onpause = () => setPlayingDot(null)
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setPlayingDot(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />}

      {/* Conversation Context Header */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-lg font-semibold text-white">{formatTime(duration)}</span>
                <span className="text-sm text-slate-400">conversation</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-slate-500">Customer: </span>
                <span className="text-white font-medium">{customerName}</span>
              </div>
              <div className="w-px h-4 bg-slate-700"></div>
              <div>
                <span className="text-slate-500">Sales Rep: </span>
                <span className="text-white font-medium">{salesRepName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Timeline with 4 Audio Playback Dots */}
      <div className="relative py-8">
        {/* Gradient bar */}
        <div className="relative h-2.5 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 via-orange-500 to-red-500"></div>
        
        {/* 4 Audio playback dots */}
        {timelineDots.map((dot, i) => {
          const isPlaying = playingDot === i
          const isSelected = selectedDot === i
          
          return (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${dot.position}%` }}
            >
              {/* Playback button dot */}
              <button
                onClick={() => {
                  if (isPlaying) {
                    stopAudio()
                  } else {
                    playAudioFrom(dot.timestamp, i)
                  }
                  setSelectedDot(isSelected ? null : i)
                }}
                className="group relative"
              >
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 border-2 border-white/20 flex items-center justify-center cursor-pointer shadow-lg hover:shadow-purple-500/50 transition-all"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.95 }}
                  animate={{
                    scale: isPlaying ? [1, 1.1, 1] : 1
                  }}
                  transition={{
                    scale: isPlaying ? {
                      repeat: Infinity,
                      duration: 1,
                      ease: "easeInOut"
                    } : undefined
                  }}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </motion.div>
              </button>

              {/* Feedback panel (shows when selected) */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-80 p-4 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 shadow-2xl z-50"
                >
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700/50">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <h4 className="text-sm font-semibold text-white">{dot.title}</h4>
                  </div>
                  
                  <p className="text-xs text-slate-400 mb-3">{dot.description}</p>
                  
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="text-[10px] uppercase tracking-wider text-purple-400 mb-1">Coach Tip:</div>
                    <p className="text-xs text-slate-300">{dot.feedback}</p>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedDot(null)
                    }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                  >
                    <span className="text-slate-400 text-xs">✕</span>
                  </button>

                  {/* Arrow pointing to dot */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                    <div className="w-3 h-3 bg-slate-900 border-r border-b border-purple-500/30 rotate-45"></div>
                  </div>
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {/* Time markers - Only show at 0 and end */}
      <div className="flex justify-between px-1 mt-6 text-xs text-slate-500 font-mono">
        <span>0:00</span>
        <span></span>
        <span></span>
        <span></span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}
