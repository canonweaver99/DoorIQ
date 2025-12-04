'use client'

import { useState } from 'react'
import { Mic, MicOff, Video, VideoOff, PhoneOff, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import { SessionProgressBar } from './SessionProgressBar'

interface VideoControlsProps {
  duration: number
  onMuteToggle?: () => void
  onCameraToggle?: () => void
  onEndSession?: () => void
  onRestartSession?: () => void
  isMuted?: boolean
  isCameraOff?: boolean
  personaName?: string
}

export function VideoControls({
  duration,
  onMuteToggle,
  onCameraToggle,
  onEndSession,
  onRestartSession,
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
    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/70 to-transparent z-10 md:z-10 mb-[64px] md:mb-0">
      {/* Session Timer with Live Indicator */}
      <div className="hidden sm:flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/20 rounded-full border border-red-500/30 backdrop-blur-sm">
          <motion.div
            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"
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
          <span className="text-[10px] sm:text-xs font-bold text-red-300 uppercase tracking-wider font-space">Live</span>
        </div>
        <span className="text-base sm:text-lg font-bold text-white transition-all duration-200 font-space">{formatDuration(duration)}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="hidden sm:block mb-2 sm:mb-3">
        <SessionProgressBar duration={duration} />
      </div>
      
      {/* Control Buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onMuteToggle}
          className={`hidden sm:flex p-2 sm:p-2.5 rounded-lg transition-all duration-200 touch-manipulation ${
            isMuted
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-700/80 hover:bg-slate-600 text-white'
          }`}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onCameraToggle}
          className={`hidden sm:flex p-2 sm:p-2.5 rounded-lg transition-all duration-200 touch-manipulation ${
            isCameraOff
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-slate-700/80 hover:bg-slate-600 text-white'
          }`}
          aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
        </motion.button>
        
        {onRestartSession && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestartSession}
            className="hidden sm:flex p-2 sm:p-2.5 rounded-lg transition-all duration-200 touch-manipulation bg-slate-700/80 hover:bg-slate-600 text-white"
            aria-label="Restart session"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        )}
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onEndSession}
          className="hidden sm:flex flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base font-semibold rounded-lg transition-all duration-200 items-center justify-center gap-1.5 sm:gap-2 font-space touch-manipulation min-w-0"
          aria-label="End session"
        >
          <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span>End Session</span>
        </motion.button>
      </div>
    </div>
  )
}

