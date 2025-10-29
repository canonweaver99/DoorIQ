'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, VideoOff, Minimize2, Maximize2 } from 'lucide-react'

interface VideoRecordingPreviewProps {
  stream: MediaStream | null
  isRecording: boolean
}

export default function VideoRecordingPreview({ stream, isRecording }: VideoRecordingPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [hasVideo, setHasVideo] = useState(false)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      const videoTracks = stream.getVideoTracks()
      setHasVideo(videoTracks.length > 0)
    }
  }, [stream])

  if (!stream || !isRecording || !hasVideo) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className={`fixed z-50 transition-all duration-300 ${
          isMinimized 
            ? 'bottom-4 right-4 w-32 h-24' 
            : 'bottom-8 right-8 w-80 h-60'
        }`}
      >
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-900 shadow-2xl border border-purple-500/30">
          {/* Video Preview */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }} // Mirror the video
          />

          {/* Recording Indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping" />
              <div className="relative w-3 h-3 bg-red-500 rounded-full" />
            </div>
            <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded-full">
              Recording
            </span>
          </div>

          {/* Controls */}
          <div className="absolute top-3 right-3">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-white" />
              ) : (
                <Minimize2 className="w-4 h-4 text-white" />
              )}
            </button>
          </div>

          {/* Label when minimized */}
          {isMinimized && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex items-center gap-1 text-white bg-black/50 px-2 py-1 rounded-full">
                <Video className="w-3 h-3" />
                <span className="text-xs font-medium truncate">Video Recording</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
