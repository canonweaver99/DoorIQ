'use client'

import { useEffect, useRef, useState } from 'react'

interface DoorClosingVideoProps {
  agentId: string
  agentName: string | null
  onComplete: () => void
  getAgentVideoPaths: (agentName: string | null | undefined) => { loop: string; closing: string; opening?: string } | null
}

export default function DoorClosingVideo({
  agentId,
  agentName,
  onComplete,
  getAgentVideoPaths,
}: DoorClosingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoError, setVideoError] = useState(false)
  const [fadeOutStarted, setFadeOutStarted] = useState(false)

  // Get the closing video path
  const videoPaths = getAgentVideoPaths(agentName)
  const closingVideoPath = videoPaths?.closing || '/austin-door-close.mp4' // Fallback to Austin's video

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Set video source
    video.src = closingVideoPath
    video.load()

    // Handle video ended
    const handleEnded = () => {
      console.log('🎬 Door closing video ended')
      // Wait 500ms then call onComplete
      setTimeout(() => {
        onComplete()
      }, 500)
    }

    // Handle video errors
    const handleError = () => {
      console.error('❌ Door closing video error')
      setVideoError(true)
      
      // Fade to black for 2 seconds then complete
      setFadeOutStarted(true)
      setTimeout(() => {
        onComplete()
      }, 2000)
    }

    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)

    // Try to play the video
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('✅ Door closing video started playing')
        })
        .catch((err) => {
          console.error('❌ Failed to play door closing video:', err)
          setVideoError(true)
          setFadeOutStarted(true)
          setTimeout(() => {
            onComplete()
          }, 2000)
        })
    }

    return () => {
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [closingVideoPath, onComplete])

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-[2000ms] ${
        fadeOutStarted ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {!videoError ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted={false}
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <div className="text-white/50 text-sm">Loading...</div>
        </div>
      )}
    </div>
  )
}

