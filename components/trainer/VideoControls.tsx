'use client'

import { useState } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { SessionProgressBar } from './SessionProgressBar'

interface VideoControlsProps {
  duration: number
  onMuteToggle?: () => void
  onCameraToggle?: () => void
  onEndSession?: () => void
  isMuted?: boolean
  isCameraOff?: boolean
  personaName?: string
}

export function VideoControls({
  duration,
  onMuteToggle,
  onCameraToggle,
  onEndSession,
  isMuted = false,
  isCameraOff = false,
  personaName
}: VideoControlsProps) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-10">
      {/* Persona Name */}
      {personaName && (
        <div className="mb-3">
          <span className="text-sm font-semibold text-white">{personaName}</span>
        </div>
      )}
      
      {/* Session Timer with Live Indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 rounded-full bg-red-500"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs font-semibold text-white uppercase tracking-wide">Live</span>
        </div>
        <span className="text-lg font-mono font-bold text-white">{formatDuration(duration)}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-3">
        <SessionProgressBar duration={duration} />
      </div>
      
      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMuteToggle}
          className={`p-2.5 rounded-lg transition-colors ${
            isMuted
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-700/80 hover:bg-slate-600 text-white'
          }`}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCameraToggle}
          className={`p-2.5 rounded-lg transition-colors ${
            isCameraOff
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-700/80 hover:bg-slate-600 text-white'
          }`}
          aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEndSession}
          className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          aria-label="End session"
        >
          <PhoneOff className="w-4 h-4" />
          <span>End Session</span>
        </motion.button>
      </div>
    </div>
  )
}

