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
          <span className="text-sm font-semibold text-white font-space">{personaName}</span>
        </div>
      )}
      
      {/* Session Timer with Live Indicator */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full border border-red-500/30 backdrop-blur-sm">
          <motion.div
            className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"
            animate={{ 
              opacity: [1, 0.6, 1],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          <span className="text-xs font-bold text-red-300 uppercase tracking-wider font-space">Live</span>
        </div>
        <span className="text-lg font-bold text-white transition-all duration-200 font-space">{formatDuration(duration)}</span>
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
          className={`p-2.5 rounded-lg transition-all duration-200 ${
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
          className={`p-2.5 rounded-lg transition-all duration-200 ${
            isCameraOff
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-700/80 hover:bg-slate-600 text-white'
          }`}
          aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onEndSession}
          className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-space"
          aria-label="End session"
        >
          <PhoneOff className="w-4 h-4" />
          <span>End Session</span>
        </motion.button>
      </div>
    </div>
  )
}

